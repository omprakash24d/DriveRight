
"use client";

import { useEffect, useState } from "react";
import { type Notification } from "@/services/notificationsService";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Route, Award, UserPlus, CheckCircle, Hourglass } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/context/AuthContext";

const iconMap: Record<string, React.ElementType> = {
    'Enrollment': FileText,
    'Refresher': Route,
    'Result': Award,
    'Student': UserPlus
};
const statusIconMap: Record<string, React.ElementType> = {
    'Approved': CheckCircle,
    'Pending': Hourglass,
    'New': Hourglass,
    'Pass': CheckCircle,
};
const statusColorMap: Record<string, string> = {
    'Approved': 'text-green-500',
    'Pending': 'text-amber-500',
    'New': 'text-amber-500',
    'Pass': 'text-green-500',
    'Fail': 'text-destructive',
};

export function RecentActivityFeed() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        // Don't fetch if the user isn't loaded yet
        if (!user) return;

        async function fetchData() {
            setIsLoading(true);
            try {
                // This function is now fetched from the client, but hits a secure API route
                // The session cookie is automatically sent by the browser.
                const response = await fetch('/api/admin/notifications');
                if (!response.ok) {
                    throw new Error('Failed to fetch notifications');
                }
                const data: any[] = await response.json();
                const processedNotifications = data.map(n => ({
                    ...n,
                    timestamp: new Date(n.timestamp) // Convert ISO string back to Date
                }));
                setNotifications(processedNotifications);
            } catch (error) {
                console.error("Failed to load activity feed", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [user]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
            </div>
        );
    }
    
    if (notifications.length === 0) {
        return <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
    }

    return (
        <div className="space-y-4">
            {notifications.map(item => {
                const [type, status] = item.title.split(': ');
                const Icon = iconMap[type] || Award;
                const StatusIcon = statusIconMap[status] || Award;
                const statusColor = statusColorMap[status] || 'text-muted-foreground';

                return (
                    <Link href={item.href} key={item.id} className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="bg-secondary p-3 rounded-full">
                            <Icon className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">{item.description}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <StatusIcon className={`h-3 w-3 ${statusColor}`} />
                                <span>{status}</span>
                                <span className="mx-1">&middot;</span>
                                <span>{formatDistanceToNow(item.timestamp, { addSuffix: true })}</span>
                            </div>
                        </div>
                    </Link>
                )
            })}
        </div>
    );
}
