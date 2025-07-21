
import { getLessons } from "@/services/lessonsService";
import { ScheduleView } from "./_components/ScheduleView";
import type { Lesson } from "@/services/lessonsService";

export default async function AdminSchedulePage() {
    const lessons: Lesson[] = await getLessons();
    
    // Serialize Firestore Timestamps to ISO strings for client component props
    const serializableLessons = lessons.map(lesson => ({
      ...lesson,
      date: (lesson.date as any).toDate().toISOString(),
    }));

    return (
        <ScheduleView initialLessons={serializableLessons} />
    );
}
