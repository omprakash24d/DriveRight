
'use server';

import { revalidatePath } from 'next/cache';
import { updateTrainingService as updateService, type TrainingService } from '@/services/quickServicesService';
import { getAdminApp } from '@/lib/firebase-admin';
import { headers } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getSiteSettings } from '@/services/settingsService';

async function verifyAdmin() {
    const adminApp = getAdminApp();
    if (!adminApp) throw new Error('Server configuration error.');

    const adminAuth = getAuth(adminApp);
    const settings = await getSiteSettings();

    const authHeader = headers().get('Authorization');
    const idToken = authHeader?.split('Bearer ')[1];
    if (!idToken) throw new Error('Unauthorized: No token provided.');
    
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    if (!decodedToken.email || !settings.adminEmails.includes(decodedToken.email)) {
        throw new Error('Forbidden: User is not an admin.');
    }
}

export async function updateTrainingServiceAction(id: string, data: Partial<Omit<TrainingService, 'id'>>) {
    try {
        await verifyAdmin();
        await updateService(id, data);
        revalidatePath('/');
        revalidatePath('/admin/training-services');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
