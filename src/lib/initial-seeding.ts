// Direct seeding utility for initial setup
// This bypasses authentication and is only for initial database setup

import { EnhancedServicesManager } from '@/services/enhancedServicesService';

export async function performInitialSeeding() {
  console.log('🌱 Starting initial database seeding...');
  
  try {
    // Check if seeding is needed
    const trainingServices = await EnhancedServicesManager.getTrainingServices();
    const onlineServices = await EnhancedServicesManager.getOnlineServices();
    
    if (trainingServices.length > 0 || onlineServices.length > 0) {
      console.log('ℹ️ Services already exist. Skipping seeding.');
      console.log(`   Existing: ${trainingServices.length} training, ${onlineServices.length} online`);
      return {
        success: true,
        skipped: true,
        existing: { training: trainingServices.length, online: onlineServices.length }
      };
    }
    
    // Perform seeding
    const result = await EnhancedServicesManager.seedSampleServices();
    
    console.log('✅ Initial seeding completed successfully!');
    console.log(`   Seeded: ${result.trainingSeeded} training, ${result.onlineSeeded} online services`);
    
    return {
      success: true,
      seeded: result
    };
    
  } catch (error) {
    console.error('❌ Initial seeding failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Auto-run when this file is executed directly
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  // Only auto-run in development environment
  performInitialSeeding()
    .then((result) => {
      if (result.success) {
        console.log('🎉 Initial setup completed');
      } else {
        console.error('💥 Initial setup failed:', result.error);
      }
    })
    .catch((error) => {
      console.error('💥 Critical error:', error);
    });
}
