
'use server';

import { cookies } from 'next/headers';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Verifies the user's session cookie and checks for admin privileges.
 * This is the centralized and authoritative function for all admin-level server-side actions.
 * @throws {Error} if the user is not authenticated or is not an admin.
 * @returns {Promise<DecodedIdToken>} The decoded token of the verified admin user.
 */
export async function verifyAdmin(): Promise<DecodedIdToken> {
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
        
        // SECURE: This is the critical check for the 'admin' custom claim.
        if (decodedToken.admin !== true) {
            throw new Error('Forbidden: User is not an admin.');
        }
        
        return decodedToken;
    } catch (error) {
        // Catches expired cookies, invalid cookies, and the custom "not an admin" error.
        throw new Error('Unauthorized: Invalid session or insufficient permissions.');
    }
}
