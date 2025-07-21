
import { getCourses } from "@/services/coursesService";
import { AdminCoursesView } from "./_components/AdminCoursesView";
import type { Course } from "@/services/coursesService";

// This page is now a Server Component that fetches data securely on the server.
export default async function AdminCoursesPage() {
    const courses: Course[] = await getCourses();
    
    return <AdminCoursesView initialCourses={courses} />;
}
