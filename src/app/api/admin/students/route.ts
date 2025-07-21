import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const snapshot = await adminDb
      .collection('students')
      .orderBy('name')
      .get();

    if (snapshot.empty) {
      return NextResponse.json([]);
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
        enrollmentDate: data.enrollmentDate ? data.enrollmentDate.toDate().toISOString() : null,
        status: data.status || 'Active',
        courses: data.courses || [],
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
      };
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students via admin API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    // Delete the student
    await adminDb.collection('students').doc(id).delete();
    
    // Log the deletion
    await adminDb.collection('audit_logs').add({
      action: 'Deleted Student',
      details: `ID: ${id}`,
      timestamp: new Date(),
      type: 'delete'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting student via admin API:', error);
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    );
  }
}
