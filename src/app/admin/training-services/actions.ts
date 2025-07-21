
'use server';

import { revalidatePath } from 'next/cache';
import { updateTrainingService as updateService, type TrainingService } from '@/services/quickServicesService';
import { verifyAdmin } from '@/lib/admin-auth';

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
