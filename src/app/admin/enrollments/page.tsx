import { getEnrollmentsAdmin } from "@/lib/admin-server-functions";
import type { Enrollment } from "@/services/enrollmentsService";
import { AdminEnrollmentsView } from "./_components/AdminEnrollmentsView";

// This page is now a Server Component that fetches data securely on the server.
export default async function AdminEnrollmentsPage() {
  const enrollments: Enrollment[] = await getEnrollmentsAdmin();

  return <AdminEnrollmentsView initialEnrollments={enrollments} />;
}
