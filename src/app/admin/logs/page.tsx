
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { History, User } from "lucide-react";
import { generateAvatarColor } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { getLogs, type AuditLog, type LogAction } from "@/services/auditLogService";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const getActionVariant = (action: LogAction) => {
    if (action.includes('Delete') || action.includes('Decline')) {
        return 'destructive';
    }
    if (action.includes('Add') || action.includes('Generate') || action.includes('Approve')) {
        return 'default';
    }
    return 'secondary';
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchLogs() {
        setIsLoading(true);
        try {
            const fetchedLogs = await getLogs();
            setLogs(fetchedLogs);
        } catch (error) {
            console.error("Error fetching logs:", error);
            toast({
                variant: "destructive",
                title: "Failed to load logs",
                description: "Could not fetch audit log data from the database."
            });
        } finally {
            setIsLoading(false);
        }
    }
    fetchLogs();
  }, [toast]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <History className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Audit Logs</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Administrative Actions</CardTitle>
          <CardDescription>
            This log tracks important activities performed within the admin panel. Logs are immutable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Performed By</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-6 w-32" /></div></TableCell>
                        <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    </TableRow>
                ))
              ) : logs.length > 0 ? (
                logs.map((log) => (
                    <TableRow key={log.id}>
                    <TableCell className="flex items-center gap-4">
                        <Avatar>
                        <AvatarImage src={(log as any).userAvatar} alt={log.user} data-ai-hint="person portrait" />
                        <AvatarFallback style={{ backgroundColor: generateAvatarColor(log.user) }}>
                            <User className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                        </Avatar>
                        <span>{log.user}</span>
                    </TableCell>
                    <TableCell>
                        <Badge variant={getActionVariant(log.action)}>
                            {log.action}
                        </Badge>
                    </TableCell>
                    <TableCell>{log.target}</TableCell>
                    <TableCell>{format(log.timestamp.toDate(), "PPP p")}</TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">No audit logs found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
