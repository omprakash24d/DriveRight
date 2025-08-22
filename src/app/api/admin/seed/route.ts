// API Route for Enhanced Services Seeding
import { verifyAdmin } from '@/lib/admin-auth';
import {
    checkSeedingStatus,
    forceReseedEnhancedServices,
    seedAllCollections,
    seedEnhancedServicesOnly
} from '@/scripts/seedEnhancedServices';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    await verifyAdmin();

    // Check what type of operation is requested
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'status':
        const status = await checkSeedingStatus();
        return NextResponse.json({
          success: true,
          data: status,
          message: 'Seeding status retrieved successfully'
        });

      case 'check':
        const checkResult = await checkSeedingStatus();
        return NextResponse.json({
          success: true,
          data: {
            ...checkResult,
            recommendation: checkResult.needsSeeding 
              ? 'Seeding recommended - no services found'
              : 'Services exist - use force reseed if needed'
          },
          message: 'Seeding check completed'
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: status, check'
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in seeding status API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to check seeding status'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    await verifyAdmin();

    const body = await request.json();
    const { action, force = false } = body;

    let result: any;
    let message: string;

    switch (action) {
      case 'seed-all':
        result = await seedAllCollections();
        message = 'All collections seeded successfully';
        break;

      case 'seed-enhanced-only':
        result = await seedEnhancedServicesOnly();
        message = 'Enhanced services seeded successfully';
        break;

      case 'force-reseed':
        if (!force) {
          return NextResponse.json({
            success: false,
            error: 'Force reseed requires explicit confirmation (force: true)'
          }, { status: 400 });
        }
        result = await forceReseedEnhancedServices();
        message = 'Services force reseeded successfully';
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: seed-all, seed-enhanced-only, force-reseed'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error in seeding API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Seeding operation failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Handle other methods
export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use GET for status or POST for seeding operations.'
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST with force-reseed action instead.'
  }, { status: 405 });
}
