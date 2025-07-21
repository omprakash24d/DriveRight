import { fetchFromAdminAPI, isServerSide } from "@/lib/admin-utils";
import { db } from "@/lib/firebase";
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc } from "firebase/firestore";
import { addLog } from "./auditLogService";

export type RefresherRequestStatus = 'Pending' | 'Approved' | 'Declined';

export interface RefresherRequest {
    id: string;
    refId: string;
    name: string;
    email: string;
    mobileNo: string;
    dob: string; // Stored as ISO string
    vehicleType: 'lmv' | 'hmv';
    reason: string;
    status: RefresherRequestStatus;
    createdAt: Timestamp;
    notes?: string;
}

const REFRESHER_REQUESTS_COLLECTION = 'refresherRequests';

// Fetch all refresher requests
export async function getRefresherRequests(): Promise<RefresherRequest[]> {
  // If running on server side, try to use admin API first
  if (isServerSide()) {
    try {
      return await fetchFromAdminAPI('refresher-requests');
    } catch (adminError) {
      console.warn('Admin API not available, falling back to client SDK');
      // Return empty array instead of trying client SDK on server
      return [];
    }
  }
  
  // Fallback to client SDK (for client-side only)
  if (!db.app) return [];
  try {
    const requestsCollection = collection(db, REFRESHER_REQUESTS_COLLECTION);
    const q = query(requestsCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<RefresherRequest, 'id'>)
    }));
  } catch (error) {
    console.error("Error fetching refresher requests:", error);
    // Return empty array instead of throwing error
    return [];
  }
}

// Update the status and notes of a request
export async function updateRefresherRequestStatus(id: string, data: { status: RefresherRequestStatus; notes: string }): Promise<void> {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = doc(db, REFRESHER_REQUESTS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        const refId = docSnap.exists() ? docSnap.data().refId : `ID: ${id}`;
        
        await updateDoc(docRef, data);
        await addLog('Updated Refresher Request Status', `Ref ID: ${refId} to ${data.status}`);
    } catch (error) {
        console.error("Error updating refresher request status:", error);
        throw new Error("Could not update refresher request status.");
    }
}

// Delete a request (hybrid admin/client approach)
export async function deleteRefresherRequest(id: string): Promise<void> {
    try {
        // Try admin API first if we're on client side
        if (typeof window !== 'undefined') {
            try {
                const { deleteFromAdminAPI } = await import('@/lib/admin-utils');
                await deleteFromAdminAPI('refresher-requests', id);
                return;
            } catch (adminError) {
                console.log('Admin API not available, falling back to client SDK');
                // Fall through to client SDK approach
            }
        } else {
            // Server-side: try admin server function
            try {
                const { deleteRefresherRequestAdmin } = await import('@/lib/admin-server-functions');
                await deleteRefresherRequestAdmin(id);
                return;
            } catch (adminError) {
                console.log('Admin server function failed, falling back to client SDK');
                // Fall through to client SDK approach
            }
        }

        // Client SDK fallback
        if (!db.app) throw new Error("Firebase not initialized.");
        const docRef = doc(db, REFRESHER_REQUESTS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        const refId = docSnap.exists() ? docSnap.data().refId : `ID: ${id}`;

        await deleteDoc(docRef);
        await addLog('Deleted Refresher Request', `Ref ID: ${refId}`);
    } catch (error) {
        console.error("Error deleting refresher request:", error);
        throw new Error("Could not delete refresher request.");
    }
}
