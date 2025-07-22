// src/app/api/security/events/route.ts - Security event monitoring
import { trackError } from '@/lib/error-tracking';
import { monitoring } from '@/lib/monitoring';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

interface SecurityEvent {
  id: string;
  timestamp: string;
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent?: string;
  pathname: string;
  method: string;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

// Critical events that require immediate attention
const CRITICAL_EVENTS = [
  'admin_access_denied',
  'suspicious_input_detected',
  'rate_limit_exceeded',
  'authentication_failure',
  'data_breach_attempt',
  'privilege_escalation'
];

// Events that indicate potential attacks
const ATTACK_PATTERNS = [
  'sql_injection_attempt',
  'xss_attempt',
  'directory_traversal',
  'command_injection',
  'file_upload_malware',
  'brute_force_attack'
];

export async function POST(request: NextRequest) {
  monitoring.recordRequest();
  const startTime = Date.now();

  try {
    const eventData = await request.json();
    
    if (!eventData.event || !eventData.timestamp) {
      return NextResponse.json(
        { error: 'Invalid security event data' },
        { status: 400 }
      );
    }

    // Determine event severity
    const severity = determineSeverity(eventData.event, eventData.metadata);
    
    const securityEvent: SecurityEvent = {
      id: crypto.randomUUID(),
      ...eventData,
      severity,
      resolved: false
    };

    // Store in Firestore
    const db = getFirestore();
    await db.collection('security_events').doc(securityEvent.id).set(securityEvent);

    // Handle critical events
    if (severity === 'critical') {
      await handleCriticalEvent(securityEvent);
    }

    // Check for attack patterns
    if (ATTACK_PATTERNS.some(pattern => eventData.event.includes(pattern))) {
      await analyzeAttackPattern(securityEvent);
    }

    monitoring.recordResponseTime(Date.now() - startTime);
    
    return NextResponse.json({ 
      success: true, 
      eventId: securityEvent.id,
      severity: severity
    });

  } catch (error) {
    monitoring.recordError();
    trackError(error as Error, { 
      category: 'system', 
      severity: 'high',
      url: request.url 
    });
    
    return NextResponse.json(
      { error: 'Failed to process security event' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');
    const limit = parseInt(searchParams.get('limit') || '100');

    const db = getFirestore();
    let query: any = db.collection('security_events');

    // Apply time filter
    const now = new Date();
    let startTime: Date;
    
    switch (timeframe) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    query = query.where('timestamp', '>=', startTime.toISOString());

    if (severity) {
      query = query.where('severity', '==', severity);
    }

    if (resolved !== null) {
      query = query.where('resolved', '==', resolved === 'true');
    }

    const snapshot = await query
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const events = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Generate security analytics
    const analytics = {
      total: events.length,
      bySeverity: events.reduce((acc: any, event: any) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1;
        return acc;
      }, {}),
      byEvent: events.reduce((acc: any, event: any) => {
        acc[event.event] = (acc[event.event] || 0) + 1;
        return acc;
      }, {}),
      unresolved: events.filter((e: any) => !e.resolved).length,
      topIPs: getTopIPs(events),
      threatLevel: calculateThreatLevel(events),
      timeframe
    };

    return NextResponse.json({ events, analytics });

  } catch (error) {
    console.error('Failed to fetch security events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security events' },
      { status: 500 }
    );
  }
}

// Mark security event as resolved
export async function PATCH(request: NextRequest) {
  try {
    const { eventId, resolvedBy, notes } = await request.json();
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const db = getFirestore();
    await db.collection('security_events').doc(eventId).update({
      resolved: true,
      resolvedAt: new Date().toISOString(),
      resolvedBy,
      resolutionNotes: notes
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Failed to resolve security event:', error);
    return NextResponse.json(
      { error: 'Failed to resolve security event' },
      { status: 500 }
    );
  }
}

// Helper functions
function determineSeverity(
  event: string, 
  metadata: any = {}
): 'low' | 'medium' | 'high' | 'critical' {
  // Critical events
  if (CRITICAL_EVENTS.some(critical => event.includes(critical))) {
    return 'critical';
  }

  // High severity events
  if (event.includes('authentication_failure') || 
      event.includes('unauthorized_access') ||
      event.includes('data_export') ||
      metadata?.repeated_attempts > 5) {
    return 'high';
  }

  // Medium severity events
  if (event.includes('suspicious_') || 
      event.includes('rate_limit') ||
      event.includes('input_validation')) {
    return 'medium';
  }

  // Default to low severity
  return 'low';
}

async function handleCriticalEvent(event: SecurityEvent): Promise<void> {
  try {
    // Log critical event
    console.error('🚨 CRITICAL SECURITY EVENT:', event);

    // Send immediate notification
    await fetch('/api/alerts/critical-security', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: event.event,
        ip: event.ip,
        timestamp: event.timestamp,
        metadata: event.metadata
      })
    });

    // Auto-block IP if necessary
    if (shouldAutoBlock(event)) {
      await autoBlockIP(event.ip, event.event);
    }

  } catch (error) {
    console.error('Failed to handle critical event:', error);
  }
}

async function analyzeAttackPattern(event: SecurityEvent): Promise<void> {
  try {
    const db = getFirestore();
    
    // Check for repeated attacks from same IP
    const recentEvents = await db.collection('security_events')
      .where('ip', '==', event.ip)
      .where('timestamp', '>=', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .get();

    if (recentEvents.size >= 5) {
      // Multiple attacks from same IP - escalate
      console.warn('🔴 ATTACK PATTERN DETECTED:', {
        ip: event.ip,
        eventCount: recentEvents.size,
        timeWindow: '1 hour'
      });

      await handleCriticalEvent({
        ...event,
        event: 'attack_pattern_detected',
        severity: 'critical',
        metadata: {
          ...event.metadata,
          attackCount: recentEvents.size,
          timeWindow: '1h'
        }
      });
    }

  } catch (error) {
    console.error('Failed to analyze attack pattern:', error);
  }
}

function shouldAutoBlock(event: SecurityEvent): boolean {
  const autoBlockEvents = [
    'sql_injection_attempt',
    'command_injection',
    'directory_traversal',
    'brute_force_attack'
  ];

  return autoBlockEvents.some(blockEvent => event.event.includes(blockEvent));
}

async function autoBlockIP(ip: string, reason: string): Promise<void> {
  try {
    // In production, integrate with your firewall/WAF
    console.warn('🚫 AUTO-BLOCKING IP:', { ip, reason });
    
    // Store in blocked IPs collection
    const db = getFirestore();
    await db.collection('blocked_ips').doc(ip).set({
      ip,
      reason,
      blockedAt: new Date().toISOString(),
      autoBlocked: true,
      active: true
    });

  } catch (error) {
    console.error('Failed to auto-block IP:', error);
  }
}

function getTopIPs(events: any[]): any[] {
  const ipCounts = events.reduce((acc: any, event: any) => {
    acc[event.ip] = (acc[event.ip] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(ipCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([ip, count]) => ({ ip, count }));
}

function calculateThreatLevel(events: any[]): 'low' | 'medium' | 'high' | 'critical' {
  if (events.length === 0) return 'low';

  const criticalCount = events.filter(e => e.severity === 'critical').length;
  const highCount = events.filter(e => e.severity === 'high').length;
  
  if (criticalCount > 0) return 'critical';
  if (highCount > 5) return 'high';
  if (events.length > 20) return 'medium';
  
  return 'low';
}
