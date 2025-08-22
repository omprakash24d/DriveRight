// src/lib/cache.ts - Production caching system
// 
// For production Redis caching, install: npm install ioredis
// Set REDIS_URL environment variable: redis://localhost:6379
// Falls back to memory cache when Redis is not available

// Type definitions for Redis (when available)
interface RedisClient {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<void>;
  del(key: string): Promise<number>;
  flushall(): Promise<void>;
}

// Redis client for production caching (optional)
let redis: RedisClient | null = null;

// Initialize Redis only if available and in production
const initializeRedis = async (): Promise<void> => {
  if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
    try {
      // Try to load Redis module dynamically
      const redisModule = await eval('import("ioredis")').catch(() => null);
      if (redisModule?.Redis) {
        redis = new redisModule.Redis(process.env.REDIS_URL);

      } else {
        console.info('Redis module not available, using memory cache');
      }
    } catch (error) {
      console.info('Redis not configured, using memory cache fallback');
      redis = null;
    }
  }
};

// Initialize Redis on module load (server-side only)
if (typeof window === 'undefined') {
  initializeRedis().catch(() => {
    // Silently fall back to memory cache if Redis initialization fails
  });
}

// Memory cache fallback for development
const memoryCache = new Map<string, { data: any; expiry: number }>();

export class CacheService {
  private static instance: CacheService;
  
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (redis) {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
      }
      
      // Memory cache fallback
      const cached = memoryCache.get(key);
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }
      
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, data: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      if (redis) {
        await redis.setex(key, ttlSeconds, JSON.stringify(data));
        return;
      }
      
      // Memory cache fallback
      memoryCache.set(key, {
        data,
        expiry: Date.now() + (ttlSeconds * 1000)
      });
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (redis) {
        await redis.del(key);
        return;
      }
      
      memoryCache.delete(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async flush(): Promise<void> {
    try {
      if (redis) {
        await redis.flushall();
        return;
      }
      
      memoryCache.clear();
    } catch (error) {
      console.error('Cache flush error:', error);
    }
  }
}

// Cache keys
export const CACHE_KEYS = {
  COURSES: 'courses:all',
  INSTRUCTORS: 'instructors:all',
  STUDENT_ENROLLMENTS: (id: string) => `student:${id}:enrollments`,
  CERTIFICATES: (id: string) => `certificates:${id}`,
  SETTINGS: 'settings:app',
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  SHORT: 300,    // 5 minutes
  MEDIUM: 1800,  // 30 minutes
  LONG: 3600,    // 1 hour
  DAILY: 86400,  // 24 hours
} as const;
