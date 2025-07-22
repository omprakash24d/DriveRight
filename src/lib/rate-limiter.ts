// src/lib/rate-limiter.ts - API rate limiting
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

class RateLimiter {
  private requests = new Map<string, number[]>();
  
  constructor(private config: RateLimitConfig) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get existing requests for this identifier
    let userRequests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    userRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (userRequests.length >= this.config.maxRequests) {
      return false;
    }
    
    // Add current request
    userRequests.push(now);
    this.requests.set(identifier, userRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const userRequests = this.requests.get(identifier) || [];
    const windowStart = Date.now() - this.config.windowMs;
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.config.maxRequests - validRequests.length);
  }
  
  getResetTime(identifier: string): number {
    const userRequests = this.requests.get(identifier) || [];
    if (userRequests.length === 0) return 0;
    
    const oldestRequest = Math.min(...userRequests);
    return oldestRequest + this.config.windowMs;
  }
  
  // Cleanup old entries periodically
  cleanup(): void {
    const now = Date.now();
    
    for (const [identifier, requests] of this.requests.entries()) {
      const windowStart = now - this.config.windowMs;
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// Rate limiting configurations
export const RATE_LIMITS = {
  ENROLLMENT: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 3,            // 3 enrollments per 15 minutes
    message: 'Too many enrollment attempts. Please try again later.'
  }),
  
  CONTACT: new RateLimiter({
    windowMs: 5 * 60 * 1000,  // 5 minutes
    maxRequests: 2,           // 2 contact submissions per 5 minutes
    message: 'Too many contact submissions. Please try again later.'
  }),
  
  LOGIN: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,           // 5 login attempts per 15 minutes
    message: 'Too many login attempts. Please try again later.'
  }),
  
  API_GENERAL: new RateLimiter({
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 60,          // 60 requests per minute
    message: 'Rate limit exceeded. Please slow down.'
  })
} as const;

// Middleware helper for Next.js API routes
export function withRateLimit(
  limiter: RateLimiter, 
  getIdentifier: (req: Request) => string = (req) => 
    req.headers.get('x-forwarded-for') || 
    req.headers.get('x-real-ip') || 
    'unknown'
) {
  return function rateLimitMiddleware(req: Request): Response | null {
    const identifier = getIdentifier(req);
    
    if (!limiter.isAllowed(identifier)) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          remaining: limiter.getRemainingRequests(identifier),
          resetTime: limiter.getResetTime(identifier)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': limiter.getRemainingRequests(identifier).toString(),
            'X-RateLimit-Reset': limiter.getResetTime(identifier).toString()
          }
        }
      );
    }
    
    return null; // Allow request to proceed
  };
}

// Cleanup interval (run every 10 minutes)
if (typeof window === 'undefined') {
  setInterval(() => {
    Object.values(RATE_LIMITS).forEach(limiter => limiter.cleanup());
  }, 10 * 60 * 1000);
}
