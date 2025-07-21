/**
 * Centralized error tracking and logging service
 * This service provides a unified interface for error handling across the application
 */

import * as Sentry from "@sentry/nextjs";

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
 * Enhanced error logging with Sentry integration
 */
export class ErrorService {
  /**
   * Log an error with context and send to Sentry
   */
  static logError(error: Error | string, context?: ErrorContext) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error:', errorMessage, context);
    }

    // Send to Sentry with context
    Sentry.withScope((scope) => {
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }
      
      if (context?.component) {
        scope.setTag('component', context.component);
      }
      
      if (context?.action) {
        scope.setTag('action', context.action);
      }
      
      if (context?.metadata) {
        scope.setContext('metadata', context.metadata);
      }
      
      scope.setLevel('error');
      Sentry.captureException(errorObj);
    });
  }

  /**
   * Log a warning with context
   */
  static logWarning(message: string, context?: ErrorContext) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Warning:', message, context);
    }

    Sentry.withScope((scope) => {
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }
      
      if (context?.component) {
        scope.setTag('component', context.component);
      }
      
      if (context?.action) {
        scope.setTag('action', context.action);
      }
      
      if (context?.metadata) {
        scope.setContext('metadata', context.metadata);
      }
      
      scope.setLevel('warning');
      Sentry.captureMessage(message, 'warning');
    });
  }

  /**
   * Log informational message
   */
  static logInfo(message: string, context?: ErrorContext) {
    if (process.env.NODE_ENV === 'development') {
      console.log('ℹ️ Info:', message, context);
    }

    Sentry.withScope((scope) => {
      if (context?.userId) {
        scope.setUser({ id: context.userId });
      }
      
      if (context?.component) {
        scope.setTag('component', context.component);
      }
      
      if (context?.metadata) {
        scope.setContext('metadata', context.metadata);
      }
      
      scope.setLevel('info');
      Sentry.captureMessage(message, 'info');
    });
  }

  /**
   * Track performance metrics
   */
  static trackPerformance(context: PerformanceContext) {
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance:', context);
    }

    Sentry.withScope((scope) => {
      scope.setTag('operation', context.operation);
      
      if (context.duration) {
        scope.setTag('duration', context.duration.toString());
      }
      
      if (context.metadata) {
        scope.setContext('performance', context.metadata);
      }
      
      scope.setLevel('info');
      Sentry.captureMessage(`Performance: ${context.operation}`, 'info');
    });
  }

  /**
   * Track user interactions for analytics
   */
  static trackUserAction(action: string, userId?: string, metadata?: Record<string, any>) {
    Sentry.withScope((scope) => {
      if (userId) {
        scope.setUser({ id: userId });
      }
      
      scope.setTag('user_action', action);
      
      if (metadata) {
        scope.setContext('user_action_metadata', metadata);
      }
      
      scope.setLevel('info');
      Sentry.captureMessage(`User Action: ${action}`, 'info');
    });
  }

  /**
   * Set user context for subsequent error reports
   */
  static setUserContext(userId: string, email?: string, role?: string) {
    Sentry.setUser({
      id: userId,
      email,
      ...(role && { role }),
    });
  }

  /**
   * Clear user context (e.g., on logout)
   */
  static clearUserContext() {
    Sentry.setUser(null);
  }

  /**
   * Add breadcrumb for debugging
   */
  static addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  }
}
