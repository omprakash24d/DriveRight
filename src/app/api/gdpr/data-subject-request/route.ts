// src/app/api/gdpr/data-subject-request/route.ts - GDPR Data Subject Rights API
import { auditLogger } from '@/lib/audit-logger';
import { trackError } from '@/lib/error-tracking';
import { DataSubjectRequest } from '@/lib/gdpr-compliance';
import { monitoring } from '@/lib/monitoring';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  monitoring.recordRequest();
  const startTime = Date.now();

  try {
    const { 
      userId, 
      userEmail, 
      requestType, 
      requestDetails,
      verificationMethod = 'email'
    } = await request.json();

    if (!userId || !userEmail || !requestType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userEmail, requestType' },
        { status: 400 }
      );
    }

    // Validate request type
    const validTypes = ['access', 'portability', 'rectification', 'erasure', 'restriction', 'objection'];
    if (!validTypes.includes(requestType)) {
      return NextResponse.json(
        { error: 'Invalid request type' },
        { status: 400 }
      );
    }

    const requestId = crypto.randomUUID();
    const now = new Date().toISOString();

    const dataSubjectRequest: DataSubjectRequest = {
      id: requestId,
      userId,
      userEmail,
      requestType,
      status: 'pending',
      requestDate: now,
      requestDetails,
      verificationMethod
    };

    // Store the request
    const db = (await import('firebase-admin/firestore')).getFirestore();
    await db.collection('gdpr_requests').doc(requestId).set(dataSubjectRequest);

    // Log the request
    const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    await auditLogger.logPrivacyEvent(
      { userId, userEmail, ip },
      requestType === 'access' || requestType === 'portability' ? 'data_export' : 
      requestType === 'erasure' ? 'data_deletion' : 'data_rectification',
      { requestId, requestType, verificationMethod }
    );

    // Send verification email (implement your email service)
    await sendVerificationEmail(userEmail, requestId, requestType);

    monitoring.recordResponseTime(Date.now() - startTime);

    return NextResponse.json({
      success: true,
      requestId,
      status: 'pending',
      message: 'Data subject request submitted. Please check your email for verification instructions.',
      estimatedCompletionTime: getEstimatedCompletionTime(requestType)
    });

  } catch (error) {
    monitoring.recordError();
    trackError(error as Error, { 
      category: 'system', 
      severity: 'high',
      url: request.url 
    });

    return NextResponse.json(
      { error: 'Failed to process data subject request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    if (!requestId && !userId) {
      return NextResponse.json(
        { error: 'Either requestId or userId is required' },
        { status: 400 }
      );
    }

    const db = (await import('firebase-admin/firestore')).getFirestore();
    let query: any = db.collection('gdpr_requests');

    if (requestId) {
      const doc = await query.doc(requestId).get();
      if (!doc.exists) {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ request: { id: doc.id, ...doc.data() } });
    }

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.orderBy('requestDate', 'desc').get();
    const requests = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ requests });

  } catch (error) {
    console.error('Failed to fetch GDPR requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { requestId, status, processingNotes, processedBy } = await request.json();

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'requestId and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'processing', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const db = (await import('firebase-admin/firestore')).getFirestore();
    const updateData: any = {
      status,
      processingNotes,
      processedBy,
      updatedAt: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completionDate = new Date().toISOString();
    }

    await db.collection('gdpr_requests').doc(requestId).update(updateData);

    return NextResponse.json({ success: true, requestId, status });

  } catch (error) {
    console.error('Failed to update GDPR request:', error);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
}

// Helper functions
async function sendVerificationEmail(email: string, requestId: string, requestType: string): Promise<void> {
  try {
    // Implement your email service here
    console.log(`📧 Verification email sent to ${email} for ${requestType} request ${requestId}`);
    
    // Example implementation (replace with your email service)
    // await emailService.send({
    //   to: email,
    //   subject: `Verify your ${requestType} request`,
    //   template: 'gdpr-verification',
    //   data: { requestId, requestType }
    // });

  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Don't throw - email failure shouldn't block the request
  }
}

function getEstimatedCompletionTime(requestType: string): string {
  const timeframes = {
    access: '30 days',
    portability: '30 days',
    rectification: '30 days',
    erasure: '30 days',
    restriction: '30 days',
    objection: '30 days'
  };

  return timeframes[requestType as keyof typeof timeframes] || '30 days';
}
