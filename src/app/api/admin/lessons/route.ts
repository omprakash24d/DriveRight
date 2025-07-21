
import { NextRequest, NextResponse } from 'next/server';
import { getLessons } from '@/services/lessonsService';

// This function is implicitly protected by the middleware, which verifies the session cookie.
export async function GET(request: NextRequest) {
    try {
        const lessons = await getLessons();
        
        // Serialize the lessons with date as ISO string
        const serializableLessons = lessons.map(lesson => ({
            ...lesson,
            date: (lesson.date as any).toDate().toISOString(),
        }));

        return NextResponse.json(serializableLessons);
    } catch (error: any) {
        console.error("Error in GET /api/admin/lessons:", error);
        return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status: 500 });
    }
}
