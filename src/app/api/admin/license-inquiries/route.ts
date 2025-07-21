import { getLicensePrintInquiriesAdmin } from '@/lib/admin-server-functions';
import { getLicensePrintInquiries } from '@/services/licensePrintInquiriesService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    let inquiries;
    
    try {
      // Try using admin SDK first for better performance
      inquiries = await getLicensePrintInquiriesAdmin();
    } catch (adminError) {
      console.error('Admin SDK failed, falling back to client SDK:', adminError);
      // Fallback to client SDK
      inquiries = await getLicensePrintInquiries();
    }

    // Serialize dates for JSON response
    const serializedInquiries = inquiries.map(inquiry => ({
      ...inquiry,
      timestamp: inquiry.timestamp instanceof Date ? inquiry.timestamp.toISOString() : inquiry.timestamp,
    }));

    return NextResponse.json(serializedInquiries);
  } catch (error) {
    console.error('Error fetching license print inquiries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch license print inquiries' },
      { status: 500 }
    );
  }
}
