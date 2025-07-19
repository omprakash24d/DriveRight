
import * as admin from 'firebase-admin';

let adminAppInstance: admin.app.App | null = null;
let initializationError: Error | null = null;

function initializeAdminApp() {
    // Prevent re-initialization
    if (admin.apps.length > 0) {
        adminAppInstance = admin.app();
        return;
    }

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    // Check if the service account key is provided and is a non-empty string
    if (!serviceAccountJson || serviceAccountJson.trim() === '') {
        const errorMessage = "Firebase Admin SDK Service Account is not configured. Server-side authentication is disabled.";
        console.warn(errorMessage, "The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is missing or empty.");
        initializationError = new Error(errorMessage);
        return;
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        adminAppInstance = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error: any) {
        const errorMessage = "Firebase Admin SDK failed to initialize due to invalid credentials. Server-side authentication will not work.";
        console.error(errorMessage, `Details: ${error.message}`);
        initializationError = new Error(errorMessage);
    }
}

// Initialize on module load
initializeAdminApp();

export function getAdminApp(): admin.app.App | null {
    if (initializationError) {
        // The specific error is logged once during initialization.
        return null;
    }
    if (!adminAppInstance) {
        // This case should ideally not be hit if initializationError is handled correctly.
        console.error("Firebase Admin App is not initialized, and no specific initialization error was caught. This indicates a critical failure.");
        return null;
    }
    return adminAppInstance;
}
