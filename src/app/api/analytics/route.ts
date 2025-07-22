// src/app/api/analytics/route.ts - Analytics data collection endpoint
import { monitoring } from '@/lib/monitoring';
import { RATE_LIMITS, withRateLimit } from '@/lib/rate-limiter';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = withRateLimit(
    RATE_LIMITS.API_GENERAL,
    (req) => req.headers.get('x-forwarded-for') || 'unknown'
  )(request);
  
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  monitoring.recordRequest();
  const startTime = Date.now();

  try {
    const { metrics, events } = await request.json();
    
    if (!Array.isArray(metrics) && !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid metrics or events data' },
        { status: 400 }
      );
    }

    const db = getFirestore();
    const batch = db.batch();

    // Store performance metrics
    if (Array.isArray(metrics)) {
      metrics.forEach((metric: any) => {
        if (!metric.id || !metric.name) return;
        
        const metricRef = db.collection('performance_metrics').doc(metric.id);
        batch.set(metricRef, {
          ...metric,
          createdAt: new Date().toISOString()
        });
      });
    }

    // Store user events
    if (Array.isArray(events)) {
      events.forEach((event: any) => {
        if (!event.id || !event.event) return;
        
        const eventRef = db.collection('user_events').doc(event.id);
        batch.set(eventRef, {
          ...event,
          createdAt: new Date().toISOString()
        });
      });
    }

    await batch.commit();

    monitoring.recordResponseTime(Date.now() - startTime);
    
    return NextResponse.json({ 
      success: true, 
      metricsProcessed: metrics?.length || 0,
      eventsProcessed: events?.length || 0
    });

  } catch (error) {
    monitoring.recordError();
    console.error('Failed to process analytics data:', error);
    
    return NextResponse.json(
      { error: 'Failed to process analytics data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const type = searchParams.get('type'); // 'metrics' or 'events'

    const db = getFirestore();
    
    // Calculate time range
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

    let result: any = {};

    // Get metrics if requested
    if (!type || type === 'metrics') {
      const metricsQuery = db.collection('performance_metrics')
        .where('createdAt', '>=', startTime.toISOString())
        .orderBy('createdAt', 'desc')
        .limit(1000);

      const metricsSnapshot = await metricsQuery.get();
      const metrics = metricsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Process metrics for dashboard
      result.metrics = {
        total: metrics.length,
        pageLoad: {
          averageLCP: calculateAverage(metrics.filter((m: any) => m.name === 'LCP')),
          averageFID: calculateAverage(metrics.filter((m: any) => m.name === 'FID')),
          averageCLS: calculateAverage(metrics.filter((m: any) => m.name === 'CLS')),
          averageTTFB: calculateAverage(metrics.filter((m: any) => m.name === 'TTFB'))
        },
        apiCalls: {
          total: metrics.filter((m: any) => m.type === 'api_call').length,
          averageResponseTime: calculateAverage(metrics.filter((m: any) => m.type === 'api_call')),
          errorRate: calculateErrorRate(metrics.filter((m: any) => m.type === 'api_call'))
        }
      };
    }

    // Get events if requested
    if (!type || type === 'events') {
      const eventsQuery = db.collection('user_events')
        .where('createdAt', '>=', startTime.toISOString())
        .orderBy('createdAt', 'desc')
        .limit(1000);

      const eventsSnapshot = await eventsQuery.get();
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Process events for dashboard
      result.events = {
        total: events.length,
        byCategory: events.reduce((acc: any, event: any) => {
          acc[event.category] = (acc[event.category] || 0) + 1;
          return acc;
        }, {}),
        pageViews: events.filter((e: any) => e.event === 'page_view').length,
        conversions: events.filter((e: any) => e.category === 'conversion').length,
        topPages: getTopPages(events.filter((e: any) => e.event === 'page_view'))
      };
    }

    return NextResponse.json({
      ...result,
      timeframe,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to fetch analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

// Helper functions for analytics calculations
function calculateAverage(metrics: any[]): number {
  if (metrics.length === 0) return 0;
  const sum = metrics.reduce((acc, metric) => acc + (metric.value || 0), 0);
  return Math.round(sum / metrics.length);
}

function calculateErrorRate(apiMetrics: any[]): number {
  if (apiMetrics.length === 0) return 0;
  const errorCount = apiMetrics.filter(m => m.metadata?.status === 'error').length;
  return Math.round((errorCount / apiMetrics.length) * 100);
}

function getTopPages(pageViewEvents: any[]): any[] {
  const pageCounts = pageViewEvents.reduce((acc: any, event: any) => {
    const path = event.properties?.path || 'unknown';
    acc[path] = (acc[path] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(pageCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([path, views]) => ({ path, views }));
}
