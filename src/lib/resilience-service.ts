/**
 * Resilience Service - Circuit Breaker, Retry Logic, and Graceful Degradation
 * Ensures robust operation under high load and failure conditions
 */

import { ErrorService } from './error-service';

interface RetryOptions {
  maxAttempts: number;
  backoffMs: number;
  exponentialBackoff: boolean;
  shouldRetry?: (error: Error) => boolean;
}

interface CircuitBreakerOptions {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.options.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.options.failureThreshold) {
      this.state = 'OPEN';
      ErrorService.logError(new Error(`Circuit breaker opened after ${this.failures} failures`), {
        component: 'CircuitBreaker',
        metadata: { threshold: this.options.failureThreshold },
      });
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  getState(): string {
    return this.state;
  }
}

export class ResilienceService {
  private static circuitBreakers = new Map<string, CircuitBreaker>();

  /**
   * Retry operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config: RetryOptions = {
      maxAttempts: 3,
      backoffMs: 1000,
      exponentialBackoff: true,
      shouldRetry: (error) => !error.message.includes('Validation'),
      ...options,
    };

    let lastError: Error;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === config.maxAttempts || !config.shouldRetry?.(lastError)) {
          ErrorService.logError(lastError, {
            component: 'ResilienceService',
            action: 'retry_exhausted',
            metadata: { attempts: attempt },
          });
          throw lastError;
        }

        const backoff = config.exponentialBackoff 
          ? config.backoffMs * Math.pow(2, attempt - 1)
          : config.backoffMs;
        
        await this.sleep(backoff);
        
        ErrorService.logWarning(`Retry attempt ${attempt} failed, retrying in ${backoff}ms`, {
          component: 'ResilienceService',
          metadata: { 
            error: lastError.message,
            attempt,
            backoff 
          },
        });
      }
    }

    throw lastError!;
  }

  /**
   * Execute operation with circuit breaker pattern
   */
  static async withCircuitBreaker<T>(
    operationName: string,
    operation: () => Promise<T>,
    options: Partial<CircuitBreakerOptions> = {}
  ): Promise<T> {
    const config: CircuitBreakerOptions = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 10000, // 10 seconds
      ...options,
    };

    if (!this.circuitBreakers.has(operationName)) {
      this.circuitBreakers.set(operationName, new CircuitBreaker(config));
    }

    const circuitBreaker = this.circuitBreakers.get(operationName)!;
    return circuitBreaker.execute(operation);
  }

  /**
   * Timeout wrapper for operations
   */
  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    timeoutMessage = 'Operation timed out'
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
      }),
    ]);
  }

  /**
   * Graceful degradation - fallback to cached or default values
   */
  static async withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T> | T,
    fallbackMessage = 'Using cached/default data due to service unavailability'
  ): Promise<T> {
    try {
      return await primary();
    } catch (error) {
      ErrorService.logWarning(fallbackMessage, {
        component: 'ResilienceService',
        metadata: { error: (error as Error).message },
      });
      
      return typeof fallback === 'function' ? await fallback() : fallback;
    }
  }

  /**
   * Rate limiting for operations
   */
  static async withRateLimit<T>(
    operation: () => Promise<T>,
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<T> {
    // Simple in-memory rate limiting (in production, use Redis)
    const now = Date.now();
    const windowKey = `${key}_${Math.floor(now / windowMs)}`;
    
    if (!this.rateLimitStore.has(windowKey)) {
      this.rateLimitStore.set(windowKey, 0);
      // Clean up old windows
      setTimeout(() => this.rateLimitStore.delete(windowKey), windowMs);
    }

    const currentCount = this.rateLimitStore.get(windowKey) || 0;
    
    if (currentCount >= maxRequests) {
      throw new Error(`Rate limit exceeded for ${key}`);
    }

    this.rateLimitStore.set(windowKey, currentCount + 1);
    return operation();
  }

  /**
   * Bulkhead pattern - isolate resources
   */
  static async withBulkhead<T>(
    operation: () => Promise<T>,
    poolName: string,
    maxConcurrent: number = 10
  ): Promise<T> {
    if (!this.bulkheadPools.has(poolName)) {
      this.bulkheadPools.set(poolName, { active: 0, queue: [] });
    }

    const pool = this.bulkheadPools.get(poolName)!;
    
    if (pool.active >= maxConcurrent) {
      return new Promise((resolve, reject) => {
        pool.queue.push({ operation, resolve, reject });
      });
    }

    pool.active++;
    
    try {
      const result = await operation();
      return result;
    } finally {
      pool.active--;
      
      // Process queue
      if (pool.queue.length > 0 && pool.active < maxConcurrent) {
        const next = pool.queue.shift()!;
        pool.active++;
        
        next.operation()
          .then(next.resolve)
          .catch(next.reject)
          .finally(() => {
            pool.active--;
          });
      }
    }
  }

  private static rateLimitStore = new Map<string, number>();
  private static bulkheadPools = new Map<string, {
    active: number;
    queue: Array<{
      operation: () => Promise<any>;
      resolve: (value: any) => void;
      reject: (error: any) => void;
    }>;
  }>();

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for circuit breakers
   */
  static getCircuitBreakerStatus(): Record<string, string> {
    const status: Record<string, string> = {};
    
    this.circuitBreakers.forEach((breaker, name) => {
      status[name] = breaker.getState();
    });
    
    return status;
  }

  /**
   * Reset all circuit breakers (admin function)
   */
  static resetCircuitBreakers(): void {
    this.circuitBreakers.clear();
    ErrorService.logInfo('All circuit breakers reset', {
      component: 'ResilienceService',
      action: 'reset_all_breakers',
    });
  }
}
