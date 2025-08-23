import { EnhancedServicesManager } from '@/services/enhancedServicesService';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Creating test services...');
    
    // Create a test training service
    const testTrainingService = {
      title: "Test Basic Driving Course",
      description: "A test driving course for payment testing",
      shortDescription: "Test driving course",
      icon: "car",
      category: "LMV" as const,
      services: [
        "Basic driving lessons",
        "Traffic rules education",
        "Parking practice"
      ],
      duration: {
        value: 30,
        unit: "days" as const
      },
      pricing: {
        basePrice: 2000,
        currency: "INR" as const,
        discountPercentage: 10,
        discountValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        taxes: {
          gst: 18,
          serviceTax: 0,
          otherCharges: 50
        },
        finalPrice: 0 // Will be calculated
      },
      features: [
        "Basic driving lessons",
        "Traffic rules",
        "Parking practice"
      ],
      prerequisites: ["Valid learner's license"],
      certification: "Driving Course Completion Certificate",
      instructorRequired: true,
      maxStudents: 5,
      ctaHref: "/booking/test-driving-course",
      ctaText: "Book Now",
      isActive: true,
      priority: 1,
      bookingSettings: {
        requireApproval: true,
        allowRescheduling: true,
        cancellationPolicy: "Cancel up to 24 hours before",
        advanceBookingDays: 7
      },
      seoMetadata: {
        metaTitle: "Test Basic Driving Course",
        metaDescription: "Learn basic driving with our test course",
        keywords: ["driving", "test", "course", "basic"]
      }
    };

    // Calculate final price before saving
    testTrainingService.pricing.finalPrice = EnhancedServicesManager.calculateFinalPrice(testTrainingService.pricing);

    const trainingServiceId = await EnhancedServicesManager.createTrainingService(testTrainingService);
    console.log('Training service created:', trainingServiceId);

    // Create a test online service
    const testOnlineService = {
      title: "Test Online Traffic Rules",
      description: "Online course for traffic rules learning",
      shortDescription: "Online traffic rules course",
      icon: "monitor",
      category: "Document" as const,
      pricing: {
        basePrice: 500,
        currency: "INR" as const,
        discountPercentage: 20,
        discountValidUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        taxes: {
          gst: 18,
          serviceTax: 0,
          otherCharges: 0
        },
        finalPrice: 0 // Will be calculated
      },
      processingTime: {
        value: 24,
        unit: "hours" as const
      },
      requiredDocuments: ["Valid ID proof"],
      deliveryMethod: "email" as const,
      features: [
        "Video lessons",
        "Practice tests",
        "Certificate"
      ],
      href: "/online/traffic-rules",
      ctaText: "Start Course",
      isActive: true,
      priority: 1,
      automatedProcessing: true,
      requiresVerification: false,
      seoMetadata: {
        metaTitle: "Test Online Traffic Rules Course",
        metaDescription: "Learn traffic rules online with our test course",
        keywords: ["traffic", "rules", "online", "course"]
      }
    };

    // Calculate final price before saving
    testOnlineService.pricing.finalPrice = EnhancedServicesManager.calculateFinalPrice(testOnlineService.pricing);

    const onlineServiceId = await EnhancedServicesManager.createOnlineService(testOnlineService);
    console.log('Online service created:', onlineServiceId);

    return NextResponse.json({
      success: true,
      message: 'Test services created successfully',
      data: {
        trainingServiceId,
        onlineServiceId,
        trainingServiceFinalPrice: testTrainingService.pricing.finalPrice,
        onlineServiceFinalPrice: testOnlineService.pricing.finalPrice
      }
    });

  } catch (error) {
    console.error('Error creating test services:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create test services'
      },
      { status: 500 }
    );
  }
}
