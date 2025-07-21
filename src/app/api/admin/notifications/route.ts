
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getRecentNotificationsForAdmin } from '@/services/notificationsService';
import { cookies } from 'next/headers';

async function verifyAdminSession() {
    const sessionCookie = cookies().get('__session')?.value;
    if (!sessionCookie) {
        throw new Error('Unauthorized: No session cookie provided.');
    }

    const adminApp = getAdminApp();
    if (!adminApp) {
        throw new Error('Server configuration error.');
    }
    const adminAuth = getAuth(adminApp);
    
    try {
        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
        if (decodedToken.admin !== true) {
            throw new Error('Forbidden: User is not an admin.');
        }
        return decodedToken;
    } catch (error) {
        throw new Error('Unauthorized: Invalid session.');
    }
}

export async function GET(request: NextRequest) {
    try {
        await verifyAdminSession();
        const notifications = await getRecentNotificationsForAdmin();
        return NextResponse.json(notifications);
    } catch (error: any) {
        console.error("Error in GET /api/admin/notifications:", error);
        
        let status = 500;
        if (error.message.startsWith('Unauthorized')) status = 401;
        if (error.message.startsWith('Forbidden')) status = 403;

        return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status });
    }
}
