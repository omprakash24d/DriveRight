// Enhanced Services Seeding Script
// Use this to populate Firebase with sample enhanced services data

import { EnhancedServicesManager } from '@/services/enhancedServicesService';
import { seedDefaultInstructors } from '@/services/instructorsService';
import { seedDefaultOnlineServices, seedDefaultTrainingServices } from '@/services/quickServicesService';
import { seedDefaultStudents } from '@/services/studentsService';
import { seedDefaultTestimonials } from '@/services/testimonialsService';

export interface SeedingResult {
  enhancedTrainingServices: number;
  enhancedOnlineServices: number;
  legacyTrainingServices: number;
  legacyOnlineServices: number;
  testimonials: number;
  students: number;
  instructors: number;
  errors: string[];
}

/**
 * Comprehensive seeding function that populates all collections
 * with sample data for admin panel operations
 */
export async function seedAllCollections(): Promise<SeedingResult> {
  const result: SeedingResult = {
    enhancedTrainingServices: 0,
    enhancedOnlineServices: 0,
    legacyTrainingServices: 0,
    legacyOnlineServices: 0,
    testimonials: 0,
    students: 0,
    instructors: 0,
    errors: []
  };

  console.log('🌱 Starting comprehensive seeding process...');

  try {
    // Seed Enhanced Services (Primary)
    console.log('📚 Seeding enhanced services...');
    try {
      const enhancedResult = await EnhancedServicesManager.seedSampleServices();
      result.enhancedTrainingServices = enhancedResult.trainingSeeded;
      result.enhancedOnlineServices = enhancedResult.onlineSeeded;
      console.log(`✅ Enhanced services: ${enhancedResult.trainingSeeded} training, ${enhancedResult.onlineSeeded} online`);
    } catch (error) {
      const errorMsg = `Enhanced services seeding failed: ${error}`;
      result.errors.push(errorMsg);
      console.error('❌ ' + errorMsg);
    }

    // Seed Legacy Quick Services (Backup/Compatibility)
    console.log('🔄 Seeding legacy quick services...');
    try {
      result.legacyTrainingServices = await seedDefaultTrainingServices();
      result.legacyOnlineServices = await seedDefaultOnlineServices();
      console.log(`✅ Legacy services: ${result.legacyTrainingServices} training, ${result.legacyOnlineServices} online`);
    } catch (error) {
      const errorMsg = `Legacy services seeding failed: ${error}`;
      result.errors.push(errorMsg);
      console.error('❌ ' + errorMsg);
    }

    // Seed Testimonials
    console.log('💬 Seeding testimonials...');
    try {
      result.testimonials = await seedDefaultTestimonials();
      console.log(`✅ Testimonials: ${result.testimonials} seeded`);
    } catch (error) {
      const errorMsg = `Testimonials seeding failed: ${error}`;
      result.errors.push(errorMsg);
      console.error('❌ ' + errorMsg);
    }

    // Seed Students
    console.log('👥 Seeding students...');
    try {
      result.students = await seedDefaultStudents();
      console.log(`✅ Students: ${result.students} seeded`);
    } catch (error) {
      const errorMsg = `Students seeding failed: ${error}`;
      result.errors.push(errorMsg);
      console.error('❌ ' + errorMsg);
    }

    // Seed Instructors
    console.log('👨‍🏫 Seeding instructors...');
    try {
      result.instructors = await seedDefaultInstructors();
      console.log(`✅ Instructors: ${result.instructors} seeded`);
    } catch (error) {
      const errorMsg = `Instructors seeding failed: ${error}`;
      result.errors.push(errorMsg);
      console.error('❌ ' + errorMsg);
    }

    console.log('🎉 Seeding process completed!');
    console.log('📊 Summary:', {
      'Enhanced Training Services': result.enhancedTrainingServices,
      'Enhanced Online Services': result.enhancedOnlineServices,
      'Legacy Training Services': result.legacyTrainingServices,
      'Legacy Online Services': result.legacyOnlineServices,
      'Testimonials': result.testimonials,
      'Students': result.students,
      'Instructors': result.instructors,
      'Errors': result.errors.length
    });

    if (result.errors.length > 0) {
      console.warn('⚠️ Some operations failed:', result.errors);
    }

    return result;

  } catch (error) {
    console.error('💥 Critical error during seeding:', error);
    result.errors.push(`Critical seeding error: ${error}`);
    throw error;
  }
}

/**
 * Seed only enhanced services (for quick testing)
 */
export async function seedEnhancedServicesOnly(): Promise<{ trainingSeeded: number; onlineSeeded: number }> {
  console.log('🚀 Seeding enhanced services only...');
  try {
    const result = await EnhancedServicesManager.seedSampleServices();
    console.log(`✅ Enhanced services seeded: ${result.trainingSeeded} training, ${result.onlineSeeded} online`);
    return result;
  } catch (error) {
    console.error('❌ Failed to seed enhanced services:', error);
    throw error;
  }
}

/**
 * Force reseed all enhanced services (destructive operation)
 */
export async function forceReseedEnhancedServices(): Promise<{ trainingSeeded: number; onlineSeeded: number }> {
  console.log('💣 Force reseeding enhanced services (destructive)...');
  console.warn('⚠️ This will deactivate existing services and create new ones');
  
  try {
    const result = await EnhancedServicesManager.reseedAllServices(true);
    console.log(`✅ Force reseed completed: ${result.trainingSeeded} training, ${result.onlineSeeded} online`);
    return result;
  } catch (error) {
    console.error('❌ Failed to force reseed services:', error);
    throw error;
  }
}

/**
 * Check if seeding is needed
 */
export async function checkSeedingStatus(): Promise<{
  needsSeeding: boolean;
  existingTraining: number;
  existingOnline: number;
}> {
  try {
    const trainingServices = await EnhancedServicesManager.getTrainingServices();
    const onlineServices = await EnhancedServicesManager.getOnlineServices();
    
    const status = {
      needsSeeding: trainingServices.length === 0 && onlineServices.length === 0,
      existingTraining: trainingServices.length,
      existingOnline: onlineServices.length
    };

    console.log('📋 Seeding status:', status);
    return status;
  } catch (error) {
    console.error('❌ Failed to check seeding status:', error);
    return {
      needsSeeding: true,
      existingTraining: 0,
      existingOnline: 0
    };
  }
}

// CLI-like interface for direct execution
if (typeof window === 'undefined' && require.main === module) {
  console.log('🔧 Enhanced Services Seeding Utility');
  console.log('Running comprehensive seeding...');
  
  seedAllCollections()
    .then((result) => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}
