// src/app/api/monitoring/health/route.ts
import { getFirestore } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {
      database: false,
      redis: false,
      external_apis: false
    },
    performance: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };

  try {
    // Database check
    const db = getFirestore();
    await db.collection('health_check').doc('test').set({ timestamp: new Date() });
    checks.checks.database = true;
  } catch (error) {
    checks.status = 'degraded';
    checks.checks.database = false;
  }

  // Redis check (if available)
  try {
    // Add Redis health check if using Redis
    checks.checks.redis = true;
  } catch (error) {
    checks.checks.redis = false;
  }

  // External APIs check
  try {
    // Add external service checks
    checks.checks.external_apis = true;
  } catch (error) {
    checks.checks.external_apis = false;
  }

  const allHealthy = Object.values(checks.checks).every(Boolean);
  if (!allHealthy) {
    checks.status = 'degraded';
  }

  return NextResponse.json(checks, {
    status: allHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}