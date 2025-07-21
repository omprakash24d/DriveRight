
import { getAdminApp } from '@/lib/firebase-admin';
import { getRecentNotificationsForAdmin } from '@/services/notificationsService';
import { NextRequest, NextResponse } from 'next/server';

// This function is implicitly protected by the middleware, which verifies the session cookie.
export async function GET(request: NextRequest) {
    try {
        // Check if Firebase Admin SDK is configured
        try {
            const adminApp = getAdminApp();
            // If we get here, admin SDK is configured, proceed with normal flow
            const notifications = await getRecentNotificationsForAdmin();
            return NextResponse.json(notifications);
        } catch (adminError) {
            // Firebase Admin SDK not configured - return empty notifications for development
            console.warn('Firebase Admin SDK not configured, returning empty notifications for development');
            return NextResponse.json([]);
        }
        
    } catch (error: any) {
        console.error("Error in GET /api/admin/notifications:", error);
        
        return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status: 500 });
    }
}
