
import { getLogs, type AuditLog } from "@/services/auditLogService";
import { AdminLogsView } from "./_components/AdminLogsView";

export default async function AdminLogsPage() {
    const logs: AuditLog[] = await getLogs();
    return <AdminLogsView initialLogs={logs} />;
}
