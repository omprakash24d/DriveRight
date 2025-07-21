import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const snapshot = await adminDb
      .collection('enrollments')
      .orderBy('createdAt', 'desc')
      .get();

    if (snapshot.empty) {
      return NextResponse.json([]);
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
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        photoCroppedUrl: data.photoCroppedUrl || '',
        idProofUrl: data.idProofUrl || '',
        adminRemarks: data.adminRemarks,
        paymentId: data.paymentId,
        orderId: data.orderId,
        pricePaid: data.pricePaid,
      };
    });

    return NextResponse.json(enrollments);
  } catch (error) {
    console.error('Error fetching enrollments via admin API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}
