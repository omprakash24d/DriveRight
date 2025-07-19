
'use server';

import { revalidatePath } from 'next/cache';
import { updateCourse, type Course } from '@/services/coursesService';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getSiteSettings } from '@/services/settingsService';

async function verifyAdmin(token: string) {
    const adminApp = getAdminApp();
    if (!adminApp) throw new Error('Server configuration error.');

    const adminAuth = getAuth(adminApp);
    const settings = await getSiteSettings();
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    if (!decodedToken.email || !settings.adminEmails.includes(decodedToken.email)) {
        throw new Error('Forbidden: User is not an admin.');
    }
    return decodedToken.email;
}

export async function updateCourseAction(id: string, token: string, data: Partial<Omit<Course, 'id'>>) {
    try {
        await verifyAdmin(token);
        await updateCourse(id, data);
        revalidatePath('/');
        revalidatePath('/admin/courses');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
