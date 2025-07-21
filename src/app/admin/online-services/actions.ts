
'use server';

import { revalidatePath } from 'next/cache';
import { updateOnlineService as updateService, type OnlineService } from '@/services/quickServicesService';
import { verifyAdmin } from '@/lib/admin-auth';

export async function updateOnlineServiceAction(id: string, data: Partial<Omit<OnlineService, 'id'>>) {
    try {
        await verifyAdmin();
        await updateService(id, data);
        revalidatePath('/');
        revalidatePath('/admin/online-services');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
