
"use client";

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
import type { AuditLog, LogAction } from "@/services/auditLogService";
import { format, parseISO, isValid } from "date-fns";

const getActionVariant = (action: LogAction) => {
    if (action.includes('Delete') || action.includes('Decline')) {
        return 'destructive';
    }
    if (action.includes('Add') || action.includes('Generate') || action.includes('Approve')) {
        return 'default';
    }
    return 'secondary';
}

interface AdminLogsViewProps {
    initialLogs: any[]; // Use any to accommodate serialized date
}

export function AdminLogsView({ initialLogs }: AdminLogsViewProps) {
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
              {initialLogs.length > 0 ? (
                initialLogs.map((log) => {
                  const logDate = parseISO(log.timestamp);
                  return (
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
                      <TableCell>{isValid(logDate) ? format(logDate, "PPP p") : "Invalid Date"}</TableCell>
                    </TableRow>
                  )
                })
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
