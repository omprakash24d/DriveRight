import { NextResponse, type NextRequest } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

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
    if (!adminApp) {
      throw new Error("Firebase Admin SDK not initialized on the server.");
    }
    
    // verifySessionCookie checks for revocation and expiration.
    const decodedToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
    
    // If verification is successful, return a success response.
    return NextResponse.json({ success: true, uid: decodedToken.uid }, { status: 200 });

  } catch (error) {
    console.error('Session verification error:', error);
    // The cookie is invalid, so we instruct the client to clear it.
    const response = NextResponse.json({ error: 'Unauthorized: Invalid session cookie.' }, { status: 401 });
    response.cookies.set('__session', '', { expires: new Date(0) });
    return response;
  }
}
