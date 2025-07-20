
import { getCourses } from "@/services/coursesService";
import { AdminCoursesView } from "./_components/AdminCoursesView";

export default async function AdminCoursesPage() {
    const courses = await getCourses();
    return <AdminCoursesView initialCourses={courses} />;
}
