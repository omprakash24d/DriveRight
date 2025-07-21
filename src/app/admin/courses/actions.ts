
'use server';

import { revalidatePath } from 'next/cache';
import { updateCourse, type Course } from '@/services/coursesService';
import { verifyAdmin } from '@/lib/admin-auth';

export async function updateCourseAction(id: string, data: Partial<Omit<Course, 'id'>>) {
    try {
        await verifyAdmin(); // Verify the user is an admin before proceeding
        await updateCourse(id, data);
        revalidatePath('/');
        revalidatePath('/courses');
        revalidatePath(`/courses/${id}`);
        revalidatePath('/admin/courses');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
