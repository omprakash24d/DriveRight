
import { fetchFromAdminAPI, isServerSide } from "@/lib/admin-utils";
import { db } from "@/lib/firebase";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc, where } from "firebase/firestore";
import { addLog } from "./auditLogService";

// Define the shape of the test result data
export interface TestResult {
    id: string;
    studentId: string;
    studentName: string;
    testType: string;
    date: Timestamp; // Using Firestore Timestamp
    score: number;
    status: 'Pass' | 'Fail';
    rawResults: string;
}

const RESULTS_COLLECTION = 'testResults';
const STUDENTS_COLLECTION = 'students';

// Fetch all results from Firestore
export async function getResults(): Promise<TestResult[]> {
  // If running on server side, try to use admin API first
  if (isServerSide()) {
    try {
      return await fetchFromAdminAPI('results');
    } catch (adminError) {
      console.warn('Admin API not available, falling back to client SDK');
      // Return empty array instead of trying client SDK on server
      return [];
    }
  }
  
  // Fallback to client SDK (for client-side only)
  if (!db.app) return [];
  try {
    const resultsCollection = collection(db, RESULTS_COLLECTION);
    const q = query(resultsCollection, orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<TestResult, 'id'>)
    }));
  } catch (error) {
    console.error("Error fetching results:", error);
    // Return empty array instead of throwing error
    return [];
  }
}

// Fetch results for a specific user ID
export async function getResultsForUser(userId: string): Promise<TestResult[]> {
  if (!db.app) return [];
  try {
    const resultsCollection = collection(db, RESULTS_COLLECTION);
    const q = query(resultsCollection, where("studentId", "==", userId), orderBy("date", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<TestResult, 'id'>)
    }));
  } catch (error) {
    console.error("Error fetching user results:", error);
    throw new Error("Could not fetch user results.");
  }
}


// Fetch a single result by ID
export async function getResult(id: string): Promise<TestResult | null> {
  if (!db.app) return null;
  try {
    const docRef = doc(db, RESULTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Omit<TestResult, 'id'>) };
    } else {
      console.warn(`No test result document found with id: ${id}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching result with id ${id}:`, error);
    throw new Error("Could not fetch test result.");
  }
}

// Add a new result to Firestore
export async function addResult(resultData: Omit<TestResult, 'id'>) {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = await addDoc(collection(db, RESULTS_COLLECTION), resultData);
        await addLog('Added Result', `For: ${resultData.studentName}, Score: ${resultData.score}`);
        
        if (resultData.status === 'Pass') {
           // We are logging that it should be created, but not creating it automatically
           // to enforce manual creation from the admin panel for better control.

        }

        return docRef.id;
    } catch (error) {
        console.error("Error adding result: ", error);
        throw new Error("Could not add test result.");
    }
}

// Update an existing result in Firestore
export async function updateResult(id: string, resultData: Partial<Omit<TestResult, 'id'>>) {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = doc(db, RESULTS_COLLECTION, id);
        await updateDoc(docRef, resultData);
        await addLog('Updated Result', `ID: ${id}`);
    } catch (error) {
        console.error("Error updating result: ", error);
        throw new Error("Could not update test result.");
    }
}

// Delete a result from Firestore (hybrid admin/client approach)
export async function deleteResult(id: string): Promise<void> {
    try {
        // Try admin API first if we're on client side
        if (typeof window !== 'undefined') {
            try {
                const { deleteFromAdminAPI } = await import('@/lib/admin-utils');
                await deleteFromAdminAPI('results', id);
                return;
            } catch (adminError) {

                // Fall through to client SDK approach
            }
        } else {
            // Server-side: try admin server function
            try {
                const { deleteResultAdmin } = await import('@/lib/admin-server-functions');
                await deleteResultAdmin(id);
                return;
            } catch (adminError) {

                // Fall through to client SDK approach
            }
        }

        // Client SDK fallback
        if (!db.app) throw new Error("Firebase not initialized.");
        const docRef = doc(db, RESULTS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        const resultTarget = docSnap.exists() ? `For: ${docSnap.data().studentName}` : `ID: ${id}`;
        
        await deleteDoc(docRef);
        await addLog('Deleted Result', resultTarget);
    } catch (error) {
        console.error("Error deleting result: ", error);
        throw new Error("Could not delete test result.");
    }
}
