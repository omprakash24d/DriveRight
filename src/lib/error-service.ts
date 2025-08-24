/**
 * Centralized error tracking and logging service
 * This service provides a unified interface for error handling across the application
 */

export interface ErrorContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceContext {
  operation: string;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Enhanced error logging service with fallback console logging
 */
export class ErrorService {
  /**
   * Log an error with context
   */
  static logError(error: Error | string, context?: ErrorContext) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    // Always log to console for development and fallback
    console.error('🚨 Error:', errorMessage, {
      error: errorObj,
      context,
      timestamp: new Date().toISOString(),
    });

    // Production error tracking service integration
    // This could be Sentry, LogRocket, or custom analytics
  }

  /**
   * Log a warning with context
   */
  static logWarning(message: string, context?: ErrorContext) {
    console.warn('⚠️ Warning:', message, {
      context,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Log informational message (reduced verbosity for development)
   */
  static logInfo(message: string, context?: ErrorContext) {
    // Only log info messages for important events or errors
    const isImportant = message.includes('error') || message.includes('failed') || 
                       message.includes('unauthorized') || message.includes('suspicious') ||
                       message.includes('rate_limit') || message.includes('admin');
    
    if (process.env.NODE_ENV === 'development' && isImportant) {
      console.info('ℹ️ Info:', message, {
        context,
        timestamp: new Date().toISOString(),
      });
    }
    
    // In production, you might want to send to external logging service
    // but avoid console spam
  }

  /**
   * Track performance metrics
   */
  static trackPerformance(context: PerformanceContext) {
    console.info('📊 Performance:', {
      operation: context.operation,
      duration: context.duration,
      metadata: context.metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track user interactions for analytics
   */
  static trackUserAction(action: string, userId?: string, metadata?: Record<string, any>) {
    console.info('👤 User Action:', {
      action,
      userId,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Set user context for subsequent error reports
   */
  static setUserContext(userId: string, email?: string, role?: string) {
    console.info('👤 User Context Set:', {
      userId,
      email,
      role,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Clear user context (e.g., on logout)
   */
  static clearUserContext() {
    console.info('👤 User Context Cleared:', {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Add breadcrumb for debugging
   */
  static addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    console.debug('🍞 Breadcrumb:', {
      message,
      category,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}
