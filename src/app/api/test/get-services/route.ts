import { EnhancedServicesManager } from '@/services/enhancedServicesService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const [trainingServices, onlineServices] = await Promise.all([
      EnhancedServicesManager.getTrainingServices(),
      EnhancedServicesManager.getOnlineServices()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        trainingServices,
        onlineServices,
        totalTraining: trainingServices.length,
        totalOnline: onlineServices.length
      }
    });

  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch services'
      },
      { status: 500 }
    );
  }
}
