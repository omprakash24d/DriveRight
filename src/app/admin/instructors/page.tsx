
import { getInstructors } from "@/services/instructorsService";
import { AdminInstructorsView } from "./_components/AdminInstructorsView";
import type { Instructor } from "@/services/instructorsService";

// This page is now a Server Component that fetches data securely on the server.
export default async function AdminInstructorsPage() {
    const instructors: Instructor[] = await getInstructors();
    
    return <AdminInstructorsView initialInstructors={instructors} />;
}
