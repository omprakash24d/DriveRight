// Simple test service creation using Enhanced Services Manager
import { EnhancedServicesManager } from "./src/services/enhancedServicesService.ts";

const testTrainingService = {
  title: "Test Driving Course",
  description: "Basic driving course for testing pricing",
  shortDescription: "Test course",
  category: "basic",
  difficulty: "beginner",
  duration: "30 days",
  isActive: true,
  priority: 1,
  features: ["Basic driving", "Traffic rules"],
  pricing: {
    basePrice: 1000,
    currency: "INR",
    taxes: {
      gst: 18,
      serviceTax: 0,
      otherCharges: 0,
    },
    // finalPrice will be calculated automatically
  },
  metadata: {
    instructorCount: 1,
    carTypes: ["Manual"],
    locations: ["Test Location"],
    languages: ["English"],
  },
};

async function createTestService() {
  try {
    console.log("Creating test service...");
    const serviceId = await EnhancedServicesManager.createTrainingService(
      testTrainingService
    );
    console.log("Test service created with ID:", serviceId);

    // Verify it was created with proper pricing
    const services = await EnhancedServicesManager.getTrainingServices();
    console.log("All training services:", services);
  } catch (error) {
    console.error("Error creating test service:", error);
  }
}

createTestService();
