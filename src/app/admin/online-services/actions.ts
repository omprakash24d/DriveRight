
'use server';

import { revalidatePath } from 'next/cache';
import { updateOnlineService as updateService, type OnlineService } from '@/services/quickServicesService';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

async function verifyAdmin(token: string) {
    const adminApp = getAdminApp();
    if (!adminApp) throw new Error('Server configuration error.');

    const adminAuth = getAuth(adminApp);
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // SECURE: Check for the 'admin' custom claim.
    if (decodedToken.admin !== true) {
        throw new Error('Forbidden: User is not an admin.');
    }
    return decodedToken.email;
}

export async function updateOnlineServiceAction(id: string, token: string, data: Partial<Omit<OnlineService, 'id'>>) {
    try {
        await verifyAdmin(token);
        await updateService(id, data);
        revalidatePath('/');
        revalidatePath('/admin/online-services');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
