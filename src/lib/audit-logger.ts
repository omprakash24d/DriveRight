// src/lib/audit-logger.ts - Comprehensive audit logging system
import { getFirestore } from 'firebase-admin/firestore';

export interface AuditLog {
  id?: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ip: string;
  userAgent?: string;
  method: string;
  endpoint: string;
  statusCode?: number;
  duration?: number;
  sessionId?: string;
  correlationId?: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
}

export interface AuditContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ip: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
}

class AuditLogger {
  private db = getFirestore();

  async log(entry: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditEntry: AuditLog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        ...entry
      };

      // Store in Firestore with daily partitioning
      const date = new Date().toISOString().split('T')[0];
      const collectionName = `audit_logs_${date.replace(/-/g, '_')}`;
      
      await this.db.collection(collectionName).doc(auditEntry.id!).set(auditEntry);

      // Also store in main audit collection for easier querying
      await this.db.collection('audit_logs').doc(auditEntry.id!).set(auditEntry);

      // Check for sensitive actions that need immediate attention
      if (this.isSensitiveAction(entry.action)) {
        await this.handleSensitiveAction(auditEntry);
      }

    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw - audit logging shouldn't break the main flow
    }
  }

  // Authentication events
  async logLogin(context: AuditContext, success: boolean, details: any = {}): Promise<void> {
    await this.log({
      ...context,
      action: success ? 'user_login_success' : 'user_login_failure',
      resource: 'authentication',
      method: 'POST',
      endpoint: '/api/auth/login',
      details: {
        success,
        ...details
      }
    });
  }

  async logLogout(context: AuditContext): Promise<void> {
    await this.log({
      ...context,
      action: 'user_logout',
      resource: 'authentication',
      method: 'POST',
      endpoint: '/api/auth/logout',
      details: {}
    });
  }

  async logPasswordChange(context: AuditContext, forced: boolean = false): Promise<void> {
    await this.log({
      ...context,
      action: 'password_changed',
      resource: 'user_account',
      resourceId: context.userId,
      method: 'POST',
      endpoint: '/api/auth/change-password',
      details: { forced }
    });
  }

  // Data access events
  async logDataAccess(
    context: AuditContext,
    resource: string,
    resourceId: string,
    action: 'read' | 'create' | 'update' | 'delete',
    details: any = {}
  ): Promise<void> {
    await this.log({
      ...context,
      action: `data_${action}`,
      resource,
      resourceId,
      method: action === 'read' ? 'GET' : action === 'create' ? 'POST' : action === 'update' ? 'PUT' : 'DELETE',
      endpoint: `/api/${resource}/${resourceId}`,
      details
    });
  }

  // Administrative events
  async logAdminAction(
    context: AuditContext,
    action: string,
    resource: string,
    resourceId: string,
    changes?: { before?: any; after?: any },
    details: any = {}
  ): Promise<void> {
    await this.log({
      ...context,
      action: `admin_${action}`,
      resource,
      resourceId,
      method: 'POST',
      endpoint: `/admin/${resource}`,
      changes,
      details
    });
  }

  // System events
  async logSystemEvent(
    action: string,
    details: any = {},
    context?: Partial<AuditContext>
  ): Promise<void> {
    await this.log({
      userId: 'system',
      userEmail: 'system@www.drivingschoolarwal.in',
      userRole: 'system',
      ip: '127.0.0.1',
      ...context,
      action: `system_${action}`,
      resource: 'system',
      method: 'SYSTEM',
      endpoint: '/system',
      details
    });
  }

  // Security events
  async logSecurityEvent(
    context: AuditContext,
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any = {}
  ): Promise<void> {
    await this.log({
      ...context,
      action: `security_${event}`,
      resource: 'security',
      method: 'POST',
      endpoint: '/api/security',
      details: {
        severity,
        ...details
      }
    });
  }

  // File operations
  async logFileOperation(
    context: AuditContext,
    operation: 'upload' | 'download' | 'delete',
    filename: string,
    fileSize?: number,
    details: any = {}
  ): Promise<void> {
    await this.log({
      ...context,
      action: `file_${operation}`,
      resource: 'file',
      resourceId: filename,
      method: operation === 'upload' ? 'POST' : operation === 'download' ? 'GET' : 'DELETE',
      endpoint: '/api/files',
      details: {
        filename,
        fileSize,
        ...details
      }
    });
  }

  // Privacy and compliance events
  async logPrivacyEvent(
    context: AuditContext,
    event: 'data_export' | 'data_deletion' | 'data_rectification' | 'consent_given' | 'consent_withdrawn',
    details: any = {}
  ): Promise<void> {
    await this.log({
      ...context,
      action: `privacy_${event}`,
      resource: 'privacy',
      resourceId: context.userId,
      method: 'POST',
      endpoint: '/api/privacy',
      details
    });
  }

  // Query audit logs
  async queryLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    try {
      let query: any = this.db.collection('audit_logs');

      if (filters.userId) {
        query = query.where('userId', '==', filters.userId);
      }

      if (filters.action) {
        query = query.where('action', '==', filters.action);
      }

      if (filters.resource) {
        query = query.where('resource', '==', filters.resource);
      }

      if (filters.startDate) {
        query = query.where('timestamp', '>=', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.where('timestamp', '<=', filters.endDate.toISOString());
      }

      const snapshot = await query
        .orderBy('timestamp', 'desc')
        .limit(filters.limit || 100)
        .get();

      return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

    } catch (error) {
      console.error('Failed to query audit logs:', error);
      throw error;
    }
  }

  // Generate audit report
  async generateReport(
    startDate: Date,
    endDate: Date,
    filters?: {
      userId?: string;
      actions?: string[];
      resources?: string[];
    }
  ): Promise<{
    summary: any;
    logs: AuditLog[];
    analytics: any;
  }> {
    try {
      const logs = await this.queryLogs({
        ...filters,
        startDate,
        endDate,
        limit: 10000 // Large limit for reports
      });

      const summary = {
        totalEvents: logs.length,
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        uniqueUsers: new Set(logs.map(log => log.userId)).size,
        uniqueIPs: new Set(logs.map(log => log.ip)).size
      };

      const analytics = {
        topActions: this.getTopItems(logs, 'action'),
        topResources: this.getTopItems(logs, 'resource'),
        topUsers: this.getTopItems(logs, 'userId'),
        eventsByHour: this.groupByHour(logs),
        securityEvents: logs.filter(log => log.action.startsWith('security_')),
        adminEvents: logs.filter(log => log.action.startsWith('admin_')),
        failedLogins: logs.filter(log => log.action === 'user_login_failure')
      };

      return { summary, logs, analytics };

    } catch (error) {
      console.error('Failed to generate audit report:', error);
      throw error;
    }
  }

  // Private helper methods
  private isSensitiveAction(action: string): boolean {
    const sensitiveActions = [
      'admin_user_created',
      'admin_user_deleted',
      'admin_role_changed',
      'admin_permission_granted',
      'security_breach_detected',
      'privacy_data_export',
      'privacy_data_deletion',
      'system_backup_created',
      'system_config_changed'
    ];

    return sensitiveActions.some(sensitive => action.includes(sensitive));
  }

  private async handleSensitiveAction(entry: AuditLog): Promise<void> {
    try {
      console.warn('🔒 SENSITIVE ACTION LOGGED:', {
        action: entry.action,
        user: entry.userEmail,
        resource: entry.resource,
        timestamp: entry.timestamp
      });

      // Send to security monitoring
      await fetch('/api/security/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'sensitive_action_performed',
          severity: 'high',
          ip: entry.ip,
          timestamp: entry.timestamp,
          metadata: {
            action: entry.action,
            userId: entry.userId,
            resource: entry.resource,
            resourceId: entry.resourceId
          }
        })
      });

    } catch (error) {
      console.error('Failed to handle sensitive action:', error);
    }
  }

  private getTopItems(logs: AuditLog[], field: keyof AuditLog): any[] {
    const counts = logs.reduce((acc: any, log: any) => {
      const value = log[field];
      if (value) {
        acc[value] = (acc[value] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(counts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([item, count]) => ({ item, count }));
  }

  private groupByHour(logs: AuditLog[]): any[] {
    const hourCounts = logs.reduce((acc: any, log) => {
      const hour = new Date(log.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hourCounts[hour] || 0
    }));
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();

// Convenience functions
export const logUserAction = (
  context: AuditContext,
  action: string,
  resource: string,
  details: any = {}
) => auditLogger.log({
  ...context,
  action,
  resource,
  method: 'POST',
  endpoint: '/api/user-action',
  details
});

export const logAPICall = (
  context: AuditContext,
  method: string,
  endpoint: string,
  statusCode: number,
  duration: number,
  details: any = {}
) => auditLogger.log({
  ...context,
  action: 'api_call',
  resource: 'api',
  method,
  endpoint,
  statusCode,
  duration,
  details
});
