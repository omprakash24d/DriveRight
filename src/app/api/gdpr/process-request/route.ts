// src/app/api/gdpr/process-request/route.ts - GDPR Request Processing API
import { auditLogger } from '@/lib/audit-logger';
import { gdprCompliance } from '@/lib/gdpr-compliance';
import { monitoring } from '@/lib/monitoring';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  monitoring.recordRequest();
  const startTime = Date.now();

  try {
    const { requestId, action, data } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json(
        { error: 'requestId and action are required' },
        { status: 400 }
      );
    }

    const db = (await import('firebase-admin/firestore')).getFirestore();
    
    // Get the request details
    const requestDoc = await db.collection('gdpr_requests').doc(requestId).get();
    if (!requestDoc.exists) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    const requestData = requestDoc.data()!;
    const ip = request.ip || '127.0.0.1';

    // Update request status to processing
    await db.collection('gdpr_requests').doc(requestId).update({
      status: 'processing',
      processingStarted: new Date().toISOString()
    });

    let result: any = {};

    try {
      switch (action) {
        case 'access':
          result = await gdprCompliance.processAccessRequest(
            requestData.userId,
            requestId
          );
          break;

        case 'portability':
          const format = data?.format || 'json';
          result = await gdprCompliance.processPortabilityRequest(
            requestData.userId,
            format
          );
          break;

        case 'rectification':
          if (!data?.corrections) {
            throw new Error('Corrections data is required for rectification');
          }
          await gdprCompliance.processRectificationRequest(
            requestData.userId,
            data.corrections,
            requestId
          );
          result = { message: 'Data rectification completed successfully' };
          break;

        case 'erasure':
          const retainAuditTrail = data?.retainAuditTrail !== false;
          await gdprCompliance.processErasureRequest(
            requestData.userId,
            requestId,
            retainAuditTrail
          );
          result = { message: 'Data erasure completed successfully' };
          break;

        case 'restriction':
          await processRestrictionRequest(requestData.userId, data);
          result = { message: 'Data processing restriction applied' };
          break;

        case 'objection':
          await processObjectionRequest(requestData.userId, data);
          result = { message: 'Data processing objection recorded' };
          break;

        default:
          throw new Error(`Unsupported action: ${action}`);
      }

      // Update request status to completed
      await db.collection('gdpr_requests').doc(requestId).update({
        status: 'completed',
        completionDate: new Date().toISOString(),
        responseData: result,
        processedBy: 'system'
      });

      // Log completion
      await auditLogger.logPrivacyEvent(
        { userId: requestData.userId, userEmail: requestData.userEmail, ip },
        action === 'access' || action === 'portability' ? 'data_export' : 
        action === 'erasure' ? 'data_deletion' : 'data_rectification',
        { requestId, action, completed: true }
      );

      monitoring.recordResponseTime(Date.now() - startTime);

      return NextResponse.json({
        success: true,
        requestId,
        action,
        result,
        completedAt: new Date().toISOString()
      });

    } catch (processingError) {
      // Update request status to failed
      await db.collection('gdpr_requests').doc(requestId).update({
        status: 'rejected',
        completionDate: new Date().toISOString(),
        processingNotes: processingError instanceof Error ? processingError.message : 'Processing failed',
        processedBy: 'system'
      });

      throw processingError;
    }

  } catch (error) {
    monitoring.recordError();
    console.error('Failed to process GDPR request:', error);

    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions for specific request types
async function processRestrictionRequest(userId: string, data: any): Promise<void> {
  const db = (await import('firebase-admin/firestore')).getFirestore();
  
  // Add restriction flags to user data
  const restrictionData = {
    dataProcessingRestricted: true,
    restrictionDate: new Date().toISOString(),
    restrictionReason: data?.reason || 'User requested data processing restriction',
    restrictedProcessing: data?.restrictedActivities || ['marketing', 'analytics']
  };

  // Apply restrictions to relevant collections
  const collections = ['users', 'preferences', 'communications'];
  
  for (const collection of collections) {
    const userDoc = await db.collection(collection).doc(userId).get();
    if (userDoc.exists) {
      await userDoc.ref.update(restrictionData);
    }
  }
}

async function processObjectionRequest(userId: string, data: any): Promise<void> {
  const db = (await import('firebase-admin/firestore')).getFirestore();
  
  // Record objection
  const objectionData = {
    dataProcessingObjection: true,
    objectionDate: new Date().toISOString(),
    objectionReason: data?.reason || 'User objected to data processing',
    objectedActivities: data?.objectedActivities || ['direct_marketing', 'profiling']
  };

  // Apply objection to relevant collections
  const collections = ['users', 'preferences', 'marketing_preferences'];
  
  for (const collection of collections) {
    const userDoc = await db.collection(collection).doc(userId).get();
    if (userDoc.exists) {
      await userDoc.ref.update(objectionData);
    }
  }

  // Stop relevant processing activities
  if (objectionData.objectedActivities.includes('direct_marketing')) {
    await db.collection('marketing_preferences').doc(userId).update({
      optOut: true,
      optOutDate: new Date().toISOString(),
      optOutReason: 'GDPR Objection'
    });
  }
}
