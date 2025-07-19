
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from "firebase/firestore";

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
  'Updated LL Inquiry' | 'Updated DL Inquiry' |
  // Settings
  'Updated Site Settings';

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
    if (!db.app) {
        console.warn(`Audit Log Skipped (Firebase not init): ${action} - ${target}`);
        return;
    }
    try {
        await addDoc(collection(db, LOGS_COLLECTION), {
            user: "Admin User", // Hardcoded for now. In a multi-admin system, this would be dynamic.
            action,
            target,
            timestamp: Timestamp.now(),
        });
    } catch (error) {
        console.error("Error adding audit log: ", error);
        // This fails silently on purpose. Logging should not break core functionality.
    }
}

// Fetch all logs
export async function getLogs(): Promise<AuditLog[]> {
    if (!db.app) return [];
    try {
        const logsCollection = collection(db, LOGS_COLLECTION);
        const q = query(logsCollection, orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<AuditLog, 'id'>)
        }));
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        throw new Error("Could not fetch audit logs.");
    }
}
