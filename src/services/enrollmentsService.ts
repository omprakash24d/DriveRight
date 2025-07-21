
import { fetchFromAdminAPI, isServerSide } from "@/lib/admin-utils";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc } from "firebase/firestore";
import { addLog } from "./auditLogService";
import { createStudentFromEnrollment } from "./studentsService";

export type EnrollmentStatus = 'Pending' | 'Approved' | 'Declined';

export interface Enrollment {
    id: string;
    refId: string;
    fullName: string;
    email: string;
    mobileNumber: string;
    dateOfBirth: string; // Stored as ISO string, formatted on client
    address: string;
    state: string;
    vehicleType: string;
    documentId?: string;
    status: EnrollmentStatus;
    createdAt: Timestamp;
    photoCroppedUrl: string; // Now a URL
    idProofUrl: string; // Now a URL
    adminRemarks?: string;
    paymentId?: string;
    orderId?: string;
    pricePaid?: string;
}

const ENROLLMENTS_COLLECTION = 'enrollments';

export async function getEnrollments(): Promise<Enrollment[]> {
  // If running on server side, try to use admin API first
  if (isServerSide()) {
    try {
      return await fetchFromAdminAPI('enrollments');
    } catch (adminError) {
      console.warn('Admin API not available, falling back to client SDK');
      // Return empty array instead of trying client SDK on server
      return [];
    }
  }
  
  // Fallback to client SDK (for client-side only)
  if (!db.app) return [];
  try {
    const enrollmentsCollection = collection(db, ENROLLMENTS_COLLECTION);
    const q = query(enrollmentsCollection, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Ensure dateOfBirth is formatted nicely for display if it's a string
      const dob = data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : 'N/A';
      
      return {
        id: doc.id,
        ...data,
        dateOfBirth: dob,
      } as Enrollment;
    });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    // Return empty array instead of throwing error
    return [];
  }
}

export async function updateEnrollmentStatus(id: string, newStatus: EnrollmentStatus, adminRemarks?: string): Promise<void> {
    if (!db.app) throw new Error("Firebase not initialized.");
    const docRef = doc(db, ENROLLMENTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        throw new Error("Enrollment document not found.");
    }
    
    const enrollmentData = docSnap.data();
    const refId = enrollmentData.refId || `ID: ${id}`;

    try {
        const updateData: { status: EnrollmentStatus, adminRemarks?: string } = { status: newStatus };
        if (adminRemarks !== undefined) {
            updateData.adminRemarks = adminRemarks;
        }

        await updateDoc(docRef, updateData);

        if (enrollmentData.status !== newStatus) {
            await addLog('Updated Enrollment Status', `Ref ID: ${refId} to ${newStatus}`);
        }

        // If newly approved, create a student record
        if (newStatus === 'Approved' && enrollmentData.status !== 'Approved') {
            await createStudentFromEnrollment({
                name: enrollmentData.fullName,
                email: enrollmentData.email,
                phone: enrollmentData.mobileNumber,
                avatar: enrollmentData.photoCroppedUrl || undefined,
            });
        }
    } catch (error) {
        console.error("Error updating enrollment status:", error);
        throw new Error("Could not update enrollment status.");
    }
}
