"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { isUserAdmin } from "@/lib/admin-utils";
import { type Notification } from "@/services/notificationsService";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  Award,
  CheckCircle,
  FileText,
  Hourglass,
  Route,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Helper function to safely parse dates from various formats
const parseDate = (date: any): Date => {
  try {
    // Handle Firestore Timestamp format
    if (date && typeof date === "object" && "seconds" in date) {
      return new Date(date.seconds * 1000);
    }
    // Handle Date objects
    if (date instanceof Date) {
      return date;
    }
    // Handle ISO strings
    if (typeof date === "string") {
      return parseISO(date);
    }
    // Handle timestamp numbers
    if (typeof date === "number") {
      return new Date(date);
    }
    // Fallback to current date
    return new Date();
  } catch (error) {
    console.warn("Invalid date format:", date);
    return new Date(); // Return current date as fallback
  }
};

const iconMap: Record<string, React.ElementType> = {
  Enrollment: FileText,
  Refresher: Route,
  Result: Award,
  Student: UserPlus,
  "DL Request": FileText,
  "LL Inquiry": FileText,
};
const statusIconMap: Record<string, React.ElementType> = {
  Approved: CheckCircle,
  Pending: Hourglass,
  New: Hourglass,
  Pass: CheckCircle,
  Processed: CheckCircle,
};
const statusColorMap: Record<string, string> = {
  Approved: "text-green-500",
  Pending: "text-amber-500",
  New: "text-amber-500",
  Pass: "text-green-500",
  Fail: "text-destructive",
  Processed: "text-green-500",
  Declined: "text-destructive",
  "Not Found": "text-destructive",
};

export function RecentActivityFeed() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if user is admin
    if (user) {
      isUserAdmin(user).then(setIsAdmin);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    // Don't fetch if the user isn't loaded yet or is not an admin
    if (!user || !isAdmin) {
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      try {
        // This function is now fetched from the client, but hits a secure API route
        // The session cookie is automatically sent by the browser.
        const response = await fetch("/api/admin/notifications");
        if (!response.ok) {
          if (response.status === 401) {
            // User is not authenticated or session expired, silently fail
            console.warn("Admin notifications require authentication");
            return;
          }
          throw new Error("Failed to fetch notifications");
        }
        const data: any[] = await response.json();
        const processedNotifications = data.map((n) => ({
          ...n,
          timestamp: parseDate(n.timestamp), // Convert ISO string from API back to Date
        }));
        setNotifications(processedNotifications);
      } catch (error) {
        console.error("Failed to load activity feed", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [user, isAdmin]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Admin access required.
      </p>
    );
  }

  if (notifications.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No recent activity.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((item) => {
        const [type, status] = item.title.split(": ");
        const Icon = iconMap[type] || Award;
        const StatusIcon = statusIconMap[status] || Award;
        const statusColor = statusColorMap[status] || "text-muted-foreground";

        return (
          <Link
            href={item.href}
            key={item.id}
            className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="bg-secondary p-3 rounded-full">
              <Icon className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{item.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <StatusIcon className={`h-3 w-3 ${statusColor}`} />
                <span>{status}</span>
                <span className="mx-1">&middot;</span>
                <span>
                  {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
