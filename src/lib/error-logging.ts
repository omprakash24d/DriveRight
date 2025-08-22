// src/lib/error-logging.ts - Centralized error logging
import { ErrorService } from './error-service';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 
  | 'authentication' 
  | 'payment' 
  | 'database' 
  | 'network' 
  | 'validation' 
  | 'ui' 
  | 'performance'
  | 'security'
  | 'system';

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

export interface LoggedError {
  id: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  timestamp: Date;
  resolved?: boolean;
  tags?: string[];
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private errors: Map<string, LoggedError> = new Map();

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  // Log an error with full context
  log(
    error: Error | string,
    severity: ErrorSeverity,
    category: ErrorCategory,
    context: ErrorContext = {},
    tags: string[] = []
  ): string {
    const errorId = this.generateErrorId();
    const message = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;

    const loggedError: LoggedError = {
      id: errorId,
      message,
      stack,
      severity,
      category,
      context: {
        ...context,
        url: typeof window !== 'undefined' ? window.location.href : context.url,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : context.userAgent,
        metadata: {
          ...context.metadata,
          timestamp: new Date().toISOString(),
        }
      },
      timestamp: new Date(),
      tags,
    };

    // Store error locally
    this.errors.set(errorId, loggedError);

    // Send to external error tracking service
    this.sendToErrorService(loggedError);

    // Console logging based on severity
    this.consoleLog(loggedError);

    // Handle critical errors immediately
    if (severity === 'critical') {
      this.handleCriticalError(loggedError);
    }

    return errorId;
  }

  // Specialized logging methods
  logPaymentError(error: Error | string, context: ErrorContext = {}): string {
    return this.log(error, 'high', 'payment', {
      ...context,
      component: context.component || 'payment-system',
    }, ['payment', 'transaction']);
  }

  logAuthError(error: Error | string, context: ErrorContext = {}): string {
    return this.log(error, 'medium', 'authentication', {
      ...context,
      component: context.component || 'auth-system',
    }, ['auth', 'security']);
  }

  logUIError(error: Error | string, context: ErrorContext = {}): string {
    return this.log(error, 'low', 'ui', {
      ...context,
      component: context.component || 'ui-component',
    }, ['ui', 'frontend']);
  }

  logDatabaseError(error: Error | string, context: ErrorContext = {}): string {
    return this.log(error, 'high', 'database', {
      ...context,
      component: context.component || 'database',
    }, ['database', 'backend']);
  }

  logSecurityError(error: Error | string, context: ErrorContext = {}): string {
    return this.log(error, 'critical', 'security', {
      ...context,
      component: context.component || 'security-system',
    }, ['security', 'threat']);
  }

  // Get errors by criteria
  getErrors(criteria: {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    component?: string;
    resolved?: boolean;
    limit?: number;
  } = {}): LoggedError[] {
    let errors = Array.from(this.errors.values());

    if (criteria.severity) {
      errors = errors.filter(e => e.severity === criteria.severity);
    }

    if (criteria.category) {
      errors = errors.filter(e => e.category === criteria.category);
    }

    if (criteria.component) {
      errors = errors.filter(e => e.context.component === criteria.component);
    }

    if (criteria.resolved !== undefined) {
      errors = errors.filter(e => e.resolved === criteria.resolved);
    }

    // Sort by timestamp (newest first)
    errors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (criteria.limit) {
      errors = errors.slice(0, criteria.limit);
    }

    return errors;
  }

  // Mark error as resolved
  resolveError(errorId: string): boolean {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }

  // Get error statistics
  getStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    resolved: number;
    unresolved: number;
  } {
    const errors = Array.from(this.errors.values());
    
    const bySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    const byCategory = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    return {
      total: errors.length,
      bySeverity,
      byCategory,
      resolved: errors.filter(e => e.resolved).length,
      unresolved: errors.filter(e => !e.resolved).length,
    };
  }

  // Private methods
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendToErrorService(error: LoggedError): void {
    try {
      // Send to Sentry/external service
      ErrorService.logError(error.message, {
        component: error.context.component,
        action: error.context.action,
        metadata: {
          errorId: error.id,
          category: error.category,
          severity: error.severity,
          tags: error.tags,
          ...error.context.metadata,
        }
      });
    } catch (err) {
      console.error('Failed to send error to external service:', err);
    }
  }

  private consoleLog(error: LoggedError): void {
    const prefix = `[${error.severity.toUpperCase()}] ${error.category}`;
    const message = `${prefix}: ${error.message}`;
    
    switch (error.severity) {
      case 'critical':
        console.error('🚨', message, error);
        break;
      case 'high':
        console.error('❌', message, error);
        break;
      case 'medium':
        console.warn('⚠️', message, error);
        break;
      case 'low':
        if (process.env.NODE_ENV === 'development') {
          console.info('ℹ️', message, error);
        }
        break;
    }
  }

  private handleCriticalError(error: LoggedError): void {
    // Send immediate notifications for critical errors
    if (typeof window !== 'undefined') {
      // Trigger critical error event for monitoring
      window.dispatchEvent(new CustomEvent('critical-error', {
        detail: error
      }));
    }

    // In production, you might want to:
    // - Send immediate email/SMS alerts
    // - Create support tickets
    // - Trigger backup systems
    console.error('CRITICAL ERROR DETECTED:', error);
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Convenience functions
export const logError = (
  error: Error | string,
  severity: ErrorSeverity = 'medium',
  category: ErrorCategory = 'system',
  context: ErrorContext = {}
) => errorLogger.log(error, severity, category, context);

export const logPaymentError = (error: Error | string, context: ErrorContext = {}) =>
  errorLogger.logPaymentError(error, context);

export const logAuthError = (error: Error | string, context: ErrorContext = {}) =>
  errorLogger.logAuthError(error, context);

export const logUIError = (error: Error | string, context: ErrorContext = {}) =>
  errorLogger.logUIError(error, context);

export const logDatabaseError = (error: Error | string, context: ErrorContext = {}) =>
  errorLogger.logDatabaseError(error, context);

export const logSecurityError = (error: Error | string, context: ErrorContext = {}) =>
  errorLogger.logSecurityError(error, context);

// Global error handlers
if (typeof window !== 'undefined') {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    errorLogger.log(
      event.error || event.message,
      'high',
      'system',
      {
        url: window.location.href,
        component: 'global-error-handler',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      },
      ['unhandled', 'global']
    );
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorLogger.log(
      event.reason?.message || event.reason || 'Unhandled promise rejection',
      'high',
      'system',
      {
        url: window.location.href,
        component: 'promise-rejection-handler',
        metadata: {
          reason: event.reason,
        }
      },
      ['unhandled', 'promise', 'global']
    );
  });
}
