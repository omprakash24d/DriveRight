/**
 * Enhanced Middleware with comprehensive security, monitoring, and performance optimization
 * This middleware integrates all robustness services for maximum protection and insights
 */

import { CacheService } from '@/lib/cache-service';
import { ErrorService } from '@/lib/error-service';
import { MonitoringService } from '@/lib/monitoring-service';
import { SecurityService } from '@/lib/security-service';
import { NextRequest, NextResponse } from "next/server";

// Initialize services
let servicesInitialized = false;

async function initializeServices() {
  if (servicesInitialized) return;
  
  try {
    await Promise.all([
      SecurityService.initialize(),
      CacheService.initialize(),
    ]);
    
    MonitoringService.startPeriodicCleanup();
    servicesInitialized = true;
    
    ErrorService.logInfo('Enhanced middleware services initialized', {
      component: 'EnhancedMiddleware',
    });
  } catch (error) {
    ErrorService.logError('Failed to initialize middleware services', {
      component: 'EnhancedMiddleware',
      metadata: { error: (error as Error).message },
    });
  }
}

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  return cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';
}

// Enhanced security headers
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy with comprehensive coverage
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.sentry-cdn.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://ssl.gstatic.com https://apis.google.com https://connect.facebook.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://checkout.razorpay.com",
    "font-src 'self' https://fonts.gstatic.com https://checkout.razorpay.com",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' blob: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.razorpay.com",
    "frame-ancestors 'none'",
    "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://www.google.com",
    "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://www.googletagmanager.com https://*.sentry.io https://vitals.vercel-insights.com https://firestore.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com",
    "worker-src 'self' blob:",
    "child-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  // Comprehensive security headers
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), payment=(self "https://checkout.razorpay.com"), autoplay=(self), fullscreen=(self)');
  
  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Additional security headers
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site');
  
  return response;
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  // Initialize services on first request
  await initializeServices();
  
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || undefined;
  const method = request.method;
  const path = request.nextUrl.pathname;
  const url = request.url;

  try {
    // Security checks
    if (SecurityService.isIPBlocked(ip)) {
      const response = new NextResponse('Access Denied', { status: 403 });
      
      MonitoringService.trackRequest({
        method,
        path,
        statusCode: 403,
        duration: Date.now() - startTime,
        timestamp: startTime,
        ip,
        userAgent,
        error: 'IP_BLOCKED',
      });
      
      return addSecurityHeaders(response);
    }

    // Rate limiting
    const { allowed: rateLimitAllowed, remainingRequests } = SecurityService.checkRateLimit(ip);
    
    if (!rateLimitAllowed) {
      await SecurityService.blockIP(ip, 'Rate limit exceeded', 15);
      
      const response = new NextResponse('Rate Limit Exceeded', { status: 429 });
      response.headers.set('Retry-After', '60');
      response.headers.set('X-RateLimit-Remaining', '0');
      
      MonitoringService.trackRequest({
        method,
        path,
        statusCode: 429,
        duration: Date.now() - startTime,
        timestamp: startTime,
        ip,
        userAgent,
        error: 'RATE_LIMIT_EXCEEDED',
      });
      
      return addSecurityHeaders(response);
    }

    // Input validation for suspicious patterns
    const queryParams = request.nextUrl.searchParams.toString();
    if (queryParams) {
      const validationResult = SecurityService.validateInput(queryParams, 'query_params');
      if (!validationResult.valid) {
        ErrorService.logWarning('Suspicious input detected in query parameters', {
          component: 'EnhancedMiddleware',
          metadata: {
            ip,
            path,
            threats: validationResult.threats,
          },
        });
      }
    }

    // Create response
    let response = NextResponse.next();

    // Add security headers
    response = addSecurityHeaders(response);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', remainingRequests.toString());
    response.headers.set('X-RateLimit-Limit', '60');

    // Add performance headers
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
    response.headers.set('X-Served-By', 'enhanced-middleware');

    // CORS headers for API routes
    if (path.startsWith('/api/')) {
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      response.headers.set('Access-Control-Max-Age', '86400');
    }

    // Handle preflight requests
    if (method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers: response.headers });
    }

    // Admin route protection
    if (path.startsWith('/api/admin/')) {
      const sessionCookie = request.cookies.get('__session')?.value;
      
      if (!sessionCookie) {
        // Development mode bypass
        if (process.env.NODE_ENV === 'development') {
          const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
          if (!serviceAccountJson || serviceAccountJson.trim() === '') {
            ErrorService.logWarning('Development mode: Firebase Admin SDK not configured, allowing admin API access', {
              component: 'EnhancedMiddleware',
              metadata: { path, ip },
            });
            return response;
          }
        }
        
        const unauthorizedResponse = NextResponse.json(
          { error: 'Unauthorized: No session cookie provided.' },
          { status: 401 }
        );
        
        MonitoringService.trackRequest({
          method,
          path,
          statusCode: 401,
          duration: Date.now() - startTime,
          timestamp: startTime,
          ip,
          userAgent,
          error: 'NO_SESSION_COOKIE',
        });
        
        return addSecurityHeaders(unauthorizedResponse);
      }

      // Additional admin security check
      const adminAccessResult = await SecurityService.checkAdminAccess(ip, 'unknown', userAgent);
      if (!adminAccessResult.allowed) {
        const forbiddenResponse = NextResponse.json(
          { error: `Forbidden: ${adminAccessResult.reason}` },
          { status: 403 }
        );
        
        MonitoringService.trackRequest({
          method,
          path,
          statusCode: 403,
          duration: Date.now() - startTime,
          timestamp: startTime,
          ip,
          userAgent,
          error: 'ADMIN_ACCESS_DENIED',
        });
        
        return addSecurityHeaders(forbiddenResponse);
      }

      try {
        // Verify session with internal API
        const verificationUrl = new URL('/api/auth/verify-session', request.url);
        
        const verificationResponse = await fetch(verificationUrl.toString(), {
          headers: {
            Cookie: `__session=${sessionCookie}`,
          },
          // Add timeout
          signal: AbortSignal.timeout(5000),
        });
        
        if (!verificationResponse.ok) {
          const errorResponse = NextResponse.json(
            { error: 'Unauthorized: Invalid session.' },
            { status: 401 }
          );
          errorResponse.cookies.set('__session', '', { expires: new Date(0) });
          
          MonitoringService.trackRequest({
            method,
            path,
            statusCode: 401,
            duration: Date.now() - startTime,
            timestamp: startTime,
            ip,
            userAgent,
            error: 'INVALID_SESSION',
          });
          
          return addSecurityHeaders(errorResponse);
        }
      } catch (verificationError) {
        ErrorService.logError('Session verification failed', {
          component: 'EnhancedMiddleware',
          metadata: {
            path,
            ip,
            error: (verificationError as Error).message,
          },
        });
        
        // Development mode bypass for Firebase config issues
        if (process.env.NODE_ENV === 'development') {
          const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
          if (!serviceAccountJson || serviceAccountJson.trim() === '') {
            ErrorService.logWarning('Development mode: Firebase Admin SDK not configured, allowing admin API access', {
              component: 'EnhancedMiddleware',
              metadata: { path, ip },
            });
            return response;
          }
        }
        
        const errorResponse = NextResponse.json(
          { error: 'An internal server error occurred during authentication.' },
          { status: 500 }
        );
        
        MonitoringService.trackRequest({
          method,
          path,
          statusCode: 500,
          duration: Date.now() - startTime,
          timestamp: startTime,
          ip,
          userAgent,
          error: 'SESSION_VERIFICATION_ERROR',
        });
        
        return addSecurityHeaders(errorResponse);
      }
    }

    // Track successful request
    MonitoringService.trackRequest({
      method,
      path,
      statusCode: 200,
      duration: Date.now() - startTime,
      timestamp: startTime,
      ip,
      userAgent,
    });

    return response;

  } catch (error) {
    ErrorService.logError('Middleware error', {
      component: 'EnhancedMiddleware',
      metadata: {
        path,
        ip,
        method,
        error: (error as Error).message,
      },
    });

    MonitoringService.trackRequest({
      method,
      path,
      statusCode: 500,
      duration: Date.now() - startTime,
      timestamp: startTime,
      ip,
      userAgent,
      error: (error as Error).message,
    });

    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
    
    return addSecurityHeaders(errorResponse);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
