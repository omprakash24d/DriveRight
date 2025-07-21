import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart";
import {
  getEnrollmentsAdmin,
  getRefresherRequestsAdmin,
  getResultsAdmin,
  getStudentsAdmin,
} from "@/lib/admin-server-functions";
import { format, subMonths } from "date-fns";
import { ClipboardCheck, FileText, Hourglass, Users } from "lucide-react";
import { CoursePopularityChart } from "./_components/CoursePopularityChart";
import { EnrollmentChart } from "./_components/EnrollmentChart";
import { RecentActivityFeed } from "./_components/RecentActivityFeed";

const chartConfig: ChartConfig = {
  enrollments: {
    label: "Enrollments",
    color: "hsl(var(--primary))",
  },
};

// Helper function to fetch data and log errors without crashing
async function fetchDataSafe(fetcher: () => Promise<any[]>, name: string) {
  try {
    return await fetcher();
  } catch (error) {
    console.error(`Failed to fetch ${name} data on server:`, error);
    return []; // Return empty array on failure
  }
}

// This is now a Server Component, so we can fetch data directly and securely.
export default async function AdminDashboard() {
  const [studentsData, enrollmentsData, resultsData, refresherRequestsData] =
    await Promise.all([
      fetchDataSafe(getStudentsAdmin, "students"),
      fetchDataSafe(getEnrollmentsAdmin, "enrollments"),
      fetchDataSafe(getResultsAdmin, "results"),
      fetchDataSafe(getRefresherRequestsAdmin, "refresher requests"),
    ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Helper function to convert various date formats to Date
  const toDate = (timestamp: any) => {
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (timestamp && typeof timestamp.toDate === "function") {
      return timestamp.toDate();
    }
    if (timestamp && timestamp._seconds) {
      return new Date(timestamp._seconds * 1000);
    }
    return new Date(timestamp);
  };

  const newEnrollmentsCount = enrollmentsData.filter((e) => {
    try {
      const enrollmentDate = toDate(e.createdAt);
      return enrollmentDate > thirtyDaysAgo;
    } catch {
      return false;
    }
  }).length;
  const pendingEnrollmentsCount = enrollmentsData.filter(
    (e) => e.status === "Pending"
  ).length;
  const passedTestsCount = resultsData.filter(
    (r) => r.status === "Pass"
  ).length;
  const pendingRefresherRequests = refresherRequestsData.filter(
    (r) => r.status === "Pending"
  ).length;

  const stats = {
    totalStudents: studentsData.length,
    newEnrollmentsCount,
    passedTestsCount,
    pendingEnrollmentsCount,
    pendingRefresherRequests,
    totalPending: pendingEnrollmentsCount + pendingRefresherRequests,
  };

  // Process data for charts on the server
  const now = new Date();
  const monthlyCounts = new Map<string, number>();
  for (let i = 0; i < 6; i++) {
    const monthDate = subMonths(now, i);
    const monthKey = format(monthDate, "yyyy-MM");
    monthlyCounts.set(monthKey, 0);
  }
  enrollmentsData.forEach((e) => {
    try {
      const enrollmentDate =
        e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt);
      const monthKey = format(enrollmentDate, "yyyy-MM");
      if (monthlyCounts.has(monthKey)) {
        monthlyCounts.set(monthKey, monthlyCounts.get(monthKey)! + 1);
      }
    } catch (error) {
      console.warn("Invalid date in enrollment:", e.createdAt);
    }
  });
  const enrollmentChartData = Array.from(monthlyCounts.entries())
    .map(([key, count]) => ({
      month: format(new Date(key + "-02"), "MMMM"),
      enrollments: count,
    }))
    .reverse();

  const courseCounts = enrollmentsData.reduce(
    (acc: Record<string, number>, e) => {
      const courseName = e.vehicleType.toUpperCase();
      acc[courseName] = (acc[courseName] || 0) + 1;
      return acc;
    },
    {}
  );

  const coursePopularityData = Object.entries(courseCounts).map(
    ([name, value], index) => ({
      name,
      value,
      fill: `hsl(var(--chart-${index + 1}))`,
    })
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              All registered students
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              New Enrollments
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{stats.newEnrollmentsCount}
            </div>
            <p className="text-xs text-muted-foreground">in the last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed Tests</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passedTestsCount}</div>
            <p className="text-xs text-muted-foreground">Total tests passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Requests
            </CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPending}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingEnrollmentsCount} enrollments,{" "}
              {stats.pendingRefresherRequests} refreshers
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Enrollment Overview</CardTitle>
            <CardDescription>
              Monthly student enrollments for the last 6 months.
            </CardDescription>
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
            <CardDescription>
              Distribution of student enrollments across different courses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CoursePopularityChart data={coursePopularityData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
