import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const snapshot = await adminDb
      .collection('instructors')
      .orderBy('name')
      .get();

    if (snapshot.empty) {
      return NextResponse.json([]);
    }

    const instructors = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        specialization: data.specialization || '',
        experience: data.experience || '',
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
      };
    });

    return NextResponse.json(instructors);
  } catch (error) {
    console.error('Error fetching instructors via admin API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instructors' },
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
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    // Get instructor name for logging
    const docRef = adminDb.collection('instructors').doc(id);
    const docSnap = await docRef.get();
    const instructorName = docSnap.exists ? docSnap.data()?.name : `ID: ${id}`;
    
    // Delete the instructor
    await docRef.delete();
    
    // Log the deletion
    await adminDb.collection('audit_logs').add({
      action: 'Deleted Instructor',
      details: `Name: ${instructorName}`,
      timestamp: new Date(),
      type: 'delete'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting instructor via admin API:', error);
    return NextResponse.json(
      { error: 'Failed to delete instructor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const body = await request.json();
    const { name, email, phone, specialization, experience } = body;
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const instructorData = {
      name,
      email,
      phone: phone || '',
      specialization: specialization || '',
      experience: experience || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection('instructors').add(instructorData);
    
    // Log the creation
    await adminDb.collection('audit_logs').add({
      action: 'Created Instructor',
      details: `Name: ${name}`,
      timestamp: new Date(),
      type: 'create'
    });

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      instructor: { id: docRef.id, ...instructorData }
    });
  } catch (error) {
    console.error('Error creating instructor via admin API:', error);
    return NextResponse.json(
      { error: 'Failed to create instructor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const body = await request.json();
    const updateData = {
      ...body,
      updatedAt: new Date(),
    };

    await adminDb.collection('instructors').doc(id).update(updateData);
    
    // Log the update
    await adminDb.collection('audit_logs').add({
      action: 'Updated Instructor',
      details: `ID: ${id}`,
      timestamp: new Date(),
      type: 'update'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating instructor via admin API:', error);
    return NextResponse.json(
      { error: 'Failed to update instructor' },
      { status: 500 }
    );
  }
}
