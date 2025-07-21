import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const snapshot = await adminDb
      .collection('courses')
      .orderBy('title')
      .get();

    if (snapshot.empty) {
      return NextResponse.json([]);
    }

    const courses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        duration: data.duration || '',
        price: data.price || 0,
        category: data.category || '',
        instructor: data.instructor || '',
        isActive: data.isActive !== false,
        createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
      };
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching courses via admin API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
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
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    // Get course title for logging
    const docRef = adminDb.collection('courses').doc(id);
    const docSnap = await docRef.get();
    const courseTitle = docSnap.exists ? docSnap.data()?.title : `ID: ${id}`;
    
    // Delete the course
    await docRef.delete();
    
    // Log the deletion
    await adminDb.collection('audit_logs').add({
      action: 'Deleted Course',
      details: `Title: ${courseTitle}`,
      timestamp: new Date(),
      type: 'delete'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course via admin API:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const body = await request.json();
    const { title, description, duration, price, category, instructor, isActive } = body;
    
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const courseData = {
      title,
      description,
      duration: duration || '',
      price: price || 0,
      category: category || '',
      instructor: instructor || '',
      isActive: isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb.collection('courses').add(courseData);
    
    // Log the creation
    await adminDb.collection('audit_logs').add({
      action: 'Created Course',
      details: `Title: ${title}`,
      timestamp: new Date(),
      type: 'create'
    });

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      course: { id: docRef.id, ...courseData }
    });
  } catch (error) {
    console.error('Error creating course via admin API:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
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
        { error: 'Course ID is required' },
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

    await adminDb.collection('courses').doc(id).update(updateData);
    
    // Log the update
    await adminDb.collection('audit_logs').add({
      action: 'Updated Course',
      details: `ID: ${id}`,
      timestamp: new Date(),
      type: 'update'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating course via admin API:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}
