/**
 * Enhanced System Monitoring API
 * Provides comprehensive health, performance, and security monitoring
 */

import { withEnhancedAPI } from '@/lib/api-handler';
import { CacheService } from '@/lib/cache-service';
import { DatabaseOptimizer } from '@/lib/database-optimizer';
import { MonitoringService } from '@/lib/monitoring-service';
import { SecurityService } from '@/lib/security-service';
import { ApplicationInitializer } from '@/services/application-initializer';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const monitoringQuerySchema = z.object({
  type: z.enum(['health', 'performance', 'security', 'database', 'summary']).optional(),
  period: z.enum(['1h', '24h', '7d', '30d']).optional().default('1h'),
  detailed: z.string().transform(val => val === 'true').optional(),
});

// GET - System monitoring data
export const GET = withEnhancedAPI(
  async (request: NextRequest, context?: any) => {
    const { query } = context;
    const { type = 'summary', period, detailed } = query;

    // Initialize services if not already done
    const initStatus = ApplicationInitializer.getInitializationStatus();
    if (!initStatus) {
      await ApplicationInitializer.initialize();
    }

    switch (type) {
      case 'health':
        return handleHealthCheck(detailed);
      
      case 'performance':
        return handlePerformanceMetrics(period, detailed);
      
      case 'security':
        return handleSecurityMetrics(period, detailed);
      
      case 'database':
        return handleDatabaseMetrics(detailed);
      
      case 'summary':
      default:
        return handleSummary();
    }
  },
  {
    requireAdmin: true,
    rateLimit: { maxRequests: 120, windowMs: 60000 },
    validation: {
      query: monitoringQuerySchema,
    },
    cache: {
      key: (req) => {
        const { searchParams } = new URL(req.url);
        return `monitoring_${searchParams.get('type') || 'summary'}_${searchParams.get('period') || '1h'}`;
      },
      ttl: 30, // 30 seconds cache for monitoring data
      tags: ['monitoring'],
    },
  }
);

async function handleHealthCheck(detailed: boolean) {
  const healthSummary = await ApplicationInitializer.getHealthSummary();
  const healthChecks = await MonitoringService.performHealthChecks();
  
  const response: any = {
    status: healthSummary.status,
    timestamp: Date.now(),
    uptime: process.uptime(),
    services: healthChecks.map(check => ({
      name: check.service,
      status: check.status,
      responseTime: check.responseTime,
      lastCheck: check.lastCheck,
      ...(detailed && { details: check.details }),
    })),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  };

  if (detailed) {
    const [cacheStats, databaseHealth] = await Promise.all([
      CacheService.getStats(),
      DatabaseOptimizer.healthCheck(),
    ]);

    response.cache = cacheStats;
    response.database = databaseHealth;
  }

  return NextResponse.json(response);
}

async function handlePerformanceMetrics(period: string, detailed: boolean) {
  const monitoringReport = await MonitoringService.generateMonitoringReport();
  const queryInsights = await DatabaseOptimizer.getQueryInsights();
  
  const response: any = {
    summary: monitoringReport.summary,
    period,
    timestamp: Date.now(),
    endpoints: {
      top: monitoringReport.summary.topEndpoints,
      ...(detailed && { performance: monitoringReport.performanceIssues }),
    },
    database: {
      slowQueries: queryInsights.slowQueries.slice(0, detailed ? 20 : 5),
      topCollections: queryInsights.topCollections.slice(0, detailed ? 20 : 10),
      recommendations: queryInsights.recommendations,
    },
  };

  if (detailed) {
    response.errors = monitoringReport.summary.recentErrors;
    response.healthChecks = monitoringReport.healthChecks;
  }

  return NextResponse.json(response);
}

async function handleSecurityMetrics(period: string, detailed: boolean) {
  const [securityStats, securityEvents] = await Promise.all([
    SecurityService.getSecurityStats(),
    SecurityService.getSecurityEvents(detailed ? 100 : 20),
  ]);

  const response: any = {
    stats: securityStats,
    period,
    timestamp: Date.now(),
    recentEvents: securityEvents.map(event => ({
      type: event.type,
      severity: event.severity,
      timestamp: event.timestamp,
      ip: event.ip,
      ...(detailed && { 
        details: event.details,
        userAgent: event.userAgent,
        userId: event.userId,
      }),
    })),
    threats: securityStats.topThreats,
  };

  if (detailed) {
    // Add configuration details for admins
    response.configuration = SecurityService.getConfig();
  }

  return NextResponse.json(response);
}

async function handleDatabaseMetrics(detailed: boolean) {
  const [healthCheck, queryInsights] = await Promise.all([
    DatabaseOptimizer.healthCheck(),
    DatabaseOptimizer.getQueryInsights(),
  ]);

  const response: any = {
    health: healthCheck,
    performance: {
      slowQueries: queryInsights.slowQueries.slice(0, detailed ? 50 : 10),
      topCollections: queryInsights.topCollections,
      recommendations: queryInsights.recommendations,
    },
    timestamp: Date.now(),
  };

  if (detailed) {
    const indexConfig = DatabaseOptimizer.generateIndexConfig();
    response.suggestedIndexes = indexConfig;
    response.metrics = DatabaseOptimizer.getMetrics().slice(-100); // Last 100 queries
  }

  return NextResponse.json(response);
}

async function handleSummary() {
  const [healthSummary, monitoringReport, securityStats] = await Promise.all([
    ApplicationInitializer.getHealthSummary(),
    MonitoringService.generateMonitoringReport(),
    SecurityService.getSecurityStats(),
  ]);

  const response = {
    status: healthSummary.status,
    timestamp: Date.now(),
    uptime: process.uptime(),
    summary: {
      requests: {
        total: monitoringReport.summary.totalRequests,
        errorRate: monitoringReport.summary.errorRate,
        averageResponseTime: monitoringReport.summary.averageResponseTime,
      },
      security: {
        blockedIPs: securityStats.blockedIPs,
        recentThreats: Object.keys(securityStats.recentEvents).length,
        topThreatIP: securityStats.topThreats[0]?.ip || 'none',
      },
      database: {
        status: healthSummary.services.database?.status || 'unknown',
        slowQueries: healthSummary.services.database?.metrics?.slowQueryCount || 0,
      },
      performance: {
        criticalIssues: monitoringReport.performanceIssues.filter(p => p.severity === 'critical').length,
        warnings: monitoringReport.performanceIssues.filter(p => p.severity === 'warning').length,
      },
    },
    recommendations: healthSummary.recommendations.slice(0, 5),
    initialization: ApplicationInitializer.getInitializationStatus(),
  };

  return NextResponse.json(response);
}

// POST - Administrative actions
export const POST = withEnhancedAPI(
  async (request: NextRequest, context?: any) => {
    const { body } = context;
    const { action, parameters = {} } = body;

    switch (action) {
      case 'clear_cache':
        await CacheService.clear();
        return NextResponse.json({ success: true, message: 'Cache cleared successfully' });

      case 'reset_metrics':
        MonitoringService.resetMetrics();
        DatabaseOptimizer.clearMetrics();
        return NextResponse.json({ success: true, message: 'Metrics reset successfully' });

      case 'unblock_ip':
        if (!parameters.ip) {
          throw new Error('Validation: IP address is required');
        }
        const unblocked = await SecurityService.unblockIP(parameters.ip);
        return NextResponse.json({
          success: unblocked,
          message: unblocked ? 'IP unblocked successfully' : 'IP was not blocked',
        });

      case 'reinitialize':
        const result = await ApplicationInitializer.reinitialize();
        return NextResponse.json({
          success: result.success,
          message: 'Services reinitialized',
          details: result,
        });

      case 'invalidate_cache_tag':
        if (!parameters.tag) {
          throw new Error('Validation: Cache tag is required');
        }
        await CacheService.invalidateByTag(parameters.tag);
        return NextResponse.json({
          success: true,
          message: `Cache tag '${parameters.tag}' invalidated successfully`,
        });

      default:
        throw new Error('Validation: Invalid action specified');
    }
  },
  {
    requireAdmin: true,
    rateLimit: { maxRequests: 20, windowMs: 60000 },
    validation: {
      body: z.object({
        action: z.enum(['clear_cache', 'reset_metrics', 'unblock_ip', 'reinitialize', 'invalidate_cache_tag']),
        parameters: z.record(z.any()).optional(),
      }),
    },
  }
);
