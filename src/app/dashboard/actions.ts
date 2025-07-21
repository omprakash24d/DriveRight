
'use server';

import { getAdminApp } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { sendDataExportEmail } from './_lib/email-service';
import { cookies } from 'next/headers';

async function verifyUserSession(): Promise<DecodedIdToken> {
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
        return decodedToken;
    } catch (error) {
        // This will catch expired or invalid cookies
        throw new Error('Unauthorized: Invalid session.');
    }
}

export async function updateUserProfileAction(data: { name?: string, avatar?: string }) {
  try {
    const decodedToken = await verifyUserSession();
    const userId = decodedToken.uid;
    
    const adminApp = getAdminApp()!;
    const adminAuth = getAuth(adminApp);
    const adminFirestore = getFirestore(adminApp);

    const authUpdatePayload: { displayName?: string; photoURL?: string } = {};
    if (data.name) authUpdatePayload.displayName = data.name;
    if (data.avatar) authUpdatePayload.photoURL = data.avatar;
    
    if (Object.keys(authUpdatePayload).length > 0) {
      await adminAuth.updateUser(userId, authUpdatePayload);
    }
    
    const userDocRef = adminFirestore.collection('users').doc(userId);
    const firestoreUpdatePayload: { name?: string, avatar?: string } = {};
    if (data.name) firestoreUpdatePayload.name = data.name;
    if (data.avatar !== undefined) firestoreUpdatePayload.avatar = data.avatar;

    if (Object.keys(firestoreUpdatePayload).length > 0) {
        await userDocRef.set(firestoreUpdatePayload, { merge: true });
    }
    
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { success: false, error: error.message || 'Failed to update profile due to an internal error.' };
  }
}

export async function requestDataExportAction() {
  try {
    const decodedToken = await verifyUserSession();
    const userId = decodedToken.uid;

    const adminApp = getAdminApp()!;
    const adminFirestore = getFirestore(adminApp);

    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    const enrolledCoursesSnapshot = await adminFirestore.collection('users').doc(userId).collection('enrolledCourses').get();
    const testResultsSnapshot = await adminFirestore.collection('testResults').where('studentId', '==', userId).get();

    const userData = userDoc.exists ? userDoc.data() : {};
    const enrolledCourses = enrolledCoursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const testResults = testResultsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const dataExport = {
      profile: userData,
      enrolledCourses,
      testResults,
    };

    if (!decodedToken.email) {
      throw new Error("User email not found in token.");
    }

    await sendDataExportEmail({
      to: decodedToken.email,
      name: (userData?.name as string) || 'Student',
      data: JSON.stringify(dataExport, null, 2),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error exporting user data:', error);
    return { success: false, error: error.message || 'Failed to export data due to an internal error.' };
  }
}

export async function deleteUserAccountAction() {
    try {
        const decodedToken = await verifyUserSession();
        const userId = decodedToken.uid;
        
        const adminApp = getAdminApp()!;
        const adminAuth = getAuth(adminApp);
        const adminFirestore = getFirestore(adminApp);

        // Delete Firestore document first
        await adminFirestore.collection('users').doc(userId).delete();

        // Then delete the Firebase Auth user
        await adminAuth.deleteUser(userId);
        
        // Invalidate the cookie on the client by having them sign out.
        // The AuthProvider will handle the redirect.
        
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting user account:', error);
        return { success: false, error: error.message || 'Failed to delete account due to an internal error.' };
    }
}
