/**
 * Database Optimization Service
 * Provides query optimization, connection pooling, and performance monitoring for Firestore
 */

import { CacheService } from './cache-service';
import { ErrorService } from './error-service';
import { MonitoringService } from './monitoring-service';

interface QueryMetrics {
  collection: string;
  operation: 'read' | 'write' | 'delete' | 'query';
  duration: number;
  documentCount?: number;
  queryType?: 'simple' | 'compound' | 'collection-group';
  indexUsed?: boolean;
  timestamp: number;
}

interface OptimizationRule {
  pattern: RegExp;
  suggestion: string;
  severity: 'info' | 'warning' | 'critical';
  autoFix?: (query: any) => any;
}

export class DatabaseOptimizer {
  private static queryMetrics: QueryMetrics[] = [];
  private static readonly MAX_METRICS = 1000;
  
  private static optimizationRules: OptimizationRule[] = [
    {
      pattern: /\.where\(.*\)\.where\(.*\)\.where\(/,
      suggestion: 'Consider creating a composite index for multiple where clauses',
      severity: 'warning',
    },
    {
      pattern: /\.orderBy\(.*\)\.where\(/,
      suggestion: 'Place where() clauses before orderBy() for better performance',
      severity: 'critical',
    },
    {
      pattern: /\.get\(\)\.then\(.*\.docs\.map\(/,
      suggestion: 'Consider using pagination with limit() for large result sets',
      severity: 'warning',
    },
  ];

  /**
   * Wrap Firestore operations with performance monitoring
   */
  static wrapFirestoreOperation<T>(
    operation: () => Promise<T>,
    metadata: {
      collection: string;
      operation: QueryMetrics['operation'];
      queryType?: QueryMetrics['queryType'];
    }
  ): Promise<T> {
    const startTime = Date.now();
    
    return operation()
      .then(result => {
        const duration = Date.now() - startTime;
        
        this.recordQueryMetrics({
          ...metadata,
          duration,
          timestamp: startTime,
          documentCount: this.extractDocumentCount(result),
        });
        
        return result;
      })
      .catch(error => {
        const duration = Date.now() - startTime;
        
        this.recordQueryMetrics({
          ...metadata,
          duration,
          timestamp: startTime,
        });
        
        ErrorService.logError(error, {
          component: 'DatabaseOptimizer',
          metadata: {
            collection: metadata.collection,
            operation: metadata.operation,
            duration,
          },
        });
        
        throw error;
      });
  }

  /**
   * Optimize Firestore query based on patterns
   */
  static optimizeQuery(queryBuilder: any, collection: string): any {
    // This would contain query optimization logic
    // For now, we'll track the query for analysis
    
    const queryString = queryBuilder.toString?.() || JSON.stringify(queryBuilder);
    
    // Check against optimization rules
    for (const rule of this.optimizationRules) {
      if (rule.pattern.test(queryString)) {
        ErrorService.logWarning(`Query optimization suggestion for ${collection}`, {
          component: 'DatabaseOptimizer',
          metadata: {
            collection,
            suggestion: rule.suggestion,
            severity: rule.severity,
            query: queryString.substring(0, 200), // First 200 chars
          },
        });
        
        // Apply auto-fix if available
        if (rule.autoFix) {
          try {
            return rule.autoFix(queryBuilder);
          } catch (fixError) {
            ErrorService.logWarning('Auto-fix failed for query optimization', {
              component: 'DatabaseOptimizer',
              metadata: {
                collection,
                error: (fixError as Error).message,
              },
            });
          }
        }
      }
    }
    
    return queryBuilder;
  }

  /**
   * Batch operations for better performance
   */
  static async batchOperations<T>(
    operations: Array<() => Promise<T>>,
    batchSize = 10,
    delayMs = 100
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(op => op())
      );
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          ErrorService.logError(`Batch operation ${i + index} failed`, {
            component: 'DatabaseOptimizer',
            metadata: {
              batchIndex: i + index,
              error: result.reason?.message || 'Unknown error',
            },
          });
        }
      });
      
      // Add delay between batches to avoid overwhelming the database
      if (i + batchSize < operations.length && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return results;
  }

  /**
   * Intelligent caching for Firestore queries
   */
  static async cachedQuery<T>(
    queryKey: string,
    queryFunction: () => Promise<T>,
    options: {
      ttl?: number;
      tags?: string[];
      invalidateOn?: string[]; // Events that should invalidate this cache
    } = {}
  ): Promise<T> {
    const cacheKey = `firestore:${queryKey}`;
    
    // Check cache first
    const cached = await CacheService.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    
    // Execute query with monitoring
    const startTime = Date.now();
    try {
      const result = await queryFunction();
      const duration = Date.now() - startTime;
      
      // Cache the result
      await CacheService.set(cacheKey, result, {
        ttl: options.ttl || 300, // 5 minutes default
        tags: ['firestore', ...(options.tags || [])],
      });
      
      // Track performance
      MonitoringService.trackRequest({
        method: 'DATABASE',
        path: queryKey,
        statusCode: 200,
        duration,
        timestamp: startTime,
        userAgent: 'DatabaseOptimizer',
        ip: 'internal',
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      MonitoringService.trackRequest({
        method: 'DATABASE',
        path: queryKey,
        statusCode: 500,
        duration,
        timestamp: startTime,
        userAgent: 'DatabaseOptimizer',
        ip: 'internal',
        error: (error as Error).message,
      });
      
      throw error;
    }
  }

  /**
   * Get query performance insights
   */
  static async getQueryInsights(): Promise<{
    slowQueries: QueryMetrics[];
    topCollections: Array<{ collection: string; queryCount: number; averageDuration: number }>;
    recommendations: string[];
  }> {
    const now = Date.now();
    const recentMetrics = this.queryMetrics.filter(m => 
      now - m.timestamp < 3600000 // Last hour
    );

    // Find slow queries (> 1 second)
    const slowQueries = recentMetrics
      .filter(m => m.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    // Analyze collection usage
    const collectionStats = recentMetrics.reduce((acc, m) => {
      if (!acc[m.collection]) {
        acc[m.collection] = { queryCount: 0, totalDuration: 0 };
      }
      acc[m.collection].queryCount++;
      acc[m.collection].totalDuration += m.duration;
      return acc;
    }, {} as Record<string, { queryCount: number; totalDuration: number }>);

    const topCollections = Object.entries(collectionStats)
      .map(([collection, stats]) => ({
        collection,
        queryCount: stats.queryCount,
        averageDuration: Math.round(stats.totalDuration / stats.queryCount),
      }))
      .sort((a, b) => b.queryCount - a.queryCount)
      .slice(0, 10);

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (slowQueries.length > 0) {
      recommendations.push('Consider adding indexes for slow queries');
    }
    
    const highVolumeCollections = topCollections.filter(c => c.queryCount > 100);
    if (highVolumeCollections.length > 0) {
      recommendations.push('Consider implementing caching for high-volume collections');
    }
    
    const averageDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    if (averageDuration > 500) {
      recommendations.push('Overall query performance could be improved with optimization');
    }

    return {
      slowQueries,
      topCollections,
      recommendations,
    };
  }

  /**
   * Generate database indexes configuration
   */
  static generateIndexConfig(): any {
    const collections = new Set(this.queryMetrics.map(m => m.collection));
    const indexes: any[] = [];

    // Analyze query patterns to suggest indexes
    collections.forEach(collection => {
      const collectionMetrics = this.queryMetrics.filter(m => m.collection === collection);
      
      // Find common query patterns
      const commonQueries = collectionMetrics
        .filter(m => m.operation === 'query')
        .reduce((acc, m) => {
          // This would analyze the actual query structure
          // For now, we'll generate basic indexes
          return acc;
        }, {} as Record<string, number>);

      // Generate basic indexes for each collection
      indexes.push({
        collectionGroup: collection,
        queryScope: 'COLLECTION',
        fields: [
          { fieldPath: 'createdAt', order: 'DESCENDING' },
          { fieldPath: 'status', order: 'ASCENDING' },
        ],
      });
    });

    return {
      indexes,
      fieldOverrides: [],
    };
  }

  /**
   * Database health check
   */
  static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: {
      averageQueryTime: number;
      slowQueryCount: number;
      totalQueries: number;
      errorRate: number;
    };
    issues: string[];
  }> {
    const recentMetrics = this.queryMetrics.filter(m => 
      Date.now() - m.timestamp < 3600000 // Last hour
    );

    if (recentMetrics.length === 0) {
      return {
        status: 'healthy',
        metrics: {
          averageQueryTime: 0,
          slowQueryCount: 0,
          totalQueries: 0,
          errorRate: 0,
        },
        issues: [],
      };
    }

    const averageQueryTime = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
    const slowQueryCount = recentMetrics.filter(m => m.duration > 1000).length;
    const totalQueries = recentMetrics.length;
    const errorRate = 0; // Would be calculated from actual error tracking

    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (averageQueryTime > 2000) {
      issues.push('High average query time detected');
      status = 'unhealthy';
    } else if (averageQueryTime > 1000) {
      issues.push('Elevated average query time');
      status = 'degraded';
    }

    if (slowQueryCount > totalQueries * 0.1) {
      issues.push('High percentage of slow queries');
      status = 'unhealthy';
    }

    return {
      status,
      metrics: {
        averageQueryTime: Math.round(averageQueryTime),
        slowQueryCount,
        totalQueries,
        errorRate,
      },
      issues,
    };
  }

  /**
   * Record query metrics
   */
  private static recordQueryMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.push(metrics);
    
    // Keep only recent metrics
    if (this.queryMetrics.length > this.MAX_METRICS) {
      this.queryMetrics = this.queryMetrics.slice(-this.MAX_METRICS);
    }

    // Log slow queries
    if (metrics.duration > 2000) {
      ErrorService.logWarning(`Slow database query detected: ${metrics.collection}`, {
        component: 'DatabaseOptimizer',
        metadata: {
          collection: metrics.collection,
          operation: metrics.operation,
          duration: metrics.duration,
          documentCount: metrics.documentCount,
        },
      });
    }
  }

  /**
   * Extract document count from query result
   */
  private static extractDocumentCount(result: any): number | undefined {
    if (result && typeof result === 'object') {
      if (result.docs && Array.isArray(result.docs)) {
        return result.docs.length;
      }
      if (result.size !== undefined) {
        return result.size;
      }
    }
    return undefined;
  }

  /**
   * Clear metrics (for testing/cleanup)
   */
  static clearMetrics(): void {
    this.queryMetrics = [];
  }

  /**
   * Get current metrics for analysis
   */
  static getMetrics(): QueryMetrics[] {
    return [...this.queryMetrics];
  }
}
