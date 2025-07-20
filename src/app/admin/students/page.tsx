
import { getStudents } from "@/services/studentsService";
import { AdminStudentsView } from "./_components/AdminStudentsView";

export default async function AdminStudentsPage() {
    const students = await getStudents();
    return <AdminStudentsView initialStudents={students} />;
}
