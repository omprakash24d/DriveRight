import { ErrorService } from '@/lib/error-service';
import { NextRequest, NextResponse } from 'next/server';

// --- Service initialization (enhanced) ---
let servicesInitialized = false;
async function initializeServices() {
  if (servicesInitialized) return;

  try {
    // No heavy initialization here to avoid importing modules that use
    // dynamic code evaluation (e.g. CacheService). Keep middleware-safe.
    servicesInitialized = true;
    ErrorService.logInfo('Middleware services initialized (lightweight)', { component: 'Middleware' });
  } catch (error) {
    ErrorService.logError('Failed to initialize middleware services', {
      component: 'Middleware',
      metadata: { error: (error as Error).message },
    });
  }
}

// --- Security and CSP configuration ---
function buildCSP(): string {
  const parts = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.sentry-cdn.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://ssl.gstatic.com https://apis.google.com https://connect.facebook.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://checkout.razorpay.com",
    "font-src 'self' https://fonts.gstatic.com https://checkout.razorpay.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.razorpay.com",
    "frame-ancestors 'none'",
    "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com",
    "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://*.sentry.io https://vitals.vercel-insights.com https://firestore.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ];

  return parts.join('; ');
}

const SUSPICIOUS_PATTERNS = [
  /(\<script\>|\<\/script\>)/i,
  /(javascript:|data:text\/html)/i,
  /(union.*select|select.*from|insert.*into|delete.*from)/i,
  /(\.\.\/|\.\.\\|\.\.%2f|\.\.%5c)/i,
  /(\|\||&&|\;|\`)/,
  /(exec|eval|system|shell_exec)/i,
];

// Rate limiting storage (in-memory fallback)
const rateLimitStore = new Map<string, { count: number; reset: number }>();

// Allowed origins for CORS
const allowedOrigins = [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', 'http://localhost:9002'];

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  return cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';
}

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

function applySecurityHeaders(response: NextResponse): NextResponse {
  // Permissions-Policy: allow geolocation/camera in development for localhost only
  const geolocationPolicy = process.env.NODE_ENV === 'development' ? 'geolocation=(self "http://localhost:9002")' : 'geolocation=(self)';
  const permissions = `camera=(), microphone=(), ${geolocationPolicy}, payment=(self "https://checkout.razorpay.com"), autoplay=(self), fullscreen=(self)`;

  response.headers.set('Content-Security-Policy', buildCSP());
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Permissions-Policy', permissions);
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site');
  response.headers.set('X-Request-ID', crypto.randomUUID());

  return response;
}

function detectSuspiciousInput(request: NextRequest): boolean {
  const url = request.url;
  const queryParams = request.nextUrl.searchParams.toString();
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(url) || pattern.test(queryParams));
}

function checkRateLimitFallback(request: NextRequest, endpoint: string): { allowed: boolean; remaining: number } {
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

// Simple logging helper (uses ErrorService for structured logs) - reduced verbosity
async function logSecurityEvent(request: NextRequest, event: string, metadata: any = {}): Promise<void> {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (event.includes('suspicious') || event.includes('admin_access_denied')) severity = 'high';
  else if (event.includes('rate_limit') || event.includes('admin_access_attempt')) severity = 'medium';
  else if (event.includes('critical') || event.includes('breach')) severity = 'critical';

  // Only log security events, not regular requests
  if (severity !== 'low' && process.env.NODE_ENV === 'development') {
    console.log(`[SECURITY ${severity.toUpperCase()}] ${event}`, { ip, userAgent, pathname: request.nextUrl.pathname, method: request.method, ...metadata });
  }

  // Only log important security events to ErrorService
  if (severity !== 'low') {
    try {
      ErrorService.logInfo(event, { ip, userAgent, pathname: request.nextUrl.pathname, ...metadata });
    } catch (e) {
      // ignore logging errors in middleware
    }
  }
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now();

  // Initialize enhanced services (non-blocking on subsequent calls)
  await initializeServices();

  const ip = getClientIP(request);
  const method = request.method;
  const path = request.nextUrl.pathname;

  // Default response
  let response = request.method === 'OPTIONS' ? new NextResponse(null, { status: 204 }) : NextResponse.next();

  // CORS
  applyCorsHeaders(response, request);

  // Apply security headers
  response = applySecurityHeaders(response);

  // Only log request for non-static assets
  const isStaticAsset = path.includes('/_next/') || path.includes('/images/') || path.includes('/favicon');
  if (!isStaticAsset) {
    // Only log for important routes or when there are issues
    const isImportantRoute = path.includes('/api/') || path.includes('/admin') || path.includes('/payment');
    if (isImportantRoute) {
      await logSecurityEvent(request, 'request_received');
    }
  }

  // Rate limiting (local fallback)
  const rl = checkRateLimitFallback(request, path);
  if (!rl.allowed) {
    await logSecurityEvent(request, 'rate_limit_exceeded', { endpoint: path, ip });
    return new NextResponse('Too Many Requests', { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0' } });
  }
  response.headers.set('X-RateLimit-Remaining', String(rl.remaining));
  response.headers.set('X-RateLimit-Limit', '60');

  // Suspicious input detection
  if (detectSuspiciousInput(request)) {
    await logSecurityEvent(request, 'suspicious_input_detected', { url: request.url, ip });
    return new NextResponse('Bad Request', { status: 400 });
  }

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return response;
  }

  // Admin/API protections
  if (path.startsWith('/api/admin') || path.startsWith('/api/admin/')) {
    const sessionCookie = request.cookies.get('__session')?.value;
    if (!sessionCookie) {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountJson || serviceAccountJson.trim() === '') {
        if (process.env.NODE_ENV === 'development') {
          const devToken = request.headers.get('x-dev-admin-token');
          if (devToken !== process.env.DEV_ADMIN_TOKEN) {
            return NextResponse.json({ error: 'Development admin token required', hint: 'Set DEV_ADMIN_TOKEN environment variable' }, { status: 401 });
          }
        } else {
          return NextResponse.json({ error: 'Unauthorized: Admin authentication not configured' }, { status: 401 });
        }
      } else {
        return NextResponse.json({ error: 'Unauthorized: No session cookie provided.' }, { status: 401 });
      }
    }

    try {
      const verificationUrl = new URL('/api/auth/verify-session', request.url);
      const verificationResponse = await fetch(verificationUrl.toString(), { headers: { Cookie: `__session=${sessionCookie}` }, signal: AbortSignal.timeout?.(5000) as any });
      if (!verificationResponse.ok) {
        const errorResponse = NextResponse.json({ error: 'Unauthorized: Invalid session.' }, { status: 401 });
        errorResponse.cookies.set('__session', '', { expires: new Date(0) });
        return applySecurityHeaders(errorResponse);
      }
    } catch (error) {
      ErrorService.logError('Session verification failed', { component: 'Middleware', metadata: { path, ip, error: (error as Error).message } });
      if (process.env.NODE_ENV === 'development') {
        const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (!serviceAccountJson || serviceAccountJson.trim() === '') {
          ErrorService.logWarning('Development mode: Firebase Admin SDK not configured, allowing admin API access', { component: 'Middleware', metadata: { path, ip } });
          return response;
        }
      }
      return NextResponse.json({ error: 'An internal server error occurred during authentication.' }, { status: 500 });
    }
  }

  // Track successful request (only for important routes)
  const isImportantRoute = path.includes('/api/') || path.includes('/admin') || path.includes('/payment');
  if (isImportantRoute && process.env.NODE_ENV === 'development') {
    console.log(`📡 ${method} ${path} - ${Date.now() - startTime}ms`);
  }

  // Add some helpful headers
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  response.headers.set('X-Served-By', 'middleware');

  return response;
}

// Broad matcher from enhanced middleware (keep middleware running for app routes)
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
