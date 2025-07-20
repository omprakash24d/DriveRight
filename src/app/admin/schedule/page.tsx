
import { getLessons } from "@/services/lessonsService";
import { ScheduleView } from "./_components/ScheduleView";
import type { Lesson } from "@/services/lessonsService";

// This page is now a Server Component that fetches data securely on the server.
export default async function AdminSchedulePage() {
    // Fetch lessons directly on the server. This is secure because the service uses
    // the Admin SDK, which has privileged access governed by your server environment.
    const lessons: Lesson[] = await getLessons();

    return (
        <ScheduleView initialLessons={lessons} />
    );
}
