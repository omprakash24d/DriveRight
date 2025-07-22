import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const diagnostics: any = {
      firebaseConfig: {
        hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        hasStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        hasMessagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'NOT_SET',
      },
      adminConfig: {
        hasServiceAccountKey: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        serviceAccountKeyLength: process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.length || 0,
      },
      timestamp: new Date().toISOString(),
    };

    // Test Firebase Admin initialization
    try {
      const { getAdminApp } = await import('@/lib/firebase-admin');
      const adminApp = getAdminApp();
      diagnostics.adminConfig.initialized = true;
      diagnostics.adminConfig.projectId = adminApp.options.projectId;
    } catch (error: any) {
      diagnostics.adminConfig.initialized = false;
      diagnostics.adminConfig.error = error.message;
    }

    return NextResponse.json(diagnostics);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Diagnostic failed', message: error.message },
      { status: 500 }
    );
  }
}
