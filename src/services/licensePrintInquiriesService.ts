
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, addDoc, updateDoc, query, orderBy, Timestamp, getDoc } from "firebase/firestore";
import { addLog } from "./auditLogService";

export type LicensePrintInquiryStatus = 'New' | 'Processed' | 'Not Found';

export interface LicensePrintInquiry {
    id: string;
    name: string;
    email: string;
    dlNumber: string;
    dob: string; // Stored as ISO string
    timestamp: Timestamp;
    status: LicensePrintInquiryStatus;
    notes?: string;
}

export interface LicensePrintInquiryData {
    name: string;
    email: string;
    dlNumber: string;
    dob: Date;
}

const INQUIRIES_COLLECTION = 'licensePrintInquiries';

// Add a new inquiry to Firestore
export async function addLicensePrintInquiry(data: LicensePrintInquiryData) {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docData = {
            ...data,
            dob: data.dob.toISOString(),
            timestamp: Timestamp.now(),
            status: 'New' as LicensePrintInquiryStatus,
            notes: '',
        };
        await addDoc(collection(db, INQUIRIES_COLLECTION), docData);
    } catch (error) {
        console.error("Error adding DL Print inquiry: ", error);
        throw new Error("Could not add DL Print inquiry to the database.");
    }
}

// Fetch all inquiries
export async function getLicensePrintInquiries(): Promise<LicensePrintInquiry[]> {
    if (!db.app) return [];
    try {
        const inquiriesCollection = collection(db, INQUIRIES_COLLECTION);
        const q = query(inquiriesCollection, orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<LicensePrintInquiry, 'id'>)
        }));
    } catch (error) {
        console.error("Error fetching DL print inquiries:", error);
        throw new Error("Could not fetch DL print inquiries.");
    }
}

// Update an inquiry
export async function updateLicensePrintInquiry(id: string, data: { status: LicensePrintInquiryStatus; notes: string }): Promise<void> {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = doc(db, INQUIRIES_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        const dlNumber = docSnap.exists() ? docSnap.data().dlNumber : `ID: ${id}`;
        
        await updateDoc(docRef, data);
        await addLog('Updated DL Inquiry', `DL No: ${dlNumber} to ${data.status}`);
    } catch (error) {
        console.error("Error updating inquiry:", error);
        throw new Error("Could not update the inquiry.");
    }
}
