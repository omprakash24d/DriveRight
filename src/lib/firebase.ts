
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

let firebaseInitialized = false;

// Only initialize Firebase if all config values are present
if (Object.values(firebaseConfig).every(value => value)) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    firebaseInitialized = true;
  } catch(e) {
      console.error("Firebase initialization failed:", e);
  }
}

if (!firebaseInitialized && typeof window !== 'undefined') {
  console.error(
    "********************************************************************************\n" +
    "** FIREBASE IS NOT CONFIGURED!                                                  **\n" +
    "** -----------------------------                                              **\n" +
    "** Your Firebase configuration is missing or incomplete.                      **\n" +
    "** Please copy `.env.example` to `.env` and add your project credentials.     **\n" +
    "** The application will not function correctly until this is resolved.        **\n" +
    "********************************************************************************"
  );
}

// @ts-ignore
if (!firebaseInitialized) {
  // Provide dummy objects to prevent the app from crashing on import.
  // Functions that use these will fail at runtime.
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
}


export { app, auth, db, storage };
