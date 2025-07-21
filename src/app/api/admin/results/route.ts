import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const snapshot = await adminDb
      .collection('results')
      .orderBy('date', 'desc')
      .get();

    if (snapshot.empty) {
      return NextResponse.json([]);
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
        date: data.date ? data.date.toDate().toISOString() : new Date().toISOString(),
        timeSpent: data.timeSpent,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching results via admin API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
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
        { error: 'Result ID is required' },
        { status: 400 }
      );
    }

    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    // Get result details for logging
    const docRef = adminDb.collection('results').doc(id);
    const docSnap = await docRef.get();
    const resultDetails = docSnap.exists ? 
      `Student: ${docSnap.data()?.studentName || 'Unknown'}, Score: ${docSnap.data()?.score || 'N/A'}` : 
      `ID: ${id}`;
    
    // Delete the result
    await docRef.delete();
    
    // Log the deletion
    await adminDb.collection('audit_logs').add({
      action: 'Deleted Test Result',
      details: resultDetails,
      timestamp: new Date(),
      type: 'delete'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting result via admin API:', error);
    return NextResponse.json(
      { error: 'Failed to delete result' },
      { status: 500 }
    );
  }
}
