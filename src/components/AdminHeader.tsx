"use client";

import { useAuth } from "@/context/AuthContext";
import { isUserAdmin } from "@/lib/admin-utils";
import type { Notification } from "@/services/notificationsService";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Bell, Search, UserCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { SidebarTrigger } from "./ui/sidebar";
import { Skeleton } from "./ui/skeleton";

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

function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user } = useAuth(); // We just need to know if a user is logged in

  useEffect(() => {
    // Check if user is admin
    if (user) {
      const checkAdminStatus = async () => {
        try {
          const adminStatus = await isUserAdmin(user);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      };
      checkAdminStatus();
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

    async function fetchNotifications() {
      setIsLoading(true);
      try {
        // The session cookie is sent automatically by the browser,
        // and the middleware protects this route.
        const devToken = process.env.NEXT_PUBLIC_DEV_ADMIN_TOKEN;
        const headers: Record<string, string> = {};
        if (devToken && process.env.NODE_ENV === "development") {
          headers["x-dev-admin-token"] = devToken;
        }

        const response = await fetch("/api/admin/notifications", {
          credentials: "include",
          headers,
        });

        if (!response.ok) {
          if (response.status === 401) {
            // User is not authenticated or session expired, silently fail
            console.warn("Admin notifications require authentication");
            return;
          }
          throw new Error("Failed to fetch notifications");
        }

        const data: any[] = await response.json();

        // The timestamp will be an ISO string from the API, so we parse it back to a Date object.
        const fetchedNotifications = data.map((n) => ({
          ...n,
          timestamp: parseDate(n.timestamp),
        }));

        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNotifications();
  }, [user, isAdmin]);

  const pendingCount = useMemo(() => {
    return notifications.filter(
      (n) => n.title.includes("Pending") || n.title.includes("New")
    ).length;
  }, [notifications]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
          <span className="sr-only">View notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Recent Activity</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-2 space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} asChild>
              <Link
                href={notification.href}
                className="flex flex-col items-start w-full"
              >
                <p className="font-semibold">{notification.title}</p>
                <p className="text-xs text-muted-foreground w-full truncate">
                  {notification.description}
                </p>
                <p className="text-xs text-muted-foreground/80 mt-1">
                  {formatDistanceToNow(notification.timestamp, {
                    addSuffix: true,
                  })}
                </p>
              </Link>
            </DropdownMenuItem>
          ))
        ) : (
          <p className="p-4 text-sm text-muted-foreground text-center">
            No new notifications.
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminHeader({ onSignOut }: { onSignOut: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 w-full sm:w-auto"
            />
          </div>
        </form>
        <ThemeToggle />
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <UserCircle className="h-6 w-6" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
