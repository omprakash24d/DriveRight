
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { updateTrainingService as updateService, type TrainingService } from '@/services/quickServicesService';
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
    
    // SECURE: Check for the 'admin' custom claim.
    if (decodedToken.admin !== true) {
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
