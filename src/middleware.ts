import { NextResponse, type NextRequest } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

// Define which origins are allowed to access your API
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002',
  // Add other origins if needed, e.g., a staging environment
];

// Function to set CORS headers on a response
function applyCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  // Dynamically set origin based on request
  // Note: For production, it's safer to check against a list of allowed origins
  response.headers.set('Access-Control-Allow-Origin', '*'); // Or a specific origin
  response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  return response;
}

export async function middleware(request: NextRequest) {
  // --- CORS Preflight Handling ---
  if (request.method === 'OPTIONS') {
    return applyCorsHeaders(new NextResponse(null, { status: 204 }));
  }

  const response = NextResponse.next();
  
  // --- Apply CORS to all outgoing responses ---
  applyCorsHeaders(response);

  // --- Admin API Route Protection ---
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const sessionCookie = request.cookies.get('__session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized: No session cookie provided.' }, { status: 401 });
    }

    try {
      const adminApp = getAdminApp();
      if (!adminApp) throw new Error("Firebase Admin SDK not initialized on the server.");
      
      const decodedToken = await getAuth(adminApp).verifySessionCookie(sessionCookie, true);
      
      // Optional: Add user info to the request headers for the API route to use
      response.headers.set('X-User-ID', decodedToken.uid);
      response.headers.set('X-User-Email', decodedToken.email || '');

    } catch (error) {
      console.error('Admin API authentication error:', error);
      // Clear the invalid cookie by setting it to an empty value with an expired date
      response.cookies.set('__session', '', { expires: new Date(0) });
      return NextResponse.json({ error: 'Unauthorized: Invalid session cookie.' }, { status: 401 });
    }
  }

  return response;
}

// Define which paths the middleware should run on
export const config = {
  matcher: '/api/:path*',
};
