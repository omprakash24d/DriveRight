
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
        // Check if the app is already initialized by name to prevent re-initialization errors in hot-reload environments
        const existingApp = admin.apps.find(app => app?.name === admin.app.DEFAULT_APP_NAME);
        if (existingApp) {
            adminAppInstance = existingApp;
            return adminAppInstance;
        }

        const serviceAccount = JSON.parse(serviceAccountJson);
        adminAppInstance = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        
        return adminAppInstance;
    } catch (error: any) {
        const errorMessage = "Firebase Admin SDK failed to initialize due to invalid credentials. Server-side authentication will not work.";
        console.error(errorMessage, `Details: ${error.message}`);
        throw new Error(errorMessage);
    }
}
