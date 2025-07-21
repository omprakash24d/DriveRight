import { getLlInquiriesAdmin } from '@/lib/admin-server-functions';
import { getLlInquiries } from '@/services/llInquiriesService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    let inquiries;
    
    try {
      // Try using admin SDK first for better performance
      inquiries = await getLlInquiriesAdmin();
    } catch (adminError) {
      console.error('Admin SDK failed, falling back to client SDK:', adminError);
      // Fallback to client SDK
      inquiries = await getLlInquiries();
    }

    // Serialize dates for JSON response
    const serializedInquiries = inquiries.map(inquiry => ({
      ...inquiry,
      timestamp: inquiry.timestamp instanceof Date ? inquiry.timestamp.toISOString() : inquiry.timestamp,
    }));

    return NextResponse.json(serializedInquiries);
  } catch (error) {
    console.error('Error fetching LL inquiries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch LL inquiries' },
      { status: 500 }
    );
  }
}
