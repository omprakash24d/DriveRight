
import { getStudents, type Student } from "@/services/studentsService";
import { AdminStudentsView } from "./_components/AdminStudentsView";
import { Timestamp } from "firebase/firestore";

// This page is now a Server Component that fetches data securely on the server.
export default async function AdminStudentsPage() {
    const students: Student[] = await getStudents();

    // Firestore Timestamps are not directly serializable for client components.
    // We convert them to a plain object that can be safely passed as props.
    const serializableStudents = students.map(student => ({
      ...student,
      joined: {
        seconds: (student.joined as Timestamp).seconds,
        nanoseconds: (student.joined as Timestamp).nanoseconds,
      }
    }));
    
    return <AdminStudentsView initialStudents={serializableStudents as unknown as Student[]} />;
}
