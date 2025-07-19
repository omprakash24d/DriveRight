
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, addDoc, updateDoc, query, orderBy, Timestamp, getDoc } from "firebase/firestore";
import { addLog } from "./auditLogService";

export type LlInquiryStatus = 'New' | 'Contacted' | 'Approved' | 'Declined' | 'Archived';

export interface LlInquiry {
    id: string;
    name: string;
    email: string;
    applicationNo: string;
    dob: string; // Stored as ISO string
    mobileNumber: string;
    state: string;
    timestamp: Timestamp;
    status: LlInquiryStatus;
    notes?: string;
}

export interface LlInquiryData {
    name: string;
    email: string;
    applicationNo: string;
    dob: Date;
    mobileNumber: string;
    state: string;
}

const LL_INQUIRIES_COLLECTION = 'llInquiries';

// Add a new inquiry to Firestore
export async function addLlInquiry(data: LlInquiryData) {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docData = {
            ...data,
            dob: data.dob.toISOString(),
            timestamp: Timestamp.now(),
            status: 'New' as LlInquiryStatus,
            notes: '',
        };
        await addDoc(collection(db, LL_INQUIRIES_COLLECTION), docData);
    } catch (error) {
        console.error("Error adding LL inquiry: ", error);
        throw new Error("Could not add LL inquiry to the database.");
    }
}

// Fetch all inquiries
export async function getLlInquiries(): Promise<LlInquiry[]> {
    if (!db.app) return [];
    try {
        const inquiriesCollection = collection(db, LL_INQUIRIES_COLLECTION);
        const q = query(inquiriesCollection, orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<LlInquiry, 'id'>)
        }));
    } catch (error) {
        console.error("Error fetching LL inquiries:", error);
        throw new Error("Could not fetch LL inquiries.");
    }
}

// Update an inquiry
export async function updateLlInquiry(id: string, data: { status: LlInquiryStatus; notes: string }): Promise<void> {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = doc(db, LL_INQUIRIES_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        const appNo = docSnap.exists() ? docSnap.data().applicationNo : `ID: ${id}`;
        
        await updateDoc(docRef, data);
        await addLog('Updated LL Inquiry', `App No: ${appNo} to ${data.status}`);
    } catch (error) {
        console.error("Error updating inquiry:", error);
        throw new Error("Could not update the inquiry.");
    }
}
