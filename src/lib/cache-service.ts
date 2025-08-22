/**
 * Advanced Caching Service with Redis support and fallback strategies
 * Provides multi-level caching with TTL, tagging, and invalidation
 */

import { ErrorService } from './error-service';
import { ResilienceService } from './resilience-service';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for bulk invalidation
  prefix?: string; // Key prefix
  fallbackToMemory?: boolean; // Fallback to memory if Redis fails
  compress?: boolean; // Compress large values
}

interface CacheEntry<T> {
  data: T;
  expires: number;
  tags: string[];
  compressed?: boolean;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Maximum number of entries

  set<T>(key: string, value: T, ttl: number, tags: string[] = []): void {
    // Cleanup if at max size
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data: value,
      expires: Date.now() + (ttl * 1000),
      tags,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidateByTag(tag: string): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    let removed = 0;
    
    // Remove expired entries first
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    // If still at max size, remove oldest entries (simple LRU)
    if (this.cache.size >= this.maxSize && removed === 0) {
      const keys = Array.from(this.cache.keys()).slice(0, Math.floor(this.maxSize * 0.1));
      keys.forEach(key => this.cache.delete(key));
    }
  }

  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

export class CacheService {
  private static memoryCache = new MemoryCache();
  private static redisClient: any = null; // Will be set if Redis is available
  private static isRedisAvailable = false;

  /**
   * Initialize Redis connection if available
   */
  static async initialize(): Promise<void> {
    try {
      // Try to connect to Redis only if URL is provided and ioredis is available
      if (process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING) {
        try {
          // Try to dynamically import ioredis - it's optional
          const RedisModule = await eval("import('ioredis')") as any;
          
          this.redisClient = new RedisModule.default(
            process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING!
          );
          
          await this.redisClient.ping();
          this.isRedisAvailable = true;
          
          ErrorService.logInfo('Redis cache initialized successfully', {
            component: 'CacheService',
          });
        } catch (importError) {
          ErrorService.logInfo('Redis not available (ioredis not installed), using memory cache only', {
            component: 'CacheService',
            metadata: { message: 'Install ioredis for Redis support: npm install ioredis' },
          });
          this.isRedisAvailable = false;
        }
      } else {
        ErrorService.logInfo('Redis not configured, using memory cache only', {
          component: 'CacheService',
        });
      }
    } catch (error) {
      ErrorService.logWarning('Redis initialization failed, using memory cache only', {
        component: 'CacheService',
        metadata: { error: (error as Error).message },
      });
      this.isRedisAvailable = false;
    }
  }

  /**
   * Set cache value with TTL and tags
   */
  static async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    const config = {
      ttl: 300, // 5 minutes default
      tags: [],
      prefix: 'driveRight',
      fallbackToMemory: true,
      compress: false,
      ...options,
    };

    const cacheKey = `${config.prefix}:${key}`;
    const serializedValue = JSON.stringify(value);
    
    try {
      // Try Redis first if available
      if (this.isRedisAvailable && this.redisClient) {
        await ResilienceService.withTimeout(
          async () => {
            await this.redisClient.setex(cacheKey, config.ttl, serializedValue);
            
            // Store tags for invalidation
            if (config.tags.length > 0) {
              const tagPromises = config.tags.map(tag => 
                this.redisClient.sadd(`${config.prefix}:tag:${tag}`, cacheKey)
              );
              await Promise.all(tagPromises);
            }
          },
          5000, // 5 second timeout
          'Redis cache operation timed out'
        );
        
        return;
      }
    } catch (error) {
      ErrorService.logWarning('Redis cache set failed', {
        component: 'CacheService',
        metadata: { 
          key: cacheKey,
          error: (error as Error).message 
        },
      });
      
      if (!config.fallbackToMemory) {
        throw error;
      }
    }

    // Fallback to memory cache
    this.memoryCache.set(cacheKey, value, config.ttl, config.tags);
  }

  /**
   * Get cache value
   */
  static async get<T>(key: string, prefix = 'driveRight'): Promise<T | null> {
    const cacheKey = `${prefix}:${key}`;
    
    try {
      // Try Redis first if available
      if (this.isRedisAvailable && this.redisClient) {
        const value = await ResilienceService.withTimeout(
          () => this.redisClient.get(cacheKey),
          3000, // 3 second timeout
          'Redis cache read timed out'
        );
        
        if (value && typeof value === 'string') {
          return JSON.parse(value);
        }
      }
    } catch (error) {
      ErrorService.logWarning('Redis cache get failed', {
        component: 'CacheService',
        metadata: { 
          key: cacheKey,
          error: (error as Error).message 
        },
      });
    }

    // Fallback to memory cache
    return this.memoryCache.get<T>(cacheKey);
  }

  /**
   * Delete specific cache key
   */
  static async delete(key: string, prefix = 'driveRight'): Promise<boolean> {
    const cacheKey = `${prefix}:${key}`;
    let redisDeleted = false;
    
    try {
      if (this.isRedisAvailable && this.redisClient) {
        redisDeleted = await this.redisClient.del(cacheKey) > 0;
      }
    } catch (error) {
      ErrorService.logWarning('Redis cache delete failed', {
        component: 'CacheService',
        metadata: { 
          key: cacheKey,
          error: (error as Error).message 
        },
      });
    }

    const memoryDeleted = this.memoryCache.delete(cacheKey);
    return redisDeleted || memoryDeleted;
  }

  /**
   * Invalidate cache by tags
   */
  static async invalidateByTag(tag: string, prefix = 'driveRight'): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        const tagKey = `${prefix}:tag:${tag}`;
        const keys = await this.redisClient.smembers(tagKey);
        
        if (keys.length > 0) {
          await Promise.all([
            this.redisClient.del(...keys),
            this.redisClient.del(tagKey),
          ]);
        }
      }
    } catch (error) {
      ErrorService.logWarning('Redis tag invalidation failed', {
        component: 'CacheService',
        metadata: { 
          tag,
          error: (error as Error).message 
        },
      });
    }

    // Also invalidate memory cache
    this.memoryCache.invalidateByTag(tag);
  }

  /**
   * Clear all cache
   */
  static async clear(prefix = 'driveRight'): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        const keys = await this.redisClient.keys(`${prefix}:*`);
        
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
        }
      }
    } catch (error) {
      ErrorService.logWarning('Redis cache clear failed', {
        component: 'CacheService',
        metadata: { error: (error as Error).message },
      });
    }

    this.memoryCache.clear();
  }

  /**
   * Get or set with automatic caching
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options.prefix);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, options);
    
    return data;
  }

  /**
   * Memoize function with caching
   */
  static memoize<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    keyGenerator: (...args: TArgs) => string,
    options: CacheOptions = {}
  ) {
    return async (...args: TArgs): Promise<TReturn> => {
      const key = keyGenerator(...args);
      return this.getOrSet(key, () => fn(...args), options);
    };
  }

  /**
   * Cache stats and health check
   */
  static async getStats(): Promise<{
    redis: { available: boolean; connected?: boolean };
    memory: { size: number; maxSize: number };
  }> {
    const memoryStats = this.memoryCache.getStats();
    let redisConnected = false;
    
    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.ping();
        redisConnected = true;
      } catch {
        redisConnected = false;
      }
    }

    return {
      redis: {
        available: this.isRedisAvailable,
        connected: redisConnected,
      },
      memory: memoryStats,
    };
  }

  /**
   * Warming cache with frequently accessed data
   */
  static async warmCache(warmupData: Array<{
    key: string;
    fetcher: () => Promise<any>;
    options?: CacheOptions;
  }>): Promise<void> {
    ErrorService.logInfo('Starting cache warmup', {
      component: 'CacheService',
      metadata: { itemCount: warmupData.length },
    });

    const warmupPromises = warmupData.map(async ({ key, fetcher, options }) => {
      try {
        await this.getOrSet(key, fetcher, options);
      } catch (error) {
        ErrorService.logWarning(`Cache warmup failed for key: ${key}`, {
          component: 'CacheService',
          metadata: { 
            key,
            error: (error as Error).message 
          },
        });
      }
    });

    await Promise.allSettled(warmupPromises);
    
    ErrorService.logInfo('Cache warmup completed', {
      component: 'CacheService',
    });
  }
}
