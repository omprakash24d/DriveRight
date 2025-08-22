
import { ErrorService } from "@/lib/error-service";
import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

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

export interface AuditLog {
    id: string;
    user: string; // For now, hardcoded. Later, could be admin email/UID.
    action: LogAction;
    target: string; // e.g., "Course: LMV Training" or "Student ID: xyz"
    timestamp: Timestamp;
}

const LOGS_COLLECTION = 'auditLogs';

/**
 * Adds a new log entry to the audit trail. This function is designed to fail silently
 * so that a logging error does not interrupt a primary user action.
 * @param action The type of action performed.
 * @param target A description of the entity that was acted upon.
 */
export async function addLog(action: LogAction, target: string) {
    try {
        const adminApp = getAdminApp();
        if (!adminApp) {
            ErrorService.logWarning(`Audit Log Skipped (Firebase Admin not init): ${action} - ${target}`, {
                component: 'auditLogService',
                action: 'addLog',
                metadata: { action, target }
            });
            return;
        }

        const db = getFirestore(adminApp);
        await db.collection(LOGS_COLLECTION).add({
            user: "Admin User", // Hardcoded for now. In a multi-admin system, this would be dynamic.
            action,
            target,
            timestamp: Timestamp.now(),
        });
    } catch (error) {
        ErrorService.logError(error as Error, {
            component: 'auditLogService',
            action: 'addLog',
            metadata: { action, target }
        });
        // This fails silently on purpose. Logging should not break core functionality.
    }
}

// Fetch all logs
export async function getLogs(): Promise<AuditLog[]> {
    try {
        const adminApp = getAdminApp();
        if (!adminApp) {
            ErrorService.logWarning("Firebase Admin not initialized, returning empty logs array", {
                component: 'auditLogService',
                action: 'getLogs'
            });
            return [];
        }
        
        const db = getFirestore(adminApp);
        const snapshot = await db.collection(LOGS_COLLECTION)
            .orderBy("timestamp", "desc")
            .get();

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...(doc.data() as Omit<AuditLog, 'id'>)
        }));
    } catch (error) {
        ErrorService.logError(error as Error, {
            component: 'auditLogService',
            action: 'getLogs'
        });
        // Return empty array instead of throwing to prevent server-side crashes
        return [];
    }
}
