// src/app/api/monitoring/metrics/route.ts
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const db = getFirestore();
    
    // Collect application metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      application: {
        uptime_seconds: process.uptime(),
        memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        cpu_usage_percent: Math.round(process.cpuUsage().user / 1000000 * 100),
        node_version: process.version
      },
      business: {
        total_users: 0,
        active_sessions: 0,
        courses_completed_today: 0,
        certificates_issued_today: 0,
        revenue_today: 0
      },
      security: {
        failed_logins_last_hour: 0,
        blocked_ips: 0,
        security_events_today: 0,
        gdpr_requests_pending: 0
      },
      performance: {
        avg_response_time_ms: 0,
        error_rate_percent: 0,
        throughput_rps: 0
      }
    };

    // Fetch business metrics
    const today = new Date().toISOString().split('T')[0];
    
    // Count users
    const usersSnapshot = await db.collection('users').count().get();
    metrics.business.total_users = usersSnapshot.data().count;

    // Count today's completions
    const completionsSnapshot = await db.collection('certificates')
      .where('issuedDate', '>=', today)
      .count().get();
    metrics.business.certificates_issued_today = completionsSnapshot.data().count;

    // Count security events
    const securitySnapshot = await db.collection('security_events')
      .where('timestamp', '>=', today)
      .count().get();
    metrics.security.security_events_today = securitySnapshot.data().count;

    // Count pending GDPR requests
    const gdprSnapshot = await db.collection('gdpr_requests')
      .where('status', '==', 'pending')
      .count().get();
    metrics.security.gdpr_requests_pending = gdprSnapshot.data().count;

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Failed to collect metrics:', error);
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}