import { verifyAdmin } from '@/lib/admin-auth';
import { checkCollectionsExist, seedFirebaseCollections } from '@/scripts/seedFirebaseCollections';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdmin();
    
    const { action } = await request.json();
    
    if (action === 'seed') {

      await seedFirebaseCollections();
      
      return NextResponse.json({
        success: true,
        message: 'Firebase collections seeded successfully',
        timestamp: new Date().toISOString()
      });
    }
    
    if (action === 'check') {
      const exist = await checkCollectionsExist();
      
      return NextResponse.json({
        success: true,
        collectionsExist: exist,
        message: exist ? 'Collections already exist' : 'Collections need seeding'
      });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Invalid action. Use "seed" or "check"'
    }, { status: 400 });
    
  } catch (error: any) {
    console.error('Error in seed-collections API:', error);
    
    if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
      return NextResponse.json({
        success: false,
        message: 'Unauthorized: Admin access required'
      }, { status: 401 });
    }
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to seed collections',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await verifyAdmin();
    
    const collectionsExist = await checkCollectionsExist();
    
    return NextResponse.json({
      success: true,
      collectionsExist,
      message: collectionsExist ? 'Collections are set up' : 'Collections need seeding',
      collections: ['students', 'enrollments', 'testResults', 'courses']
    });
    
  } catch (error: any) {
    console.error('Error checking collections:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to check collections'
    }, { status: 500 });
  }
}
