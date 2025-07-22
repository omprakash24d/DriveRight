// src/lib/error-tracking.ts - Advanced error tracking and reporting
import React from 'react';

interface ErrorContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'authentication' | 'enrollment' | 'payment' | 'file_upload' | 'database' | 'system';
}

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  metadata?: Record<string, any>;
}

class ErrorTracker {
  private static instance: ErrorTracker;
  private errorQueue: ErrorReport[] = [];
  private isProcessing = false;

  public static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  // Track application errors with context
  async trackError(
    error: Error | string, 
    context: Partial<ErrorContext> = {},
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const errorReport: ErrorReport = {
      id: crypto.randomUUID(),
      message: typeof error === 'string' ? error : error.message,
      stack: error instanceof Error ? error.stack : undefined,
      context: {
        userId: context.userId,
        sessionId: this.getSessionId(),
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : context.url,
        timestamp: new Date().toISOString(),
        severity: context.severity || 'medium',
        category: context.category || 'system'
      },
      metadata
    };

    // Add to queue for processing
    this.errorQueue.push(errorReport);
    
    // Process queue
    this.processErrorQueue();

    // Log locally for immediate visibility
    console.error('Error tracked:', {
      id: errorReport.id,
      message: errorReport.message,
      severity: errorReport.context.severity,
      category: errorReport.context.category
    });
  }

  // Process error queue and send to monitoring service
  private async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) return;
    
    this.isProcessing = true;
    const errorsToProcess = [...this.errorQueue];
    this.errorQueue = [];
    
    try {
      // Send to Firestore for persistence
      await this.saveErrorsToFirestore(errorsToProcess);

      // Send to external monitoring service (if configured)
      await this.sendToMonitoringService(errorsToProcess);

      // Send critical errors via email
      const criticalErrors = errorsToProcess.filter(e => e.context.severity === 'critical');
      if (criticalErrors.length > 0) {
        await this.sendCriticalErrorAlert(criticalErrors);
      }

    } catch (processingError) {
      console.error('Error processing queue:', processingError);
      // Re-queue errors if processing fails
      this.errorQueue.unshift(...errorsToProcess);
    } finally {
      this.isProcessing = false;
    }
  }

  private async saveErrorsToFirestore(errors: ErrorReport[]): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        // Server-side: use Firebase Admin
        const { getFirestore } = await import('firebase-admin/firestore');
        const db = getFirestore();
        
        const batch = db.batch();
        errors.forEach(error => {
          const errorRef = db.collection('error_logs').doc(error.id);
          batch.set(errorRef, error);
        });
        
        await batch.commit();
      } else {
        // Client-side: send to API endpoint
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ errors })
        });
      }
    } catch (error) {
      console.error('Failed to save errors to Firestore:', error);
    }
  }

  private async sendToMonitoringService(errors: ErrorReport[]): Promise<void> {
    // Integrate with Sentry, DataDog, or other monitoring service
    if (process.env.SENTRY_DSN) {
      try {
        // Dynamic import to avoid bundling if not needed
        const Sentry = await import('@sentry/nextjs').catch(() => null);
        if (Sentry) {
          errors.forEach(error => {
            Sentry.captureException(new Error(error.message), {
              tags: {
                category: error.context.category,
                severity: error.context.severity
              },
              extra: {
                context: error.context,
                metadata: error.metadata
              }
            });
          });
        }
      } catch (error) {
        console.error('Failed to send to Sentry:', error);
      }
    }
  }

  private async sendCriticalErrorAlert(errors: ErrorReport[]): Promise<void> {
    try {
      // Send email alert for critical errors
      await fetch('/api/alerts/critical-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors })
      });
    } catch (error) {
      console.error('Failed to send critical error alert:', error);
    }
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server-session';
    
    let sessionId = sessionStorage.getItem('app-session-id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('app-session-id', sessionId);
    }
    return sessionId;
  }

  // Get error statistics
  async getErrorStats(timeframe: '1h' | '24h' | '7d' = '24h'): Promise<any> {
    try {
      const response = await fetch(`/api/errors/stats?timeframe=${timeframe}`);
      return response.json();
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return null;
    }
  }
}

// Convenience functions
export const errorTracker = ErrorTracker.getInstance();

export const trackError = (
  error: Error | string,
  context?: Partial<ErrorContext>,
  metadata?: Record<string, any>
) => errorTracker.trackError(error, context, metadata);

// Error boundary helper for React components
export const withErrorTracking = (
  Component: React.ComponentType<any>,
  category: ErrorContext['category'] = 'system'
) => {
  return function WrappedComponent(props: any) {
    React.useEffect(() => {
      const handleError = (event: ErrorEvent) => {
        trackError(event.error, { 
          category, 
          severity: 'high',
          url: window.location.href 
        });
      };

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        trackError(event.reason, { 
          category, 
          severity: 'high',
          url: window.location.href 
        });
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }, []);

    return React.createElement(Component, props);
  };
};
