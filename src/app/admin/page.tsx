
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, FileText, ClipboardCheck, Hourglass } from "lucide-react";
import { getStudents } from "@/services/studentsService";
import { getEnrollments, type Enrollment } from "@/services/enrollmentsService";
import { getResults } from "@/services/resultsService";
import { getRefresherRequests } from "@/services/refresherRequestsService";
import { EnrollmentChart } from "./_components/EnrollmentChart";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format, subMonths } from 'date-fns';
import { CoursePopularityChart } from "./_components/CoursePopularityChart";
import { RecentActivityFeed } from "./_components/RecentActivityFeed";
import { useAuth } from "@/context/AuthContext";

const chartConfig = {
  enrollments: {
    label: "Enrollments",
    color: "hsl(var(--primary))",
  },
};

interface DashboardStats {
  totalStudents: number;
  newEnrollmentsCount: number;
  passedTestsCount: number;
  totalPending: number;
  pendingEnrollmentsCount: number;
  pendingRefresherRequests: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [enrollmentChartData, setEnrollmentChartData] = useState<any[]>([]);
  const [coursePopularityData, setCoursePopularityData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  useEffect(() => {
    // Wait for auth to be ready and user object to be available before fetching data
    if (isAuthLoading || !user) {
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      try {
        const [studentsData, enrollmentsData, resultsData, refresherRequestsData] = await Promise.all([
          getStudents(),
          getEnrollments(),
          getResults(),
          getRefresherRequests(),
        ]);
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const newEnrollmentsCount = enrollmentsData.filter(e => e.createdAt.toDate() > thirtyDaysAgo).length;
        const pendingEnrollmentsCount = enrollmentsData.filter(e => e.status === 'Pending').length;
        const passedTestsCount = resultsData.filter(r => r.status === 'Pass').length;
        const pendingRefresherRequests = refresherRequestsData.filter(r => r.status === 'Pending').length;
        
        setStats({
          totalStudents: studentsData.length,
          newEnrollmentsCount,
          passedTestsCount,
          pendingEnrollmentsCount,
          pendingRefresherRequests,
          totalPending: pendingEnrollmentsCount + pendingRefresherRequests,
        });
        
        // --- Process data for charts ---
        // Enrollment Line Chart
        const now = new Date();
        const monthlyCounts = new Map<string, number>();
        for (let i = 0; i < 6; i++) {
            const monthDate = subMonths(now, i);
            const monthKey = format(monthDate, 'yyyy-MM');
            monthlyCounts.set(monthKey, 0);
        }
        enrollmentsData.forEach(e => {
            const monthKey = format(e.createdAt.toDate(), 'yyyy-MM');
            if (monthlyCounts.has(monthKey)) {
                monthlyCounts.set(monthKey, monthlyCounts.get(monthKey)! + 1);
            }
        });
        const dynamicChartData = Array.from(monthlyCounts.entries())
            .map(([key, count]) => ({
                month: format(new Date(key + '-02'), 'MMMM'),
                enrollments: count
            }))
            .reverse();
        setEnrollmentChartData(dynamicChartData);

        // Course Popularity Pie Chart
        const courseCounts = enrollmentsData.reduce((acc, e) => {
            const courseName = e.vehicleType.toUpperCase();
            acc[courseName] = (acc[courseName] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const popularityData = Object.entries(courseCounts).map(([name, value], index) => ({
          name,
          value,
          fill: `hsl(var(--chart-${index + 1}))`
        }));
        setCoursePopularityData(popularityData);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch dashboard data. Please check your permissions and try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [isAuthLoading, user, toast]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats?.totalStudents}</div>}
            <p className="text-xs text-muted-foreground">All registered students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Enrollments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">+{stats?.newEnrollmentsCount}</div>}
            <p className="text-xs text-muted-foreground">in the last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed Tests</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats?.passedTestsCount}</div>}
            <p className="text-xs text-muted-foreground">Total tests passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-1/4" /> : <div className="text-2xl font-bold">{stats?.totalPending}</div>}
            <p className="text-xs text-muted-foreground">{stats?.pendingEnrollmentsCount} enrollments, {stats?.pendingRefresherRequests} refreshers</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Enrollment Overview</CardTitle>
            <CardDescription>Monthly student enrollments for the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent>
            <EnrollmentChart data={enrollmentChartData} config={chartConfig} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest enrollments and requests.</CardDescription>
            </CardHeader>
            <CardContent>
                <RecentActivityFeed />
            </CardContent>
        </Card>
      </div>
       <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Course Popularity</CardTitle>
            <CardDescription>Distribution of student enrollments across different courses.</CardDescription>
          </CardHeader>
          <CardContent>
            <CoursePopularityChart data={coursePopularityData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
