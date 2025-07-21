
'use server';

import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, Timestamp, where } from "firebase/firestore";

export type CertificateStatus = 'Issued' | 'Pending Generation';
export type CertificateType = 'LL' | 'DL';

export interface Certificate {
    id: string;
    studentId: string;
    studentName: string;
    studentName_lowercase: string;
    studentEmail: string;
    studentRegId?: string;
    studentAvatar?: string;
    course: string;
    type: CertificateType;
    certNumber: string;
    issueDate: Timestamp;
    status: CertificateStatus;
    certificateUrl: string;
}

export type NewCertificateData = {
    studentId: string;
    studentName: string;
    studentEmail: string;
    studentRegId?: string;
    course: string;
    type: CertificateType;
};

const CERTIFICATES_COLLECTION = 'certificates';

// Fetch all certificates from Firestore
export async function getCertificates(): Promise<Certificate[]> {
  if (!db.app) return [];
  try {
    const certificatesCollection = collection(db, CERTIFICATES_COLLECTION);
    const q = query(certificatesCollection, orderBy("issueDate", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Certificate, 'id'>)
    }));
  } catch (error) {
    console.error("Error fetching certificates:", error);
    throw new Error("Could not fetch certificates.");
  }
}

// Fetch certificates for a specific user ID
export async function getCertificatesForUser(userId: string): Promise<Certificate[]> {
    if (!db.app) return [];
    try {
      const certsCollection = collection(db, CERTIFICATES_COLLECTION);
      const q = query(certsCollection, where("studentId", "==", userId), orderBy("issueDate", "desc"));
      const snapshot = await getDocs(q);
  
      if (snapshot.empty) {
          return [];
      }
  
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Certificate, 'id'>)
      }));
    } catch (error) {
      console.error("Error fetching user certificates:", error);
      throw new Error("Could not fetch user certificates.");
    }
}

// Fetch a single certificate by ID
export async function getCertificate(id: string): Promise<Certificate | null> {
    if (!db.app) return null;
    try {
        const docRef = doc(db, CERTIFICATES_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...(docSnap.data() as Omit<Certificate, 'id'>) };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error fetching certificate:", error);
        return null;
    }
}

// Find a certificate by number and optionally by student name
export async function findCertificate(certNumber: string, studentName: string): Promise<Certificate | null> {
    if (!db.app) return null;
    
    // Input validation and sanitization
    if (!certNumber || !studentName) {
        console.warn("Missing required parameters for certificate search");
        return null;
    }
    
    const sanitizedCertNumber = certNumber.trim().replace(/[^A-Za-z0-9-]/g, '');
    const sanitizedStudentName = studentName.trim().replace(/[^A-Za-z\s]/g, '');
    
    if (!sanitizedCertNumber || !sanitizedStudentName) {
        console.warn("Invalid parameters after sanitization");
        return null;
    }
    
    try {
        const certsRef = collection(db, CERTIFICATES_COLLECTION);
        
        // Clean and normalize the certificate number
        const cleanedCertNumber = sanitizedCertNumber.trim();
        const normalizedCertNumber = cleanedCertNumber.toUpperCase();
        const trimmedStudentNameLower = sanitizedStudentName.trim().toLowerCase();

        // Try multiple search approaches for maximum compatibility
        const searchVariants = [
            normalizedCertNumber,           // Uppercase version
            cleanedCertNumber,              // Original input
            cleanedCertNumber.toLowerCase() // Lowercase version
        ];

        // Remove duplicates
        const uniqueSearchVariants = [...new Set(searchVariants)];

        let certDoc = null;
        
        // Try each variant until we find a match
        for (const variant of uniqueSearchVariants) {
            const q = query(
                certsRef,
                where("certNumber", "==", variant),
                limit(1)
            );
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                certDoc = snapshot.docs[0];
                break;
            }
        }

        if (!certDoc) {
            return null; // No certificate found with any variant of this number.
        }

        const certData = { id: certDoc.id, ...certDoc.data() } as Certificate;

        // Step 2: If a student name was provided for verification (e.g., from the download page),
        // perform a case-insensitive check on the name.
        if (studentName) {
            const storedNameLower = certData.studentName?.toLowerCase();
            if (storedNameLower !== trimmedStudentNameLower) {
                return null; // Name does not match, so return null.
            }
        }
        
        // If we get here, either no name was provided (verification page) or the name matched.
        return certData;

    } catch (error) {
        console.error("Error finding certificate:", error);
        throw new Error("Could not find certificate due to a server error.");
    }
}
