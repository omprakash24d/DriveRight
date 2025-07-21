
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { updateCourse, type Course } from '@/services/coursesService';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

async function verifyAdmin() {
    const adminApp = getAdminApp();
    if (!adminApp) throw new Error('Server configuration error.');

    const adminAuth = getAuth(adminApp);
    const sessionCookie = cookies().get('__session')?.value;
    
    if (!sessionCookie) {
        throw new Error('Unauthorized: No session cookie provided.');
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // SECURE: Check for the 'admin' custom claim instead of email.
    if (decodedToken.admin !== true) {
        throw new Error('Forbidden: User is not an admin.');
    }
    return decodedToken.email;
}

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
