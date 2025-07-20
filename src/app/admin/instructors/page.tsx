
import { getInstructors } from "@/services/instructorsService";
import { AdminInstructorsView } from "./_components/AdminInstructorsView";

export default async function AdminInstructorsPage() {
    const instructors = await getInstructors();
    return <AdminInstructorsView initialInstructors={instructors} />;
}
