
'use server';

import { getAdminApp } from '@/lib/firebase-admin';
import { revalidatePath } from 'next/cache';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export async function updateUserProfileAction(userId: string, token: string, data: { name?: string, avatar?: string }) {
  try {
    const adminApp = getAdminApp();
    if (!adminApp) {
        return { success: false, error: 'Server configuration error. Firebase Admin SDK not initialized.' };
    }
    const adminAuth = getAuth(adminApp);
    const adminFirestore = getFirestore(adminApp);

    // 1. Verify the user's token to ensure they are who they say they are.
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (decodedToken.uid !== userId) {
        return { success: false, error: 'Unauthorized. You can only update your own profile.' };
    }
    
    // 2. Update Firebase Authentication user object
    const authUpdatePayload: { displayName?: string; photoURL?: string } = {};
    if (data.name) authUpdatePayload.displayName = data.name;
    if (data.avatar) authUpdatePayload.photoURL = data.avatar;
    
    if (Object.keys(authUpdatePayload).length > 0) {
      await adminAuth.updateUser(userId, authUpdatePayload);
    }
    
    // 3. Update the user's profile document in Firestore using the Admin SDK
    const userDocRef = adminFirestore.collection('users').doc(userId);
    const firestoreUpdatePayload: { name?: string, avatar?: string } = {};
    if (data.name) firestoreUpdatePayload.name = data.name;
    if (data.avatar !== undefined) firestoreUpdatePayload.avatar = data.avatar;

    if (Object.keys(firestoreUpdatePayload).length > 0) {
        // Use set with merge: true to create the document if it doesn't exist, or update it if it does.
        await userDocRef.set(firestoreUpdatePayload, { merge: true });
    }
    
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    const message = error.code === 'auth/user-not-found' 
      ? 'User not found.' 
      : 'Failed to update profile due to an internal error.';
    return { success: false, error: message };
  }
}
