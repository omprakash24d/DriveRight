// src/app/api/security/ip-blocks/route.ts - IP blocking management
import { trackError } from '@/lib/error-tracking';
import { monitoring } from '@/lib/monitoring';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

interface BlockedIP {
  ip: string;
  reason: string;
  blockedAt: string;
  blockedBy?: string;
  expiresAt?: string;
  autoBlocked: boolean;
  active: boolean;
  attempts?: number;
  lastAttempt?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  monitoring.recordRequest();
  const startTime = Date.now();

  try {
    const { ip, reason, duration, blockedBy, notes } = await request.json();
    
    if (!ip || !reason) {
      return NextResponse.json(
        { error: 'IP address and reason are required' },
        { status: 400 }
      );
    }

    // Validate IP format
    if (!isValidIP(ip)) {
      return NextResponse.json(
        { error: 'Invalid IP address format' },
        { status: 400 }
      );
    }

    const now = new Date();
    const blockData: BlockedIP = {
      ip,
      reason,
      blockedAt: now.toISOString(),
      blockedBy,
      autoBlocked: false,
      active: true,
      notes
    };

    // Set expiration if duration provided
    if (duration) {
      const expirationTime = new Date(now.getTime() + parseDuration(duration));
      blockData.expiresAt = expirationTime.toISOString();
    }

    // Store in Firestore
    const db = getFirestore();
    await db.collection('blocked_ips').doc(ip).set(blockData);

    // Log security event
    await logSecurityEvent({
      event: 'ip_blocked',
      severity: 'medium',
      ip,
      metadata: { reason, duration, blockedBy, manual: true }
    });

    monitoring.recordResponseTime(Date.now() - startTime);
    
    return NextResponse.json({ 
      success: true, 
      blocked: ip,
      expiresAt: blockData.expiresAt 
    });

  } catch (error) {
    monitoring.recordError();
    trackError(error as Error, { 
      category: 'system', 
      severity: 'high',
      url: request.url 
    });
    
    return NextResponse.json(
      { error: 'Failed to block IP address' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'active', 'expired', 'all'
    const limit = parseInt(searchParams.get('limit') || '100');
    const autoBlocked = searchParams.get('autoBlocked');

    const db = getFirestore();
    let query: any = db.collection('blocked_ips');

    // Filter by status
    if (status === 'active') {
      query = query.where('active', '==', true);
    } else if (status === 'expired') {
      query = query.where('active', '==', false);
    }

    // Filter by auto-blocked
    if (autoBlocked !== null) {
      query = query.where('autoBlocked', '==', autoBlocked === 'true');
    }

    const snapshot = await query
      .orderBy('blockedAt', 'desc')
      .limit(limit)
      .get();

    const blockedIPs = snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      id: doc.id
    }));

    // Check for expired blocks and update them
    const now = new Date();
    const expiredBlocks = blockedIPs.filter((block: any) => 
      block.expiresAt && 
      new Date(block.expiresAt) <= now && 
      block.active
    );

    // Update expired blocks
    for (const block of expiredBlocks) {
      await db.collection('blocked_ips').doc(block.ip).update({
        active: false,
        expiredAt: now.toISOString()
      });
    }

    // Generate analytics
    const analytics = {
      total: blockedIPs.length,
      active: blockedIPs.filter((b: any) => b.active).length,
      expired: blockedIPs.filter((b: any) => !b.active).length,
      autoBlocked: blockedIPs.filter((b: any) => b.autoBlocked).length,
      manualBlocked: blockedIPs.filter((b: any) => !b.autoBlocked).length,
      topReasons: getTopReasons(blockedIPs),
      recentBlocks: blockedIPs.slice(0, 10)
    };

    return NextResponse.json({ blockedIPs, analytics });

  } catch (error) {
    console.error('Failed to fetch blocked IPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked IPs' },
      { status: 500 }
    );
  }
}

// Unblock IP address
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');
    const unblockedBy = searchParams.get('unblockedBy');
    
    if (!ip) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      );
    }

    const db = getFirestore();
    
    // Check if IP is blocked
    const blockDoc = await db.collection('blocked_ips').doc(ip).get();
    if (!blockDoc.exists) {
      return NextResponse.json(
        { error: 'IP address is not blocked' },
        { status: 404 }
      );
    }

    // Update block status
    await db.collection('blocked_ips').doc(ip).update({
      active: false,
      unblockedAt: new Date().toISOString(),
      unblockedBy
    });

    // Log security event
    await logSecurityEvent({
      event: 'ip_unblocked',
      severity: 'low',
      ip,
      metadata: { unblockedBy, manual: true }
    });

    return NextResponse.json({ success: true, unblocked: ip });

  } catch (error) {
    console.error('Failed to unblock IP:', error);
    return NextResponse.json(
      { error: 'Failed to unblock IP address' },
      { status: 500 }
    );
  }
}

// Check if IP is blocked
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');
    
    if (!ip) {
      return new NextResponse(null, { status: 400 });
    }

    const isBlocked = await checkIPBlocked(ip);
    
    return new NextResponse(null, { 
      status: isBlocked ? 403 : 200,
      headers: {
        'X-IP-Blocked': isBlocked.toString(),
        'X-Block-Reason': isBlocked ? 'IP address is blocked' : 'IP address is not blocked'
      }
    });

  } catch (error) {
    console.error('Failed to check IP status:', error);
    return new NextResponse(null, { status: 500 });
  }
}

// Helper functions
function isValidIP(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([hmdy])$/);
  if (!match) throw new Error('Invalid duration format');
  
  const [, amount, unit] = match;
  const num = parseInt(amount);
  
  switch (unit) {
    case 'h': return num * 60 * 60 * 1000; // hours
    case 'd': return num * 24 * 60 * 60 * 1000; // days
    case 'm': return num * 60 * 1000; // minutes
    case 'y': return num * 365 * 24 * 60 * 60 * 1000; // years
    default: throw new Error('Invalid duration unit');
  }
}

async function checkIPBlocked(ip: string): Promise<boolean> {
  try {
    const db = getFirestore();
    const blockDoc = await db.collection('blocked_ips').doc(ip).get();
    
    if (!blockDoc.exists) return false;
    
    const blockData = blockDoc.data() as BlockedIP;
    
    // Check if block is active
    if (!blockData.active) return false;
    
    // Check if block has expired
    if (blockData.expiresAt && new Date(blockData.expiresAt) <= new Date()) {
      // Auto-expire the block
      await db.collection('blocked_ips').doc(ip).update({
        active: false,
        expiredAt: new Date().toISOString()
      });
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.error('Failed to check IP block status:', error);
    return false; // Fail open for availability
  }
}

async function logSecurityEvent(event: any): Promise<void> {
  try {
    await fetch('/api/security/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
        pathname: '/api/security/ip-blocks',
        method: 'POST'
      })
    });
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

function getTopReasons(blocks: any[]): any[] {
  const reasonCounts = blocks.reduce((acc: any, block: any) => {
    acc[block.reason] = (acc[block.reason] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(reasonCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([reason, count]) => ({ reason, count }));
}
