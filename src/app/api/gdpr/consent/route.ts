// src/app/api/gdpr/consent/route.ts - Consent Management API
import { gdprCompliance } from '@/lib/gdpr-compliance';
import { monitoring } from '@/lib/monitoring';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  monitoring.recordRequest();
  const startTime = Date.now();

  try {
    const { 
      userId, 
      purpose, 
      consentGiven, 
      consentVersion, 
      legalBasis 
    } = await request.json();

    if (!userId || !purpose || consentGiven === undefined || !legalBasis) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, purpose, consentGiven, legalBasis' },
        { status: 400 }
      );
    }

    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';

    if (consentGiven) {
      // Record consent
      await gdprCompliance.recordConsent({
        userId,
        purpose,
        consentGiven: true,
        consentVersion: consentVersion || '1.0',
        ipAddress: ip,
        userAgent,
        legalBasis
      });
    } else {
      // Withdraw consent
      await gdprCompliance.withdrawConsent(userId, purpose, ip);
    }

    monitoring.recordResponseTime(Date.now() - startTime);

    return NextResponse.json({
      success: true,
      userId,
      purpose,
      consentGiven,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    monitoring.recordError();
    console.error('Failed to process consent:', error);

    return NextResponse.json(
      { error: 'Failed to process consent' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const purpose = searchParams.get('purpose');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const db = (await import('firebase-admin/firestore')).getFirestore();
    let query: any = db.collection('consent_records').where('userId', '==', userId);

    if (purpose) {
      query = query.where('purpose', '==', purpose);
    }

    const snapshot = await query.orderBy('consentDate', 'desc').get();
    const consents = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get current consent status for each purpose
    const currentConsents = getCurrentConsentStatus(consents);

    return NextResponse.json({
      userId,
      consents,
      currentStatus: currentConsents,
      totalRecords: consents.length
    });

  } catch (error) {
    console.error('Failed to fetch consent records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent records' },
      { status: 500 }
    );
  }
}

// Batch consent update
export async function PATCH(request: NextRequest) {
  try {
    const { userId, consents } = await request.json();

    if (!userId || !Array.isArray(consents)) {
      return NextResponse.json(
        { error: 'userId and consents array are required' },
        { status: 400 }
      );
    }

    const ip = request.ip || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || '';
    const results = [];

    for (const consent of consents) {
      try {
        if (consent.consentGiven) {
          await gdprCompliance.recordConsent({
            userId,
            purpose: consent.purpose,
            consentGiven: true,
            consentVersion: consent.consentVersion || '1.0',
            ipAddress: ip,
            userAgent,
            legalBasis: consent.legalBasis || 'consent'
          });
        } else {
          await gdprCompliance.withdrawConsent(userId, consent.purpose, ip);
        }

        results.push({
          purpose: consent.purpose,
          success: true,
          consentGiven: consent.consentGiven
        });

      } catch (error) {
        results.push({
          purpose: consent.purpose,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      userId,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Failed to update consents:', error);
    return NextResponse.json(
      { error: 'Failed to update consents' },
      { status: 500 }
    );
  }
}

// Helper function to get current consent status
function getCurrentConsentStatus(consents: any[]): Record<string, any> {
  const statusByPurpose: Record<string, any> = {};

  // Group by purpose and get latest consent
  for (const consent of consents) {
    const purpose = consent.purpose;
    
    if (!statusByPurpose[purpose] || 
        new Date(consent.consentDate) > new Date(statusByPurpose[purpose].consentDate)) {
      statusByPurpose[purpose] = {
        consentGiven: consent.consentGiven,
        consentDate: consent.consentDate,
        consentVersion: consent.consentVersion,
        withdrawnDate: consent.withdrawnDate,
        legalBasis: consent.legalBasis,
        isActive: consent.consentGiven && !consent.withdrawnDate
      };
    }
  }

  return statusByPurpose;
}
