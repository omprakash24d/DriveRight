import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * This API route runs in the Node.js runtime and is responsible for
 * verifying the session cookie using the firebase-admin SDK.
 * It's called by the middleware to avoid using firebase-admin in the Edge runtime.
 */
export async function GET(request: NextRequest) {
  const sessionCookie = cookies().get('__session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: 'Unauthorized: No session cookie.' }, { status: 401 });
  }

  try {
    const adminApp = getAdminApp();
    
    // verifySessionCookie checks for revocation and expiration.
    const decodedToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
    
    // If verification is successful, return a success response.
    return NextResponse.json({ success: true, uid: decodedToken.uid }, { status: 200 });

  } catch (error) {
    console.error('Session verification error:', error);
    
    // Check if it's a Firebase Admin initialization error
    if (error instanceof Error && error.message.includes('Firebase Admin SDK failed to initialize')) {
      // For development: if admin SDK is not configured, return unauthorized
      // This prevents the middleware from blocking all admin routes during development
      return NextResponse.json({ error: 'Development mode: Admin SDK not configured.' }, { status: 401 });
    }
    
    // The cookie is invalid, so we instruct the client to clear it.
    const response = NextResponse.json({ error: 'Unauthorized: Invalid session cookie.' }, { status: 401 });
    response.cookies.set('__session', '', { expires: new Date(0) });
    return response;
  }
}
