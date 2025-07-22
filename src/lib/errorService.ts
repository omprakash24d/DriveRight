import * as Sentry from '@sentry/nextjs';

export class ErrorService {
  static logError(message: string, error?: Error | unknown, context?: Record<string, any>) {
    // Always log to console for development visibility
    console.error(message, error);
    
    // Send to Sentry if available and not in development (to avoid noise)
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === 'production') {
      Sentry.withScope((scope) => {
        if (context) {
          scope.setContext('errorContext', context);
        }
        if (error instanceof Error) {
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage(message, 'error');
        }
      });
    }
  }

  static logWarning(message: string, context?: Record<string, any>) {
    console.warn(message);
    
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === 'production') {
      Sentry.withScope((scope) => {
        if (context) {
          scope.setContext('warningContext', context);
        }
        Sentry.captureMessage(message, 'warning');
      });
    }
  }

  static logInfo(message: string, context?: Record<string, any>) {
    console.log(message);
    
    // Only send important info messages to Sentry in production
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && 
        process.env.NODE_ENV === 'production' && 
        context?.important === true) {
      Sentry.withScope((scope) => {
        if (context) {
          scope.setContext('infoContext', context);
        }
        Sentry.captureMessage(message, 'info');
      });
    }
  }

  static setUserContext(userId: string, email?: string, role?: string) {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.setUser({
        id: userId,
        email: email,
        role: role,
      });
    }
  }

  static trackPerformance(name: string, data?: Record<string, any>) {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === 'production') {
      Sentry.addBreadcrumb({
        message: name,
        category: 'performance',
        data: data,
        level: 'info',
      });
    }
  }
}
