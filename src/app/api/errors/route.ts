// src/app/api/errors/route.ts - Error tracking API endpoint
import { trackError } from '@/lib/error-tracking';
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
    const { errors } = await request.json();
    
    if (!Array.isArray(errors) || errors.length === 0) {
      return NextResponse.json(
        { error: 'Invalid errors array' },
        { status: 400 }
      );
    }

    const db = getFirestore();
    const batch = db.batch();

    // Store errors in Firestore
    errors.forEach((error: any) => {
      if (!error.id || !error.message) {
        return; // Skip invalid errors
      }

      const errorRef = db.collection('error_logs').doc(error.id);
      batch.set(errorRef, {
        ...error,
        createdAt: new Date().toISOString(),
        processed: false
      });
    });

    await batch.commit();

    // Track critical errors for immediate attention
    const criticalErrors = errors.filter((e: any) => e.context?.severity === 'critical');
    if (criticalErrors.length > 0) {
      // Send immediate notification (email, Slack, etc.)
      console.error('CRITICAL ERRORS DETECTED:', criticalErrors.length);
    }

    monitoring.recordResponseTime(Date.now() - startTime);
    
    return NextResponse.json({ 
      success: true, 
      processed: errors.length,
      critical: criticalErrors.length
    });

  } catch (error) {
    monitoring.recordError();
    trackError(error as Error, { category: 'system', severity: 'high' });
    
    return NextResponse.json(
      { error: 'Failed to process errors' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const severity = searchParams.get('severity');
    const category = searchParams.get('category');

    const db = getFirestore();
    let queryRef = db.collection('error_logs');

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
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Build query with filters
    let query = queryRef.where('createdAt', '>=', startTime.toISOString());

    if (severity) {
      query = query.where('context.severity', '==', severity);
    }

    if (category) {
      query = query.where('context.category', '==', category);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').limit(100).get();
    const errors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Generate statistics
    const stats = {
      total: errors.length,
      bySeverity: errors.reduce((acc: any, error: any) => {
        const severity = error.context?.severity || 'unknown';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {}),
      byCategory: errors.reduce((acc: any, error: any) => {
        const category = error.context?.category || 'unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}),
      timeframe
    };

    return NextResponse.json({ errors, stats });

  } catch (error) {
    console.error('Failed to fetch errors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch errors' },
      { status: 500 }
    );
  }
}
