// src/lib/monitoring.ts - Application monitoring and health checks
export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: {
    database: { status: string; responseTime?: number };
    storage: { status: string; responseTime?: number };
    email: { status: string; responseTime?: number };
  };
  metrics: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    activeConnections: number;
  };
}

class MonitoringService {
  private static instance: MonitoringService;
  private startTime = Date.now();
  private metrics = {
    requests: 0,
    errors: 0,
    averageResponseTime: 0,
    activeConnections: 0
  };

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  // Health check endpoint
  async getHealthStatus(): Promise<HealthCheck> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    try {
      // Check database connectivity
      const dbStatus = await this.checkDatabase();
      
      // Check storage connectivity
      const storageStatus = await this.checkStorage();
      
      // Check email service
      const emailStatus = await this.checkEmail();

      const overallStatus = this.determineOverallStatus([
        dbStatus.status,
        storageStatus.status,
        emailStatus.status
      ]);

      return {
        status: overallStatus,
        timestamp,
        services: {
          database: dbStatus,
          storage: storageStatus,
          email: emailStatus
        },
        metrics: {
          uptime,
          memoryUsage: process.memoryUsage(),
          activeConnections: this.metrics.activeConnections
        }
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp,
        services: {
          database: { status: 'unknown' },
          storage: { status: 'unknown' },
          email: { status: 'unknown' }
        },
        metrics: {
          uptime,
          memoryUsage: process.memoryUsage(),
          activeConnections: this.metrics.activeConnections
        }
      };
    }
  }

  private async checkDatabase(): Promise<{ status: string; responseTime?: number }> {
    const start = Date.now();
    try {
      // Import Firebase Admin here to avoid circular dependencies
      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();
      
      // Simple read operation to test connectivity
      await db.collection('_health').doc('test').get();
      
      return {
        status: 'healthy',
        responseTime: Date.now() - start
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start
      };
    }
  }

  private async checkStorage(): Promise<{ status: string; responseTime?: number }> {
    const start = Date.now();
    try {
      // Check if storage bucket is accessible
      const { getStorage } = await import('firebase-admin/storage');
      const bucket = getStorage().bucket();
      
      // Test bucket access
      await bucket.getMetadata();
      
      return {
        status: 'healthy',
        responseTime: Date.now() - start
      };
    } catch (error) {
      console.error('Storage health check failed:', error);
      return {
        status: 'degraded', // Storage failure shouldn't bring down the whole system
        responseTime: Date.now() - start
      };
    }
  }

  private async checkEmail(): Promise<{ status: string; responseTime?: number }> {
    const start = Date.now();
    try {
      // Basic email service configuration check
      const hasEmailConfig = !!(
        process.env.EMAIL_HOST &&
        process.env.EMAIL_PORT &&
        process.env.EMAIL_USER &&
        process.env.EMAIL_PASS
      );

      if (!hasEmailConfig) {
        return {
          status: 'degraded',
          responseTime: Date.now() - start
        };
      }

      return {
        status: 'healthy',
        responseTime: Date.now() - start
      };
    } catch (error) {
      console.error('Email health check failed:', error);
      return {
        status: 'degraded',
        responseTime: Date.now() - start
      };
    }
  }

  private determineOverallStatus(serviceStatuses: string[]): 'healthy' | 'unhealthy' | 'degraded' {
    if (serviceStatuses.every(status => status === 'healthy')) {
      return 'healthy';
    }
    
    if (serviceStatuses.some(status => status === 'unhealthy')) {
      return 'unhealthy';
    }
    
    return 'degraded';
  }

  // Metrics tracking
  recordRequest(): void {
    this.metrics.requests++;
  }

  recordError(): void {
    this.metrics.errors++;
  }

  recordResponseTime(time: number): void {
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + time) / 2;
  }

  incrementConnections(): void {
    this.metrics.activeConnections++;
  }

  decrementConnections(): void {
    this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
  }

  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      errorRate: this.metrics.requests > 0 ? this.metrics.errors / this.metrics.requests : 0
    };
  }
}

export const monitoring = MonitoringService.getInstance();

// Performance monitoring middleware for API routes
export function withMonitoring() {
  return function monitoringMiddleware(req: Request): () => void {
    const start = Date.now();
    
    monitoring.recordRequest();
    monitoring.incrementConnections();
    
    // Return cleanup function to be called when request completes
    return function cleanup() {
      monitoring.recordResponseTime(Date.now() - start);
      monitoring.decrementConnections();
    };
  };
}

// Error tracking
export function trackError(error: Error, context?: Record<string, any>): void {
  monitoring.recordError();
  
  // In production, you would send this to your error tracking service
  console.error('Application Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    metrics: monitoring.getMetrics()
  });
}
