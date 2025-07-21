
import { getEnrollments } from "@/services/enrollmentsService";
import { AdminEnrollmentsView } from "./_components/AdminEnrollmentsView";
import type { Enrollment } from "@/services/enrollmentsService";

// This page is now a Server Component that fetches data securely on the server.
export default async function AdminEnrollmentsPage() {
    const enrollments: Enrollment[] = await getEnrollments();
    
    return <AdminEnrollmentsView initialEnrollments={enrollments} />;
}
