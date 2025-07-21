import { getRefresherRequestsAdmin } from '@/lib/admin-server-functions';
import { getAdminApp } from '@/lib/firebase-admin';
import { getRefresherRequests } from '@/services/refresherRequestsService';
import { getFirestore } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    let refresherRequests;
    
    try {
      // Try using admin SDK first for better performance
      refresherRequests = await getRefresherRequestsAdmin();
    } catch (adminError) {
      console.error('Admin SDK failed, falling back to client SDK:', adminError);
      // Fallback to client SDK
      refresherRequests = await getRefresherRequests();
    }

    // Serialize dates for JSON response
    const serializedRequests = refresherRequests.map(req => ({
      ...req,
      createdAt: req.createdAt instanceof Date ? req.createdAt.toISOString() : req.createdAt,
      updatedAt: (req as any).updatedAt instanceof Date ? (req as any).updatedAt.toISOString() : (req as any).updatedAt,
    }));

    return NextResponse.json(serializedRequests);
  } catch (error) {
    console.error('Error fetching refresher requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refresher requests' },
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
        { error: 'Refresher request ID is required' },
        { status: 400 }
      );
    }

    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    // Get request details for logging
    const docRef = adminDb.collection('refresher_requests').doc(id);
    const docSnap = await docRef.get();
    const requestDetails = docSnap.exists ? 
      `Student: ${docSnap.data()?.studentName || 'Unknown'}` : 
      `ID: ${id}`;
    
    // Delete the refresher request
    await docRef.delete();
    
    // Log the deletion
    await adminDb.collection('audit_logs').add({
      action: 'Deleted Refresher Request',
      details: requestDetails,
      timestamp: new Date(),
      type: 'delete'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting refresher request via admin API:', error);
    return NextResponse.json(
      { error: 'Failed to delete refresher request' },
      { status: 500 }
    );
  }
}
