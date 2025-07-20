import { NextResponse, type NextRequest } from 'next/server';

// Define which origins are allowed to access your API
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  // Add other origins if needed, e.g., a staging environment
];

// Function to set CORS headers on a response
function applyCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT,OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  return response;
}

export async function middleware(request: NextRequest) {
  // --- CORS Preflight Handling ---
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return applyCorsHeaders(response, request);
  }

  const response = NextResponse.next();
  
  // --- Apply CORS to all outgoing responses ---
  applyCorsHeaders(response, request);

  // --- Admin API Route Protection ---
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const sessionCookie = request.cookies.get('__session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized: No session cookie provided.' }, { status: 401 });
    }

    try {
      // Instead of verifying here, call an internal API route that runs in the Node.js runtime.
      const verificationUrl = new URL('/api/auth/verify-session', request.url);
      
      const verificationResponse = await fetch(verificationUrl.toString(), {
        headers: {
          Cookie: `__session=${sessionCookie}`
        }
      });
      
      if (!verificationResponse.ok) {
        // Clear the invalid cookie
        const errorResponse = NextResponse.json({ error: 'Unauthorized: Invalid session.' }, { status: 401 });
        errorResponse.cookies.set('__session', '', { expires: new Date(0) });
        return errorResponse;
      }
      
      // If verification is successful, the request can proceed.
      // The actual API route can handle getting user details from its own server-side context.

    } catch (error) {
      console.error('Middleware verification fetch error:', error);
      return NextResponse.json({ error: 'An internal server error occurred during authentication.' }, { status: 500 });
    }
  }

  return response;
}

// Define which paths the middleware should run on
export const config = {
  // We exclude the verification route itself to prevent an infinite loop.
  matcher: ['/api/admin/:path*', '/api/auth/session'],
};
