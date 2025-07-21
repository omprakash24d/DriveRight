import { getLogs, type AuditLog } from "@/services/auditLogService";
import type { Timestamp } from "firebase/firestore";
import { AdminLogsView } from "./_components/AdminLogsView";

export default async function AdminLogsPage() {
  try {
    const logs: AuditLog[] = await getLogs();

    // Serialize Firestore Timestamps to ISO strings for client component props
    const serializableLogs = logs.map((log) => ({
      ...log,
      timestamp: (log.timestamp as Timestamp).toDate().toISOString(),
    }));

    return <AdminLogsView initialLogs={serializableLogs} />;
  } catch (error) {
    console.error("Failed to load audit logs:", error);

    // Return a fallback UI with empty logs
    return <AdminLogsView initialLogs={[]} />;
  }
}
