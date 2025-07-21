
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getRecentNotificationsForAdmin } from '@/services/notificationsService';
import { cookies } from 'next/headers';

// This function is implicitly protected by the middleware, which verifies the session cookie.
export async function GET(request: NextRequest) {
    try {
        // The middleware has already verified the session cookie, so we can proceed.
        const notifications = await getRecentNotificationsForAdmin();
        
        // The `timestamp` field is a Date object. When we send it via JSON,
        // it gets converted to an ISO string, which the client will parse back into a Date.
        return NextResponse.json(notifications);
    } catch (error: any) {
        console.error("Error in GET /api/admin/notifications:", error);
        
        return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status: 500 });
    }
}
