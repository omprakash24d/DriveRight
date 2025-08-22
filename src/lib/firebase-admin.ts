
import * as admin from 'firebase-admin';

let adminAppInstance: admin.app.App | null = null;

/**
 * Initializes and returns the Firebase Admin App instance using a singleton pattern.
 * This ensures the app is initialized only once and only when first needed,
 * preventing race conditions with environment variable loading.
 * @returns {admin.app.App} The initialized Firebase Admin App.
 * @throws {Error} If the Firebase Admin SDK service account key is missing or invalid.
 */
export function getAdminApp(): admin.app.App {
    if (adminAppInstance) {
        return adminAppInstance;
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountJson || serviceAccountJson.trim() === '') {
        const errorMessage = "Firebase Admin SDK Service Account is not configured. The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is missing or empty.";
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    try {
        // Check if the default app is already initialized
        if (admin.apps.length > 0) {
            const defaultApp = admin.app();
            if (defaultApp) {
                adminAppInstance = defaultApp;
                return adminAppInstance;
            }
        }

        const serviceAccount = JSON.parse(serviceAccountJson);
        
        // Use explicit project ID from environment variable for production consistency
        const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id || 'driveright-11b83';
        
        // Ensure storage bucket is properly configured for production
        const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 
                             process.env.FIREBASE_STORAGE_BUCKET || 
                             'driveright-11b83.firebasestorage.app';
        
        if (!projectId) {
            throw new Error("Firebase project ID is not configured. Missing project_id in service account or FIREBASE_PROJECT_ID environment variable.");
        }
        
        adminAppInstance = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: storageBucket,
            projectId: projectId,
        });
        

        return adminAppInstance;
    } catch (error: any) {
        const errorMessage = "Firebase Admin SDK failed to initialize due to invalid credentials. Server-side authentication will not work.";
        console.error(errorMessage, `Details: ${error.message}`);
        throw new Error(errorMessage);
    }
}
