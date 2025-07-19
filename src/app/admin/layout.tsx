"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { AdminHeader } from "@/components/AdminHeader";
import { Home, Users, FileText, Award, Route, Settings, LogOut, Car, History, CalendarDays, UserSquare, FileSearch, Star, Printer, ConciergeBell, FileCheck2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSiteSettings } from '@/services/settingsService';

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/admin/enrollments", label: "Enrollments", icon: FileText },
  { href: "/admin/ll-inquiries", label: "LL Inquiries", icon: FileSearch },
  { href: "/admin/license-inquiries", label: "DL Inquiries", icon: Printer },
  { href: "/admin/refresher-requests", label: "Refresher Requests", icon: Route },
  { href: "/admin/courses", label: "Courses", icon: Car },
  { href: "/admin/training-services", label: "Training Services", icon: ConciergeBell },
  { href: "/admin/online-services", label: "Online Services", icon: FileCheck2 },
  { href: "/admin/instructors", label: "Instructors", icon: UserSquare },
  { href: "/admin/testimonials", label: "Testimonials", icon: Star },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/results", label: "Test Results", icon: Award },
  { href: "/admin/certificates", label: "Certificates", icon: Award },
  { href: "/admin/logs", label: "Audit Logs", icon: History },
];

const settingsNav = [
    { href: "/admin/settings", label: "Settings", icon: Settings },
];

async function setSessionCookie(token: string) {
  await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: token }),
  });
}

async function clearSessionCookie() {
  await fetch('/api/auth/session', { method: 'DELETE' });
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [schoolName, setSchoolName] = useState("DriveRight");
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    const isPublicPage = useMemo(() => pathname === '/admin/login' || pathname === '/admin/forgot-password', [pathname]);

    useEffect(() => {
      let isMounted = true;
      let unsubscribe: (() => void) | undefined;

      const checkAuthAndPermissions = async () => {
        try {
          const settings = await getSiteSettings();
          if (isMounted) {
            setSchoolName(settings.schoolName);
            const adminEmails = settings.adminEmails;

            unsubscribe = onAuthStateChanged(auth, async (user) => {
              if (!isMounted) return;

              if (user) {
                if (user.email && adminEmails.includes(user.email)) {
                  setIsAuthenticated(true);
                  const token = await user.getIdToken();
                  await setSessionCookie(token);
                  if (isPublicPage) {
                    router.push('/admin');
                  }
                } else {
                  setIsAuthenticated(false);
                  await signOut(auth); 
                  if (!isPublicPage) {
                    toast({
                      variant: "destructive",
                      title: "Unauthorized Access",
                      description: "You are not authorized to access the admin panel.",
                    });
                    router.push('/admin/login');
                  }
                }
              } else {
                setIsAuthenticated(false);
                await clearSessionCookie();
                if (!isPublicPage) {
                  router.push('/admin/login');
                }
              }
              setIsChecking(false);
            });
          }
        } catch (error) {
          if (isMounted) {
            console.error("Failed to fetch site settings for auth check:", error);
            toast({
              variant: "destructive",
              title: "Configuration Error",
              description: "Could not verify admin permissions. Please check console.",
            });
            setIsChecking(false);
            if (!isPublicPage) {
              router.push('/admin/login');
            }
          }
        }
      };

      checkAuthAndPermissions();

      return () => {
        isMounted = false;
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }, [isPublicPage, router, toast]);

    const handleSignOut = async () => {
        await signOut(auth);
        await clearSessionCookie();
        router.push('/admin/login');
    };

    if (isChecking && !isPublicPage) {
        return (
           <div className="flex h-screen w-full items-center justify-center bg-background">
               <div className="flex flex-col items-center gap-4">
                   <Car className="h-12 w-12 animate-pulse text-primary" />
                   <p className="text-muted-foreground">Loading Admin Panel...</p>
               </div>
           </div>
       );
    }

    if (isPublicPage) {
        return <>{children}</>;
    }
    
    if (!isAuthenticated) {
        return null; 
    }

    return (
        <SidebarProvider>
            <Sidebar>
            <SidebarHeader>
              <div className="flex items-center gap-2 p-2">
                  <Car className="h-8 w-8 text-primary" />
                  <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">{schoolName}</span>
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
               <SidebarMenu>
                {settingsNav.map((item) => (
                     <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild tooltip={item.label}>
                        <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                        </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Logout" onClick={handleSignOut}>
                        <LogOut />
                        <span>Logout</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
               </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <AdminHeader onSignOut={handleSignOut} />
            <main className="p-6 md:p-8">{children}</main>
          </SidebarInset>
        </SidebarProvider>
    );
}
