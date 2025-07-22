// src/app/api/audit/route.ts - Audit logs API
import { AuditLog, auditLogger } from '@/lib/audit-logger';
import { trackError } from '@/lib/error-tracking';
import { monitoring } from '@/lib/monitoring';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  monitoring.recordRequest();
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const format = searchParams.get('format') || 'json'; // json, csv, xlsx

    // Build filters
    const filters: any = { limit };
    
    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (resource) filters.resource = resource;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    // Query audit logs
    const logs = await auditLogger.queryLogs(filters);

    // Return different formats
    if (format === 'csv') {
      const csv = convertToCSV(logs);
      monitoring.recordResponseTime(Date.now() - startTime);
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    monitoring.recordResponseTime(Date.now() - startTime);
    
    return NextResponse.json({ 
      logs,
      metadata: {
        count: logs.length,
        filters,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    monitoring.recordError();
    trackError(error as Error, { 
      category: 'system', 
      severity: 'high',
      url: request.url 
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// Generate audit report
export async function POST(request: NextRequest) {
  try {
    const { 
      startDate, 
      endDate, 
      userId, 
      actions, 
      resources,
      format = 'json'
    } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required for reports' },
        { status: 400 }
      );
    }

    const filters: any = {};
    if (userId) filters.userId = userId;
    if (actions) filters.actions = actions;
    if (resources) filters.resources = resources;

    const report = await auditLogger.generateReport(
      new Date(startDate),
      new Date(endDate),
      filters
    );

    // Log the audit report generation
    await auditLogger.logSystemEvent('audit_report_generated', {
      startDate,
      endDate,
      filters,
      resultCount: report.logs.length
    });

    if (format === 'csv') {
      const csv = convertReportToCSV(report);
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit_report_${startDate}_${endDate}.csv"`
        }
      });
    }

    return NextResponse.json(report);

  } catch (error) {
    console.error('Failed to generate audit report:', error);
    return NextResponse.json(
      { error: 'Failed to generate audit report' },
      { status: 500 }
    );
  }
}

// Helper functions
function convertToCSV(logs: AuditLog[]): string {
  if (logs.length === 0) return 'No data available';

  const headers = [
    'Timestamp',
    'User ID',
    'User Email',
    'Action',
    'Resource',
    'Resource ID',
    'IP Address',
    'Method',
    'Endpoint',
    'Status Code',
    'Duration',
    'Details'
  ];

  const csvRows = [
    headers.join(','),
    ...logs.map(log => [
      log.timestamp,
      log.userId || '',
      log.userEmail || '',
      log.action,
      log.resource,
      log.resourceId || '',
      log.ip,
      log.method,
      log.endpoint,
      log.statusCode?.toString() || '',
      log.duration?.toString() || '',
      JSON.stringify(log.details).replace(/"/g, '""')
    ].map(field => `"${field}"`).join(','))
  ];

  return csvRows.join('\n');
}

function convertReportToCSV(report: any): string {
  const sections = [
    '=== AUDIT REPORT SUMMARY ===',
    `Total Events: ${report.summary.totalEvents}`,
    `Time Range: ${report.summary.timeRange.start} to ${report.summary.timeRange.end}`,
    `Unique Users: ${report.summary.uniqueUsers}`,
    `Unique IPs: ${report.summary.uniqueIPs}`,
    '',
    '=== TOP ACTIONS ===',
    ...report.analytics.topActions.map((item: any) => `${item.item}: ${item.count}`),
    '',
    '=== TOP RESOURCES ===',
    ...report.analytics.topResources.map((item: any) => `${item.item}: ${item.count}`),
    '',
    '=== SECURITY EVENTS ===',
    `Count: ${report.analytics.securityEvents.length}`,
    '',
    '=== FAILED LOGINS ===',
    `Count: ${report.analytics.failedLogins.length}`,
    '',
    '=== DETAILED LOGS ===',
    convertToCSV(report.logs)
  ];

  return sections.join('\n');
}
