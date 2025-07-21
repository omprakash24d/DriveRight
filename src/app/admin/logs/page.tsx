
import { getLogs, type AuditLog } from "@/services/auditLogService";
import { AdminLogsView } from "./_components/AdminLogsView";
import type { Timestamp } from "firebase/firestore";

export default async function AdminLogsPage() {
    const logs: AuditLog[] = await getLogs();

    // Serialize Firestore Timestamps to ISO strings for client component props
    const serializableLogs = logs.map(log => ({
      ...log,
      timestamp: (log.timestamp as Timestamp).toDate().toISOString(),
    }));

    return <AdminLogsView initialLogs={serializableLogs} />;
}
