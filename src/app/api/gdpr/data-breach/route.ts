// src/app/api/gdpr/data-breach/route.ts - Data Breach Notification API
import { auditLogger } from '@/lib/audit-logger';
import { gdprCompliance } from '@/lib/gdpr-compliance';
import { monitoring } from '@/lib/monitoring';
import { NextRequest, NextResponse } from 'next/server';

interface DataBreach {
  id: string;
  description: string;
  affectedUsers: string[];
  dataCategories: string[];
  riskLevel: 'low' | 'medium' | 'high';
  containmentMeasures: string[];
  reportedBy: string;
  reportDate: string;
  status: 'reported' | 'investigating' | 'contained' | 'resolved';
  authorityNotified: boolean;
  usersNotified: boolean;
  discoveryDate?: string;
  causeAnalysis?: string;
  preventiveMeasures?: string;
  estimatedImpact?: string;
  notificationDeadline?: string;
}

export async function POST(request: NextRequest) {
  monitoring.recordRequest();
  const startTime = Date.now();

  try {
    const breachData = await request.json();

    // Validate required fields
    const required = ['description', 'affectedUsers', 'dataCategories', 'riskLevel', 'reportedBy'];
    for (const field of required) {
      if (!breachData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Report the breach
    const breachId = await gdprCompliance.reportDataBreach(breachData);

    // Calculate notification deadline (72 hours for authorities, without undue delay for users)
    const notificationDeadline = new Date();
    notificationDeadline.setHours(notificationDeadline.getHours() + 72);

    // Store additional breach details
    const db = (await import('firebase-admin/firestore')).getFirestore();
    await db.collection('data_breaches').doc(breachId).update({
      notificationDeadline: notificationDeadline.toISOString(),
      discoveryDate: breachData.discoveryDate || new Date().toISOString(),
      estimatedImpact: calculateEstimatedImpact(breachData),
      requiresAuthorityNotification: shouldNotifyAuthority(breachData.riskLevel),
      requiresUserNotification: shouldNotifyUsers(breachData.riskLevel, breachData.dataCategories)
    });

    // Auto-trigger notifications based on risk level
    if (breachData.riskLevel === 'high') {
      await triggerImmediateNotifications(breachId, breachData);
    }

    monitoring.recordResponseTime(Date.now() - startTime);

    return NextResponse.json({
      success: true,
      breachId,
      notificationDeadline: notificationDeadline.toISOString(),
      immediateActions: breachData.riskLevel === 'high' ? 
        ['Authority notification initiated', 'User notification prepared'] : 
        ['Breach logged', 'Investigation initiated']
    });

  } catch (error) {
    monitoring.recordError();
    console.error('Failed to report data breach:', error);

    return NextResponse.json(
      { error: 'Failed to report data breach' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const breachId = searchParams.get('breachId');
    const status = searchParams.get('status');
    const riskLevel = searchParams.get('riskLevel');
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = (await import('firebase-admin/firestore')).getFirestore();
    let query: any = db.collection('data_breaches');

    if (breachId) {
      const doc = await query.doc(breachId).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Breach not found' }, { status: 404 });
      }
      return NextResponse.json({ breach: { id: doc.id, ...doc.data() } });
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    if (riskLevel) {
      query = query.where('riskLevel', '==', riskLevel);
    }

    const snapshot = await query
      .orderBy('reportDate', 'desc')
      .limit(limit)
      .get();

    const breaches = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Generate breach analytics
    const analytics = {
      total: breaches.length,
      byRiskLevel: breaches.reduce((acc: any, breach: any) => {
        acc[breach.riskLevel] = (acc[breach.riskLevel] || 0) + 1;
        return acc;
      }, {}),
      byStatus: breaches.reduce((acc: any, breach: any) => {
        acc[breach.status] = (acc[breach.status] || 0) + 1;
        return acc;
      }, {}),
      totalAffectedUsers: breaches.reduce((sum: number, breach: any) => 
        sum + (breach.affectedUsers?.length || 0), 0),
      pendingNotifications: breaches.filter((b: any) => 
        !b.authorityNotified || !b.usersNotified).length
    };

    return NextResponse.json({ breaches, analytics });

  } catch (error) {
    console.error('Failed to fetch breach data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch breach data' },
      { status: 500 }
    );
  }
}

// Update breach status and add investigation details
export async function PATCH(request: NextRequest) {
  try {
    const { 
      breachId, 
      status, 
      causeAnalysis, 
      preventiveMeasures,
      authorityNotified,
      usersNotified,
      investigationNotes
    } = await request.json();

    if (!breachId) {
      return NextResponse.json(
        { error: 'breachId is required' },
        { status: 400 }
      );
    }

    const db = (await import('firebase-admin/firestore')).getFirestore();
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (status) updateData.status = status;
    if (causeAnalysis) updateData.causeAnalysis = causeAnalysis;
    if (preventiveMeasures) updateData.preventiveMeasures = preventiveMeasures;
    if (investigationNotes) updateData.investigationNotes = investigationNotes;
    
    if (authorityNotified !== undefined) {
      updateData.authorityNotified = authorityNotified;
      if (authorityNotified) {
        updateData.authorityNotificationDate = new Date().toISOString();
      }
    }
    
    if (usersNotified !== undefined) {
      updateData.usersNotified = usersNotified;
      if (usersNotified) {
        updateData.userNotificationDate = new Date().toISOString();
      }
    }

    await db.collection('data_breaches').doc(breachId).update(updateData);

    // Log the update
    await auditLogger.logSecurityEvent(
      { userId: 'system', ip: '127.0.0.1' },
      'data_breach_updated',
      'high',
      { breachId, updates: Object.keys(updateData) }
    );

    return NextResponse.json({ success: true, breachId, updates: updateData });

  } catch (error) {
    console.error('Failed to update breach:', error);
    return NextResponse.json(
      { error: 'Failed to update breach' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateEstimatedImpact(breachData: any): string {
  const userCount = breachData.affectedUsers?.length || 0;
  const dataCategories = breachData.dataCategories || [];
  const riskLevel = breachData.riskLevel;

  if (riskLevel === 'high' || userCount > 1000 || 
      dataCategories.includes('financial') || dataCategories.includes('health')) {
    return 'High impact: Significant risk to individuals\' rights and freedoms';
  }
  
  if (riskLevel === 'medium' || userCount > 100) {
    return 'Medium impact: Moderate risk requiring notification';
  }
  
  return 'Low impact: Minimal risk, monitoring required';
}

function shouldNotifyAuthority(riskLevel: string): boolean {
  // Under GDPR, authorities must be notified within 72 hours unless 
  // the breach is unlikely to result in a risk to individuals
  return riskLevel !== 'low';
}

function shouldNotifyUsers(riskLevel: string, dataCategories: string[]): boolean {
  // Users must be notified if breach is likely to result in high risk
  return riskLevel === 'high' || 
         dataCategories.includes('financial') || 
         dataCategories.includes('health') ||
         dataCategories.includes('biometric');
}

async function triggerImmediateNotifications(breachId: string, breachData: any): Promise<void> {
  try {
    // Send to authority notification queue
    if (shouldNotifyAuthority(breachData.riskLevel)) {
      await queueAuthorityNotification(breachId, breachData);
    }

    // Send to user notification queue
    if (shouldNotifyUsers(breachData.riskLevel, breachData.dataCategories)) {
      await queueUserNotifications(breachId, breachData);
    }

    // Alert security team
    await alertSecurityTeam(breachId, breachData);

  } catch (error) {
    console.error('Failed to trigger immediate notifications:', error);
  }
}

async function queueAuthorityNotification(breachId: string, breachData: any): Promise<void> {
  // Implement authority notification logic
  console.log(`🚨 AUTHORITY NOTIFICATION: Breach ${breachId} requires immediate authority notification`);
  
  // In production, integrate with your notification system
  // await notificationService.notifyAuthority({
  //   breachId,
  //   urgency: 'immediate',
  //   details: breachData
  // });
}

async function queueUserNotifications(breachId: string, breachData: any): Promise<void> {
  // Implement user notification logic
  console.log(`📧 USER NOTIFICATIONS: Preparing notifications for ${breachData.affectedUsers.length} users`);
  
  // In production, queue individual user notifications
  // for (const userId of breachData.affectedUsers) {
  //   await notificationService.notifyUser(userId, {
  //     type: 'data_breach',
  //     breachId,
  //     severity: breachData.riskLevel
  //   });
  // }
}

async function alertSecurityTeam(breachId: string, breachData: any): Promise<void> {
  // Alert security team immediately
  console.log(`🔔 SECURITY ALERT: High-risk data breach ${breachId} reported`);
  
  // In production, send to security team communication channels
  // await alertingService.sendSecurityAlert({
  //   type: 'data_breach',
  //   severity: 'critical',
  //   breachId,
  //   affectedUsers: breachData.affectedUsers.length,
  //   riskLevel: breachData.riskLevel
  // });
}
