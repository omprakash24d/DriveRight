/**
 * Enhanced API Route Template with comprehensive error handling, monitoring, and security
 * Use this template for creating robust API endpoints
 */

import { CacheService } from '@/lib/cache-service';
import { ErrorService } from '@/lib/error-service';
import { MonitoringService } from '@/lib/monitoring-service';
import { ResilienceService } from '@/lib/resilience-service';
import { SecurityService } from '@/lib/security-service';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  return cfConnectingIp || realIp || forwarded?.split(',')[0] || 'unknown';
}

// Enhanced API handler wrapper
export function withEnhancedAPI<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    requireAdmin?: boolean;
    rateLimit?: { maxRequests: number; windowMs: number };
    validation?: {
      body?: z.ZodSchema;
      query?: z.ZodSchema;
    };
    cache?: {
      key?: (request: NextRequest) => string;
      ttl?: number;
      tags?: string[];
    };
  } = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now();
    const ip = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || undefined;
    const method = request.method;
    const path = new URL(request.url).pathname;

    try {
      // Security checks
      if (SecurityService.isIPBlocked(ip)) {
        const response = NextResponse.json(
          { error: 'Access denied', code: 'IP_BLOCKED' },
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
          error: 'IP_BLOCKED',
        });
        
        return response;
      }

      // Rate limiting
      if (options.rateLimit) {
        const { allowed, remainingRequests } = SecurityService.checkRateLimit(ip);
        
        if (!allowed) {
          await SecurityService.blockIP(ip, 'Rate limit exceeded', 15);
          
          const response = NextResponse.json(
            { 
              error: 'Rate limit exceeded', 
              code: 'RATE_LIMIT_EXCEEDED',
              retryAfter: 60 
            },
            { status: 429 }
          );
          
          response.headers.set('X-RateLimit-Remaining', '0');
          response.headers.set('Retry-After', '60');
          
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
          
          return response;
        }
        
        // Add rate limit headers
        const response = new NextResponse();
        response.headers.set('X-RateLimit-Remaining', remainingRequests.toString());
      }

      // Input validation
      if (options.validation) {
        let body: any = null;
        let query: any = null;

        if (options.validation.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
          try {
            const bodyText = await request.text();
            body = bodyText ? JSON.parse(bodyText) : {};
            
            // Validate body
            const validationResult = options.validation.body.safeParse(body);
            if (!validationResult.success) {
              const response = NextResponse.json(
                { 
                  error: 'Validation failed', 
                  code: 'VALIDATION_ERROR',
                  details: validationResult.error.issues 
                },
                { status: 400 }
              );
              
              MonitoringService.trackRequest({
                method,
                path,
                statusCode: 400,
                duration: Date.now() - startTime,
                timestamp: startTime,
                ip,
                userAgent,
                error: 'VALIDATION_ERROR',
              });
              
              return response;
            }
            
            body = validationResult.data;
          } catch (parseError) {
            const response = NextResponse.json(
              { error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
              { status: 400 }
            );
            
            MonitoringService.trackRequest({
              method,
              path,
              statusCode: 400,
              duration: Date.now() - startTime,
              timestamp: startTime,
              ip,
              userAgent,
              error: 'INVALID_JSON',
            });
            
            return response;
          }
        }

        if (options.validation.query) {
          const url = new URL(request.url);
          const queryParams = Object.fromEntries(url.searchParams.entries());
          
          const validationResult = options.validation.query.safeParse(queryParams);
          if (!validationResult.success) {
            const response = NextResponse.json(
              { 
                error: 'Query validation failed', 
                code: 'QUERY_VALIDATION_ERROR',
                details: validationResult.error.issues 
              },
              { status: 400 }
            );
            
            MonitoringService.trackRequest({
              method,
              path,
              statusCode: 400,
              duration: Date.now() - startTime,
              timestamp: startTime,
              ip,
              userAgent,
              error: 'QUERY_VALIDATION_ERROR',
            });
            
            return response;
          }
          
          query = validationResult.data;
        }

        // Add validated data to request context
        if (context) {
          context.body = body;
          context.query = query;
        }
      }

      // Check cache if configured
      if (options.cache && method === 'GET') {
        const cacheKey = options.cache.key ? options.cache.key(request) : path;
        const cached = await CacheService.get(cacheKey);
        
        if (cached) {
          const response = NextResponse.json(cached);
          response.headers.set('X-Cache', 'HIT');
          
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
        }
      }

      // Execute the actual handler with resilience patterns
      const result = await ResilienceService.withTimeout(
        async () => {
          if (options.requireAuth || options.requireAdmin) {
            // Add authentication/authorization logic here
            // This would integrate with your auth system
          }

          return handler(request, context);
        },
        30000, // 30 second timeout
        'API request timed out'
      );

      // Cache successful GET responses
      if (options.cache && method === 'GET' && result.status === 200) {
        try {
          const responseData = await result.clone().json();
          const cacheKey = options.cache.key ? options.cache.key(request) : path;
          
          await CacheService.set(cacheKey, responseData, {
            ttl: options.cache.ttl || 300,
            tags: options.cache.tags || [path],
          });
          
          result.headers.set('X-Cache', 'MISS');
        } catch (cacheError) {
          ErrorService.logWarning('Failed to cache response', {
            component: 'APIHandler',
            metadata: { 
              path,
              error: (cacheError as Error).message 
            },
          });
        }
      }

      // Track successful request
      MonitoringService.trackRequest({
        method,
        path,
        statusCode: result.status,
        duration: Date.now() - startTime,
        timestamp: startTime,
        ip,
        userAgent,
        responseSize: parseInt(result.headers.get('content-length') || '0'),
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const statusCode = error instanceof Error && error.message.includes('Unauthorized') ? 401
        : error instanceof Error && error.message.includes('Forbidden') ? 403
        : error instanceof Error && error.message.includes('Not Found') ? 404
        : error instanceof Error && error.message.includes('Validation') ? 400
        : 500;

      // Log error
      ErrorService.logError(error as Error, {
        component: 'APIHandler',
        metadata: {
          method,
          path,
          ip,
          userAgent,
          duration: Date.now() - startTime,
        },
      });

      // Track error request
      MonitoringService.trackRequest({
        method,
        path,
        statusCode,
        duration: Date.now() - startTime,
        timestamp: startTime,
        ip,
        userAgent,
        error: errorMessage,
      });

      // Return error response
      return NextResponse.json(
        { 
          error: statusCode === 500 ? 'Internal server error' : errorMessage,
          code: `ERROR_${statusCode}`,
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
        { status: statusCode }
      );
    }
  };
}

// Example usage schemas
export const commonSchemas = {
  paginationQuery: z.object({
    page: z.string().transform(val => parseInt(val) || 1),
    limit: z.string().transform(val => Math.min(parseInt(val) || 10, 100)),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),

  serviceBody: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.number().min(0, 'Price must be non-negative'),
    category: z.string().min(1, 'Category is required'),
    features: z.array(z.string()),
    duration: z.string().min(1, 'Duration is required'),
    status: z.enum(['active', 'inactive', 'draft']).default('active'),
  }),

  userQuery: z.object({
    search: z.string().optional(),
    role: z.enum(['student', 'instructor', 'admin']).optional(),
    status: z.enum(['active', 'inactive', 'pending']).optional(),
  }),
};

// Example API route using the enhanced wrapper
export const GET = withEnhancedAPI(
  async (request: NextRequest) => {
    // Your API logic here
    return NextResponse.json({ message: 'Success' });
  },
  {
    rateLimit: { maxRequests: 60, windowMs: 60000 },
    cache: {
      key: (req) => new URL(req.url).pathname,
      ttl: 300,
      tags: ['api'],
    },
    validation: {
      query: commonSchemas.paginationQuery,
    },
  }
);

export const POST = withEnhancedAPI(
  async (request: NextRequest, context?: any) => {
    const { body } = context;
    // Your API logic here with validated body
    return NextResponse.json({ message: 'Created', data: body });
  },
  {
    requireAuth: true,
    rateLimit: { maxRequests: 30, windowMs: 60000 },
    validation: {
      body: commonSchemas.serviceBody,
    },
  }
);
