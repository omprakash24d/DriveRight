
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getRecentNotificationsForAdmin } from '@/services/notificationsService';

async function verifyAdmin(request: NextRequest) {
    const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (!idToken) {
        throw new Error('Unauthorized');
    }
    const adminApp = getAdminApp();
    if (!adminApp) {
        throw new Error('Server configuration error');
    }
    const adminAuth = getAuth(adminApp);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    if (!decodedToken.admin) { // Check for the custom claim
        throw new Error('Forbidden: User is not an admin.');
    }
    
    return decodedToken;
}

export async function GET(request: NextRequest) {
    try {
        await verifyAdmin(request);
        const notifications = await getRecentNotificationsForAdmin();
        return NextResponse.json(notifications);
    } catch (error: any) {
        console.error("Error in GET /api/admin/notifications:", error);
        
        let status = 500;
        if (error.message === 'Unauthorized') status = 401;
        if (error.message.startsWith('Forbidden')) status = 403;

        return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status });
    }
}
