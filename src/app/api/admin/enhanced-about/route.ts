import { getSiteSettings } from '@/services/settingsService';
import { settingsService } from '@/services/settingsService.enhanced';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get base settings
    const baseSettings = await getSiteSettings();
    
    if (!baseSettings) {
      return NextResponse.json({
        success: false,
        message: 'Site settings not found'
      }, { status: 404 });
    }

    // Get enhanced metrics
    const metrics = await settingsService.getAboutSectionMetrics();
    
    // Get enhanced stats
    const enhancedStats = await settingsService.getEnhancedHomepageStats(
      baseSettings.homepageStats || []
    );

    return NextResponse.json({
      success: true,
      data: {
        baseSettings,
        metrics,
        enhancedStats
      }
    });
    
  } catch (error: any) {
    console.error('Error in enhanced-about API:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to fetch enhanced about data',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
