/**
 * Enhanced API Monitoring and Analytics Service
 * Provides comprehensive request/response tracking, performance metrics, and health monitoring
 */

import { CacheService } from './cache-service';
import { ErrorService } from './error-service';

interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
  error?: string;
  responseSize?: number;
  requestSize?: number;
}

interface PerformanceMetrics {
  endpoint: string;
  averageResponseTime: number;
  requestCount: number;
  errorRate: number;
  slowRequestThreshold: number;
  slowRequestCount: number;
  lastUpdated: number;
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: number;
  details?: Record<string, any>;
}

export class MonitoringService {
  private static metrics: RequestMetrics[] = [];
  private static readonly MAX_METRICS_IN_MEMORY = 1000;
  private static readonly SLOW_REQUEST_THRESHOLD = 2000; // 2 seconds

  /**
   * Track API request performance
   */
  static trackRequest(metrics: RequestMetrics): void {
    // Add to in-memory storage
    this.metrics.push(metrics);
    
    // Keep only recent metrics in memory
    if (this.metrics.length > this.MAX_METRICS_IN_MEMORY) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS_IN_MEMORY);
    }

    // Log slow requests
    if (metrics.duration > this.SLOW_REQUEST_THRESHOLD) {
      ErrorService.logWarning(`Slow API request detected: ${metrics.method} ${metrics.path}`, {
        component: 'MonitoringService',
        metadata: {
          duration: metrics.duration,
          statusCode: metrics.statusCode,
          path: metrics.path,
        },
      });
    }

    // Log errors
    if (metrics.statusCode >= 400) {
      const logMethod = metrics.statusCode >= 500 ? 'logError' : 'logWarning';
      ErrorService[logMethod](`API error: ${metrics.method} ${metrics.path}`, {
        component: 'MonitoringService',
        metadata: {
          statusCode: metrics.statusCode,
          duration: metrics.duration,
          error: metrics.error,
          userId: metrics.userId,
        },
      });
    }

    // Track with Sentry performance monitoring
    ErrorService.trackPerformance({
      operation: `${metrics.method} ${metrics.path}`,
      duration: metrics.duration,
      metadata: {
        statusCode: metrics.statusCode,
        success: metrics.statusCode < 400,
      },
    });
  }

  /**
   * Get performance metrics for an endpoint
   */
  static async getEndpointMetrics(endpoint: string): Promise<PerformanceMetrics | null> {
    const cacheKey = `endpoint_metrics:${endpoint}`;
    
    return CacheService.getOrSet(
      cacheKey,
      async () => {
        const endpointMetrics = this.metrics.filter(m => 
          m.path === endpoint || m.path.includes(endpoint)
        );

        if (endpointMetrics.length === 0) {
          return null;
        }

        const totalRequests = endpointMetrics.length;
        const errorCount = endpointMetrics.filter(m => m.statusCode >= 400).length;
        const slowRequests = endpointMetrics.filter(m => m.duration > this.SLOW_REQUEST_THRESHOLD).length;
        const averageResponseTime = endpointMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;

        return {
          endpoint,
          averageResponseTime: Math.round(averageResponseTime),
          requestCount: totalRequests,
          errorRate: Math.round((errorCount / totalRequests) * 100 * 100) / 100,
          slowRequestThreshold: this.SLOW_REQUEST_THRESHOLD,
          slowRequestCount: slowRequests,
          lastUpdated: Date.now(),
        };
      },
      { ttl: 60, tags: ['metrics'] } // Cache for 1 minute
    );
  }

  /**
   * Get overall system metrics
   */
  static async getSystemMetrics(): Promise<{
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    topEndpoints: Array<{ endpoint: string; count: number }>;
    recentErrors: RequestMetrics[];
  }> {
    return CacheService.getOrSet(
      'system_metrics',
      async () => {
        const now = Date.now();
        const recentMetrics = this.metrics.filter(m => 
          now - m.timestamp < 3600000 // Last hour
        );

        const totalRequests = recentMetrics.length;
        const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
        const averageResponseTime = totalRequests > 0 
          ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests 
          : 0;

        // Count requests per endpoint
        const endpointCounts = recentMetrics.reduce((acc, m) => {
          acc[m.path] = (acc[m.path] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const topEndpoints = Object.entries(endpointCounts)
          .map(([endpoint, count]) => ({ endpoint, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        const recentErrors = recentMetrics
          .filter(m => m.statusCode >= 400)
          .slice(-20)
          .reverse();

        return {
          totalRequests,
          averageResponseTime: Math.round(averageResponseTime),
          errorRate: totalRequests > 0 ? Math.round((errorCount / totalRequests) * 100 * 100) / 100 : 0,
          topEndpoints,
          recentErrors,
        };
      },
      { ttl: 30, tags: ['metrics'] } // Cache for 30 seconds
    );
  }

  /**
   * Health check for various services
   */
  static async performHealthChecks(): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    // Database health check
    try {
      const start = Date.now();
      // Simple Firestore test
      const testResult = await this.testFirestore();
      const duration = Date.now() - start;
      
      checks.push({
        service: 'firestore',
        status: testResult ? 'healthy' : 'unhealthy',
        responseTime: duration,
        lastCheck: Date.now(),
        details: { connectionTest: testResult },
      });
    } catch (error) {
      checks.push({
        service: 'firestore',
        status: 'unhealthy',
        responseTime: -1,
        lastCheck: Date.now(),
        details: { error: (error as Error).message },
      });
    }

    // Cache health check
    try {
      const start = Date.now();
      const cacheStats = await CacheService.getStats();
      const duration = Date.now() - start;
      
      checks.push({
        service: 'cache',
        status: cacheStats.redis.available ? 'healthy' : 'degraded',
        responseTime: duration,
        lastCheck: Date.now(),
        details: cacheStats,
      });
    } catch (error) {
      checks.push({
        service: 'cache',
        status: 'unhealthy',
        responseTime: -1,
        lastCheck: Date.now(),
        details: { error: (error as Error).message },
      });
    }

    // External API health checks
    if (process.env.NODE_ENV === 'production') {
      // Razorpay API health
      try {
        const start = Date.now();
        const razorpayTest = await this.testRazorpay();
        const duration = Date.now() - start;
        
        checks.push({
          service: 'razorpay',
          status: razorpayTest ? 'healthy' : 'degraded',
          responseTime: duration,
          lastCheck: Date.now(),
        });
      } catch (error) {
        checks.push({
          service: 'razorpay',
          status: 'unhealthy',
          responseTime: -1,
          lastCheck: Date.now(),
          details: { error: (error as Error).message },
        });
      }
    }

    return checks;
  }

  /**
   * Generate monitoring report
   */
  static async generateMonitoringReport(): Promise<{
    summary: any;
    healthChecks: HealthCheck[];
    topErrors: Array<{ error: string; count: number; lastOccurrence: number }>;
    performanceIssues: Array<{ endpoint: string; issue: string; severity: string }>;
  }> {
    const [systemMetrics, healthChecks] = await Promise.all([
      this.getSystemMetrics(),
      this.performHealthChecks(),
    ]);

    // Analyze top errors
    const errorMessages = this.metrics
      .filter(m => m.error)
      .reduce((acc, m) => {
        const key = m.error!;
        if (!acc[key]) {
          acc[key] = { count: 0, lastOccurrence: 0 };
        }
        acc[key].count++;
        acc[key].lastOccurrence = Math.max(acc[key].lastOccurrence, m.timestamp);
        return acc;
      }, {} as Record<string, { count: number; lastOccurrence: number }>);

    const topErrors = Object.entries(errorMessages)
      .map(([error, data]) => ({ error, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Identify performance issues
    const performanceIssues: Array<{ endpoint: string; issue: string; severity: string }> = [];
    
    for (const { endpoint } of systemMetrics.topEndpoints) {
      const metrics = await this.getEndpointMetrics(endpoint);
      if (metrics) {
        if (metrics.averageResponseTime > 5000) {
          performanceIssues.push({
            endpoint,
            issue: `Very slow average response time: ${metrics.averageResponseTime}ms`,
            severity: 'critical',
          });
        } else if (metrics.averageResponseTime > 2000) {
          performanceIssues.push({
            endpoint,
            issue: `Slow average response time: ${metrics.averageResponseTime}ms`,
            severity: 'warning',
          });
        }

        if (metrics.errorRate > 10) {
          performanceIssues.push({
            endpoint,
            issue: `High error rate: ${metrics.errorRate}%`,
            severity: 'critical',
          });
        } else if (metrics.errorRate > 5) {
          performanceIssues.push({
            endpoint,
            issue: `Elevated error rate: ${metrics.errorRate}%`,
            severity: 'warning',
          });
        }
      }
    }

    return {
      summary: systemMetrics,
      healthChecks,
      topErrors,
      performanceIssues,
    };
  }

  /**
   * Clear old metrics (cleanup job)
   */
  static clearOldMetrics(olderThanHours = 24): void {
    const cutoff = Date.now() - (olderThanHours * 60 * 60 * 1000);
    const originalLength = this.metrics.length;
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    const removed = originalLength - this.metrics.length;
    if (removed > 0) {
      ErrorService.logInfo(`Cleaned up ${removed} old metrics entries`, {
        component: 'MonitoringService',
        metadata: { removed, remaining: this.metrics.length },
      });
    }
  }

  /**
   * Set up periodic cleanup
   */
  static startPeriodicCleanup(): void {
    // Clean up old metrics every hour
    setInterval(() => {
      this.clearOldMetrics();
      CacheService.invalidateByTag('metrics');
    }, 60 * 60 * 1000);

    ErrorService.logInfo('Monitoring service cleanup started', {
      component: 'MonitoringService',
    });
  }

  // Helper methods for health checks
  private static async testFirestore(): Promise<boolean> {
    try {
      // Simple test - this would need actual Firestore implementation
      return true;
    } catch {
      return false;
    }
  }

  private static async testRazorpay(): Promise<boolean> {
    try {
      // Simple ping to Razorpay API
      if (!process.env.RAZORPAY_KEY_ID) return false;
      
      const response = await fetch('https://api.razorpay.com/v1/', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(process.env.RAZORPAY_KEY_ID + ':').toString('base64')}`,
        },
      });
      
      return response.status === 200 || response.status === 401; // 401 is expected without proper auth
    } catch {
      return false;
    }
  }

  /**
   * Get current metrics for debugging
   */
  static getCurrentMetrics(): RequestMetrics[] {
    return [...this.metrics];
  }

  /**
   * Reset all metrics (for testing)
   */
  static resetMetrics(): void {
    this.metrics = [];
    ErrorService.logInfo('All monitoring metrics reset', {
      component: 'MonitoringService',
    });
  }
}
