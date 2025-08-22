import { NextResponse, type NextRequest } from 'next/server';

// Simple logging function for middleware (client-side compatible)
async function logSecurityEvent(request: NextRequest, event: string, metadata: any = {}): Promise<void> {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  
  // Determine severity based on event type
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  if (event.includes('suspicious_input') || event.includes('admin_access_denied')) {
    severity = 'high';
  } else if (event.includes('rate_limit') || event.includes('admin_access_attempt')) {
    severity = 'medium';
  } else if (event.includes('critical') || event.includes('breach')) {
    severity = 'critical';
  }

  // Simple console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SECURITY ${severity.toUpperCase()}] ${event}`, {
      ip,
      userAgent,
      pathname: request.nextUrl.pathname,
      method: request.method,
      ...metadata
    });
  }
}

// Security configurations
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'off',
  'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(self), payment=(self "https://checkout.razorpay.com" "https://api.razorpay.com"), usb=()',
};

// Content Security Policy for production
const CSP_POLICY = process.env.NODE_ENV === 'production' 
  ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.google.com https://apis.google.com https://www.googletagmanager.com https://checkout.razorpay.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://storage.googleapis.com https://firebasestorage.googleapis.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://o4509708384468992.ingest.us.sentry.io https://www.google-analytics.com https://checkout.razorpay.com; frame-src 'self' https://www.google.com https://checkout.razorpay.com https://api.razorpay.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
  : "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://checkout.razorpay.com https://www.google-analytics.com https://ssl.google-analytics.com https://www.gstatic.com https://tagmanager.google.com; script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://checkout.razorpay.com https://www.google-analytics.com https://ssl.google-analytics.com https://www.gstatic.com https://tagmanager.google.com; worker-src 'self' blob:; img-src 'self' data: https: blob:; font-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; connect-src 'self' https://www.google-analytics.com https://ssl.google-analytics.com https://analytics.google.com https://checkout.razorpay.com https://api.razorpay.com https://firebaseapp.com https://*.firebaseapp.com https://firestore.googleapis.com https://storage.googleapis.com https://firebase.googleapis.com wss://*.firebaseio.com https://region1.google-analytics.com https://www.googletagmanager.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://o4509708384468992.ingest.us.sentry.io; frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com;";

// Suspicious patterns for security monitoring
const SUSPICIOUS_PATTERNS = [
  /(\<script\>|\<\/script\>)/i,
  /(javascript:|data:text\/html)/i,
  /(union.*select|select.*from|insert.*into|delete.*from)/i,
  /(\.\.\/|\.\.\\|\.\.%2f|\.\.%5c)/i,
  /(\|\||&&|\;|\`)/,
  /(exec|eval|system|shell_exec)/i
];

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; reset: number }>();

// Define which origins are allowed to access your API
const allowedOrigins = [
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'http://localhost:9002', // Add the current development port
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

// Security helper functions
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  return cfConnectingIP || realIP || forwarded?.split(',')[0] || 'unknown';
}

function applySecurityHeaders(response: NextResponse): void {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  response.headers.set('Content-Security-Policy', CSP_POLICY);
  response.headers.set('X-Request-ID', crypto.randomUUID());
}

function checkRateLimit(request: NextRequest, endpoint: string): { allowed: boolean; remaining: number } {
  const clientIP = getClientIP(request);
  const key = `${clientIP}:${endpoint}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = endpoint.includes('/api/auth') ? 5 : 60;
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.reset) {
    rateLimitStore.set(key, { count: 1, reset: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

function detectSuspiciousInput(request: NextRequest): boolean {
  const url = request.url;
  const queryParams = request.nextUrl.searchParams.toString();
  
  return SUSPICIOUS_PATTERNS.some(pattern => 
    pattern.test(url) || pattern.test(queryParams)
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Create response object
  const response = request.method === 'OPTIONS' 
    ? new NextResponse(null, { status: 204 })
    : NextResponse.next();

  // Apply CORS headers
  applyCorsHeaders(response, request);
  
  // Apply security headers
  applySecurityHeaders(response);

  // Security monitoring and protection
  await logSecurityEvent(request, 'request_received');

  // Rate limiting check
  const rateLimitResult = checkRateLimit(request, pathname);
  if (!rateLimitResult.allowed) {
    await logSecurityEvent(request, 'rate_limit_exceeded', { 
      endpoint: pathname,
      ip: getClientIP(request)
    });
    
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Remaining': '0'
      }
    });
  }

  // Suspicious input detection
  if (detectSuspiciousInput(request)) {
    await logSecurityEvent(request, 'suspicious_input_detected', {
      url: request.url,
      ip: getClientIP(request)
    });
    
    return new NextResponse('Bad Request', { status: 400 });
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return response;
  }

  // --- Admin API Route Protection ---
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const sessionCookie = request.cookies.get('__session')?.value;

    if (!sessionCookie) {
      // Check if Firebase Admin SDK is configured
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountJson || serviceAccountJson.trim() === '') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Development mode: Firebase Admin SDK not configured');
          // Still require some form of authentication in development
          const devToken = request.headers.get('x-dev-admin-token');
          if (devToken !== process.env.DEV_ADMIN_TOKEN) {
            return NextResponse.json({ 
              error: 'Development admin token required',
              hint: 'Set DEV_ADMIN_TOKEN environment variable'
            }, { status: 401 });
          }
        } else {
          return NextResponse.json({ 
            error: 'Unauthorized: Admin authentication not configured' 
          }, { status: 401 });
        }
      } else {
        return NextResponse.json({ 
          error: 'Unauthorized: No session cookie provided.' 
        }, { status: 401 });
      }
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
      
      // Check if it's a Firebase Admin configuration issue
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountJson || serviceAccountJson.trim() === '') {
        console.warn('Development mode: Firebase Admin SDK not configured, allowing admin API access');
        return response;
      }
      
      return NextResponse.json({ error: 'An internal server error occurred during authentication.' }, { status: 500 });
    }
  }

  return response;
}

// Define which paths the middleware should run on
export const config = {
  matcher: [
    // API routes
    '/api/:path*',
    
    // Admin routes  
    '/admin/:path*',
    
    // Auth routes
    '/login/:path*',
    '/signup/:path*',
    
    // Exclude static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)/'
  ],
};
