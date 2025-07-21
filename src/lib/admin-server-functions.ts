// Server-side only functions using Firebase Admin SDK
// These should only be imported and used in server components

import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

export async function getEnrollmentsAdmin() {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const snapshot = await adminDb
      .collection('enrollments')
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      return [];
    }

    const enrollments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        refId: data.refId || '',
        fullName: data.fullName || '',
        email: data.email || '',
        mobileNumber: data.mobileNumber || '',
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : 'N/A',
        address: data.address || '',
        state: data.state || '',
        vehicleType: data.vehicleType || '',
        documentId: data.documentId,
        status: data.status || 'Pending',
        createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' 
          ? data.createdAt.toDate() 
          : data.createdAt instanceof Date 
            ? data.createdAt 
            : new Date(),
        photoCroppedUrl: data.photoCroppedUrl || '',
        idProofUrl: data.idProofUrl || '',
        adminRemarks: data.adminRemarks,
        paymentId: data.paymentId,
        orderId: data.orderId,
        pricePaid: data.pricePaid,
      };
    });

    return enrollments;
  } catch (error) {
    console.error('Error fetching enrollments via admin SDK:', error);
    throw new Error('Failed to fetch enrollments');
  }
}

export async function getStudentsAdmin() {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const snapshot = await adminDb
      .collection('students')
      .orderBy('name')
      .get();

    if (snapshot.empty) {
      return [];
    }

    const students = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        mobile: data.mobile || '',
        address: data.address || '',
        dateOfBirth: data.dateOfBirth || '',
        emergencyContact: data.emergencyContact || '',
        licenseNumber: data.licenseNumber,
        enrollmentDate: data.enrollmentDate && typeof data.enrollmentDate.toDate === 'function' 
          ? data.enrollmentDate.toDate() 
          : data.enrollmentDate instanceof Date 
            ? data.enrollmentDate 
            : null,
        status: data.status || 'Active',
        courses: data.courses || [],
        // Convert any other timestamp fields to dates
        createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' 
          ? data.createdAt.toDate() 
          : data.createdAt instanceof Date 
            ? data.createdAt 
            : null,
        updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function' 
          ? data.updatedAt.toDate() 
          : data.updatedAt instanceof Date 
            ? data.updatedAt 
            : null,
      };
    });

    return students;
  } catch (error) {
    console.error('Error fetching students via admin SDK:', error);
    throw new Error('Failed to fetch students');
  }
}

export async function getResultsAdmin() {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const snapshot = await adminDb
      .collection('results')
      .orderBy('date', 'desc')
      .get();

    if (snapshot.empty) {
      return [];
    }

    const results = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentId: data.studentId || '',
        studentName: data.studentName || '',
        testType: data.testType || '',
        score: data.score || 0,
        totalQuestions: data.totalQuestions || 0,
        status: data.status || '',
        date: data.date && typeof data.date.toDate === 'function' 
          ? data.date.toDate() 
          : data.date instanceof Date 
            ? data.date 
            : new Date(),
        timeSpent: data.timeSpent,
        createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' 
          ? data.createdAt.toDate() 
          : data.createdAt instanceof Date 
            ? data.createdAt 
            : null,
        updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function' 
          ? data.updatedAt.toDate() 
          : data.updatedAt instanceof Date 
            ? data.updatedAt 
            : null,
      };
    });

    return results;
  } catch (error) {
    console.error('Error fetching results via admin SDK:', error);
    throw new Error('Failed to fetch results');
  }
}

export async function getRefresherRequestsAdmin() {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const snapshot = await adminDb
      .collection('refresher_requests')
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      return [];
    }

    const refresherRequests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentName: data.studentName || '',
        email: data.email || '',
        mobile: data.mobile || '',
        licenseNumber: data.licenseNumber || '',
        reason: data.reason || '',
        status: data.status || 'Pending',
        createdAt: data.createdAt && typeof data.createdAt.toDate === 'function' 
          ? data.createdAt.toDate() 
          : data.createdAt instanceof Date 
            ? data.createdAt 
            : new Date(),
        notes: data.notes,
        updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function' 
          ? data.updatedAt.toDate() 
          : data.updatedAt instanceof Date 
            ? data.updatedAt 
            : null,
      };
    });

    return refresherRequests;
  } catch (error) {
    console.error('Error fetching refresher requests via admin SDK:', error);
    throw new Error('Failed to fetch refresher requests');
  }
}

export async function getLlInquiriesAdmin() {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const snapshot = await adminDb
      .collection('llInquiries')
      .orderBy('timestamp', 'desc')
      .get();

    if (snapshot.empty) {
      return [];
    }

    const llInquiries = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        applicationNo: data.applicationNo || '',
        dob: data.dob || '',
        mobileNumber: data.mobileNumber || '',
        state: data.state || '',
        status: data.status || 'New',
        notes: data.notes || '',
        timestamp: data.timestamp && typeof data.timestamp.toDate === 'function' 
          ? data.timestamp.toDate() 
          : data.timestamp instanceof Date 
            ? data.timestamp 
            : new Date(),
      };
    });

    return llInquiries;
  } catch (error) {
    console.error('Error fetching LL inquiries via admin SDK:', error);
    throw new Error('Failed to fetch LL inquiries');
  }
}

export async function getLicensePrintInquiriesAdmin() {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const snapshot = await adminDb
      .collection('licensePrintInquiries')
      .orderBy('timestamp', 'desc')
      .get();

    if (snapshot.empty) {
      return [];
    }

    const licensePrintInquiries = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        dlNumber: data.dlNumber || '',
        dob: data.dob || '',
        mobileNumber: data.mobileNumber || '',
        address: data.address || '',
        state: data.state || '',
        status: data.status || 'New',
        notes: data.notes || '',
        timestamp: data.timestamp && typeof data.timestamp.toDate === 'function' 
          ? data.timestamp.toDate() 
          : data.timestamp instanceof Date 
            ? data.timestamp 
            : new Date(),
      };
    });

    return licensePrintInquiries;
  } catch (error) {
    console.error('Error fetching license print inquiries via admin SDK:', error);
    throw new Error('Failed to fetch license print inquiries');
  }
}

// Delete a student using Firebase Admin SDK
export async function deleteStudentAdmin(id: string): Promise<void> {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    await adminDb.collection('students').doc(id).delete();
    
    // Log the deletion
    await adminDb.collection('audit_logs').add({
      action: 'Deleted Student',
      details: `ID: ${id}`,
      timestamp: new Date(),
      type: 'delete'
    });
    
  } catch (error) {
    console.error('Error deleting student via admin SDK:', error);
    throw new Error('Failed to delete student');
  }
}

// Delete an instructor using Firebase Admin SDK
export async function deleteInstructorAdmin(id: string): Promise<void> {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    // Get instructor name for logging
    const docRef = adminDb.collection('instructors').doc(id);
    const docSnap = await docRef.get();
    const instructorName = docSnap.exists ? docSnap.data()?.name : `ID: ${id}`;
    
    await docRef.delete();
    
    // Log the deletion
    await adminDb.collection('audit_logs').add({
      action: 'Deleted Instructor',
      details: `Name: ${instructorName}`,
      timestamp: new Date(),
      type: 'delete'
    });
    
  } catch (error) {
    console.error('Error deleting instructor via admin SDK:', error);
    throw new Error('Failed to delete instructor');
  }
}

// Delete a course using Firebase Admin SDK
export async function deleteCourseAdmin(id: string): Promise<void> {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    // Get course title for logging
    const docRef = adminDb.collection('courses').doc(id);
    const docSnap = await docRef.get();
    const courseTitle = docSnap.exists ? docSnap.data()?.title : `ID: ${id}`;
    
    await docRef.delete();
    
    // Log the deletion
    await adminDb.collection('audit_logs').add({
      action: 'Deleted Course',
      details: `Title: ${courseTitle}`,
      timestamp: new Date(),
      type: 'delete'
    });
    
  } catch (error) {
    console.error('Error deleting course via admin SDK:', error);
    throw new Error('Failed to delete course');
  }
}

// Delete a test result using Firebase Admin SDK
export async function deleteResultAdmin(id: string): Promise<void> {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    // Get result details for logging
    const docRef = adminDb.collection('results').doc(id);
    const docSnap = await docRef.get();
    const resultDetails = docSnap.exists ? 
      `Student: ${docSnap.data()?.studentName || 'Unknown'}, Score: ${docSnap.data()?.score || 'N/A'}` : 
      `ID: ${id}`;
    
    await docRef.delete();
    
    // Log the deletion
    await adminDb.collection('audit_logs').add({
      action: 'Deleted Test Result',
      details: resultDetails,
      timestamp: new Date(),
      type: 'delete'
    });
    
  } catch (error) {
    console.error('Error deleting result via admin SDK:', error);
    throw new Error('Failed to delete result');
  }
}

// Delete a refresher request using Firebase Admin SDK
export async function deleteRefresherRequestAdmin(id: string): Promise<void> {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    // Get request details for logging
    const docRef = adminDb.collection('refresher_requests').doc(id);
    const docSnap = await docRef.get();
    const requestDetails = docSnap.exists ? 
      `Student: ${docSnap.data()?.studentName || 'Unknown'}` : 
      `ID: ${id}`;
    
    await docRef.delete();
    
    // Log the deletion
    await adminDb.collection('audit_logs').add({
      action: 'Deleted Refresher Request',
      details: requestDetails,
      timestamp: new Date(),
      type: 'delete'
    });
    
  } catch (error) {
    console.error('Error deleting refresher request via admin SDK:', error);
    throw new Error('Failed to delete refresher request');
  }
}
