/**
 * Initialization Service for Enhanced DriveRight Application
 * Sets up all robustness services and performs health checks
 */

import { CacheService } from '../lib/cache-service';
import { DatabaseOptimizer } from '../lib/database-optimizer';
import { ErrorService } from '../lib/error-service';
import { MonitoringService } from '../lib/monitoring-service';
import { SecurityService } from '../lib/security-service';

interface InitializationResult {
  success: boolean;
  services: {
    errorService: boolean;
    cacheService: boolean;
    securityService: boolean;
    monitoringService: boolean;
    databaseOptimizer: boolean;
  };
  errors: string[];
  warnings: string[];
}

export class ApplicationInitializer {
  private static initialized = false;
  private static initializationResult: InitializationResult | null = null;

  /**
   * Initialize all application services
   */
  static async initialize(): Promise<InitializationResult> {
    if (this.initialized && this.initializationResult) {
      return this.initializationResult;
    }


    
    const result: InitializationResult = {
      success: true,
      services: {
        errorService: false,
        cacheService: false,
        securityService: false,
        monitoringService: false,
        databaseOptimizer: false,
      },
      errors: [],
      warnings: [],
    };

    // Initialize Error Service (foundational)
    try {
      // Error service is mostly static, just verify Sentry
      if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        ErrorService.logInfo('Error tracking service initialized', {
          component: 'ApplicationInitializer',
        });
        result.services.errorService = true;
      } else {
        result.warnings.push('Sentry DSN not configured - error tracking will be limited');
        result.services.errorService = true; // Still works without Sentry
      }
    } catch (error) {
      result.errors.push(`Error Service initialization failed: ${(error as Error).message}`);
      result.success = false;
    }

    // Initialize Cache Service
    try {
      await CacheService.initialize();
      const cacheStats = await CacheService.getStats();
      
      if (cacheStats.redis.available) {

      } else {
        result.warnings.push('Redis not available - using memory cache only');
      }
      
      result.services.cacheService = true;
    } catch (error) {
      result.errors.push(`Cache Service initialization failed: ${(error as Error).message}`);
      result.success = false;
    }

    // Initialize Security Service
    try {
      await SecurityService.initialize();

      result.services.securityService = true;
    } catch (error) {
      result.errors.push(`Security Service initialization failed: ${(error as Error).message}`);
      result.success = false;
    }

    // Initialize Monitoring Service
    try {
      MonitoringService.startPeriodicCleanup();

      result.services.monitoringService = true;
    } catch (error) {
      result.errors.push(`Monitoring Service initialization failed: ${(error as Error).message}`);
      result.success = false;
    }

    // Initialize Database Optimizer
    try {
      // Database optimizer is mostly static, just verify it's ready

      result.services.databaseOptimizer = true;
    } catch (error) {
      result.errors.push(`Database Optimizer initialization failed: ${(error as Error).message}`);
      result.success = false;
    }

    // Warm up critical caches
    if (result.services.cacheService) {
      try {
        await this.warmupCaches();

      } catch (error) {
        result.warnings.push(`Cache warmup failed: ${(error as Error).message}`);
      }
    }

    // Perform health checks
    try {
      await this.performHealthChecks();

    } catch (error) {
      result.warnings.push(`Health checks failed: ${(error as Error).message}`);
    }

    this.initialized = true;
    this.initializationResult = result;

    // Log initialization summary
    if (result.success) {

      ErrorService.logInfo('Application services initialized successfully', {
        component: 'ApplicationInitializer',
        metadata: {
          services: result.services,
          warnings: result.warnings,
        },
      });
    } else {
      console.error('❌ DriveRight initialization completed with errors');
      ErrorService.logError('Application initialization completed with errors', {
        component: 'ApplicationInitializer',
        metadata: {
          services: result.services,
          errors: result.errors,
          warnings: result.warnings,
        },
      });
    }

    return result;
  }

  /**
   * Warm up critical caches with frequently accessed data
   */
  private static async warmupCaches(): Promise<void> {
    const warmupTasks = [
      {
        key: 'app_config',
        fetcher: async () => ({
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          features: {
            analytics: !!process.env.NEXT_PUBLIC_GA_ID,
            payments: !!process.env.RAZORPAY_KEY_ID,
            monitoring: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
          },
        }),
        options: { ttl: 3600, tags: ['config'] },
      },
      {
        key: 'system_status',
        fetcher: async () => ({
          status: 'operational',
          lastCheck: Date.now(),
          services: Object.keys(this.initializationResult?.services || {}),
        }),
        options: { ttl: 300, tags: ['status'] },
      },
    ];

    await CacheService.warmCache(warmupTasks);
  }

  /**
   * Perform health checks on all services
   */
  private static async performHealthChecks(): Promise<void> {
    const healthChecks = await MonitoringService.performHealthChecks();
    
    for (const check of healthChecks) {
      if (check.status === 'unhealthy') {
        ErrorService.logError(`Health check failed for ${check.service}`, {
          component: 'ApplicationInitializer',
          metadata: {
            service: check.service,
            responseTime: check.responseTime,
            details: check.details,
          },
        });
      } else if (check.status === 'degraded') {
        ErrorService.logWarning(`Health check shows degraded performance for ${check.service}`, {
          component: 'ApplicationInitializer',
          metadata: {
            service: check.service,
            responseTime: check.responseTime,
            details: check.details,
          },
        });
      }
    }
  }

  /**
   * Get initialization status
   */
  static getInitializationStatus(): InitializationResult | null {
    return this.initializationResult;
  }

  /**
   * Force re-initialization (for testing or recovery)
   */
  static async reinitialize(): Promise<InitializationResult> {

    this.initialized = false;
    this.initializationResult = null;
    return this.initialize();
  }

  /**
   * Get application health summary
   */
  static async getHealthSummary(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: any;
    metrics: any;
    recommendations: string[];
  }> {
    if (!this.initialized) {
      await this.initialize();
    }

    const [monitoringReport, securityStats, databaseHealth] = await Promise.all([
      MonitoringService.generateMonitoringReport(),
      SecurityService.getSecurityStats(),
      DatabaseOptimizer.healthCheck(),
    ]);

    const recommendations: string[] = [];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Analyze health metrics
    if (monitoringReport.summary.errorRate > 5) {
      recommendations.push('High error rate detected - investigate failing endpoints');
      overallStatus = 'degraded';
    }

    if (monitoringReport.summary.averageResponseTime > 2000) {
      recommendations.push('High average response time - consider performance optimization');
      overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
    }

    if (securityStats.recentEvents.suspicious_login > 10) {
      recommendations.push('High number of suspicious login attempts - consider additional security measures');
      overallStatus = 'degraded';
    }

    if (databaseHealth.status === 'unhealthy') {
      recommendations.push('Database performance issues detected - review query optimization');
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      services: {
        monitoring: monitoringReport.summary,
        security: securityStats,
        database: databaseHealth,
      },
      metrics: {
        initializationStatus: this.initializationResult,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
      recommendations,
    };
  }

  /**
   * Graceful shutdown of all services
   */
  static async shutdown(): Promise<void> {

    
    try {
      // Clear caches
      await CacheService.clear();
      
      // Reset circuit breakers
      // ResilienceService.resetCircuitBreakers();
      
      // Clear monitoring data
      MonitoringService.resetMetrics();
      
      // Clear database metrics
      DatabaseOptimizer.clearMetrics();
      

      
      ErrorService.logInfo('Application services shutdown completed', {
        component: 'ApplicationInitializer',
      });
    } catch (error) {
      console.error('❌ Error during service shutdown:', error);
      ErrorService.logError('Error during service shutdown', {
        component: 'ApplicationInitializer',
        metadata: { error: (error as Error).message },
      });
    }
    
    this.initialized = false;
    this.initializationResult = null;
  }
}
