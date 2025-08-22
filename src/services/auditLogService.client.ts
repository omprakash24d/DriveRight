/**
 * Client-safe audit log service wrapper
 * This file can be safely imported on both client and server
 * but only executes audit logging on the server side
 */

export type LogAction = 
  // Courses
  'Added Course' | 'Updated Course' | 'Deleted Course' |
  // Instructors
  'Added Instructor' | 'Updated Instructor' | 'Deleted Instructor' |
  // Students
  'Added Student' | 'Updated Student' | 'Deleted Student' |
  // Testimonials
  'Added Testimonial' | 'Updated Testimonial' | 'Deleted Testimonial' |
  // Results
  'Added Result' | 'Updated Result' | 'Deleted Result' |
  // Certificates
  'Generated Certificate' | 'Deleted Certificate' |
  // Enrollments
  'Updated Enrollment Status' |
  // Refresher Requests
  'Updated Refresher Request Status' | 'Deleted Refresher Request' |
  // LL Inquiries
  'Updated LL Inquiry' |
  // DL Inquiries
  'Updated DL Inquiry' |
  // Settings
  'Updated Site Settings' |
  // Training Services
  'Added Training Service' | 'Updated Training Service' | 'Deleted Training Service' |
  // Online Services
  'Added Online Service' | 'Updated Online Service' | 'Deleted Online Service' |
  // Service Bookings
  'service_booking_created' | 'service_booking_updated' | 'service_booking_cancelled' |
  // Transactions
  'transaction_recorded' | 'transaction_updated' | 'payment_completed' | 'payment_failed' |
  // Service Management
  'service_pricing_updated' | 'service_settings_updated';

/**
 * Client-safe audit logging function
 * Only performs logging when running on the server side
 * @param action The type of action performed
 * @param target A description of the entity that was acted upon
 */
export async function addLog(action: LogAction, target: string): Promise<void> {
  // Only run on server side
  if (typeof window !== 'undefined') {
    // Running on client side - do nothing
    return;
  }

  try {
    // Dynamic import to avoid bundling Firebase Admin SDK on client
    const { addLog: serverAddLog } = await import('./auditLogService.server');
    await serverAddLog(action, target);
  } catch (error) {
    // Fail silently on purpose - logging should not break core functionality
    console.warn('Audit logging failed:', error);
  }
}

/**
 * Client-safe function to get audit logs
 * Only works when running on the server side
 */
export async function getLogs() {
  // Only run on server side
  if (typeof window !== 'undefined') {
    // Running on client side - return empty array
    return [];
  }

  try {
    // Dynamic import to avoid bundling Firebase Admin SDK on client
    const { getLogs: serverGetLogs } = await import('./auditLogService.server');
    return await serverGetLogs();
  } catch (error) {
    console.warn('Getting audit logs failed:', error);
    return [];
  }
}

// Re-export types for compatibility
export interface AuditLog {
  id: string;
  user: string;
  action: LogAction;
  target: string;
  timestamp: any; // Firebase Timestamp
}
