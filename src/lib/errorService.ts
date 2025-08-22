export class ErrorService {
  static logError(message: string, error?: Error | unknown, context?: Record<string, any>) {
    // Always log to console with rich formatting
    console.error('🚨 Error:', {
      message,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  static logWarning(message: string, context?: Record<string, any>) {
    console.warn('⚠️ Warning:', {
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  static logInfo(message: string, context?: Record<string, any>) {
    console.info('ℹ️ Info:', {
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  static setUserContext(userId: string, email?: string, role?: string) {
    console.info('👤 User Context Set:', {
      userId,
      email,
      role,
      timestamp: new Date().toISOString(),
    });
  }

  static trackPerformance(name: string, data?: Record<string, any>) {
    console.info('📊 Performance:', {
      operation: name,
      data,
      timestamp: new Date().toISOString(),
    });
  }
}
