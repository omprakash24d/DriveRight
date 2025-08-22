// src/app/api/monitoring/metrics/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return basic metrics without Firebase dependency during build
    const metrics = {
      timestamp: new Date().toISOString(),
      application: {
        uptime_seconds: process.uptime(),
        memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        node_version: process.version,
        environment: process.env.NODE_ENV || 'development'
      },
      business: {
        total_users: 0,
        active_sessions: 0,
        courses_completed_today: 0,
        certificates_issued_today: 0,
        revenue_today: 0,
        status: 'firebase-disabled-for-build'
      },
      security: {
        failed_logins_last_hour: 0,
        blocked_ips: 0,
        security_events_today: 0,
        gdpr_requests_pending: 0,
        status: 'firebase-disabled-for-build'
      },
      performance: {
        avg_response_time_ms: 0,
        error_rate_percent: 0,
        throughput_rps: 0,
        status: 'basic-metrics-only'
      }
    };

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Failed to collect metrics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to collect metrics',
        timestamp: new Date().toISOString(),
        application: {
          uptime_seconds: process.uptime(),
          memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          node_version: process.version,
          status: 'error'
        }
      },
      { status: 500 }
    );
  }
}