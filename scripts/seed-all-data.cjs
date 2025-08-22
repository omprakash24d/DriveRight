// Direct seeding script - bypasses authentication for initial setup
const { execSync } = require("child_process");

console.log("🌱 Starting comprehensive database seeding...");
console.log("=".repeat(60));

// Set environment variable to bypass authentication
process.env.NODE_ENV = "development";

async function runSeeding() {
  try {
    // Import and run the seeding functions
    const { seedAllCollections } = await import(
      "../src/scripts/seedEnhancedServices.ts"
    );

    console.log("📊 Executing comprehensive seeding...");
    const result = await seedAllCollections();

    console.log("\n" + "=".repeat(60));
    console.log("✅ SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));

    console.log("\n📈 Results Summary:");
    console.log(
      `   Enhanced Training Services: ${result.enhancedTrainingServices}`
    );
    console.log(
      `   Enhanced Online Services: ${result.enhancedOnlineServices}`
    );
    console.log(
      `   Legacy Training Services: ${result.legacyTrainingServices}`
    );
    console.log(`   Legacy Online Services: ${result.legacyOnlineServices}`);
    console.log(`   Testimonials: ${result.testimonials}`);
    console.log(`   Students: ${result.students}`);
    console.log(`   Instructors: ${result.instructors}`);

    if (result.errors.length > 0) {
      console.log("\n⚠️ Some operations had issues:");
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log("\n🎉 All operations completed without errors!");
    }

    console.log("\n💡 What you can do now:");
    console.log(
      "   • Visit http://localhost:9002/admin/services to manage services"
    );
    console.log(
      "   • Visit http://localhost:9002/admin to access the full admin panel"
    );
    console.log("   • Your services are now available with exact pricing");
    console.log("   • All sample data is ready for testing and development");

    console.log("\n🔧 Your Services with Exact Pricing:");
    console.log("   Training Services:");
    console.log("     - LMV Training: ₹6,000");
    console.log("     - HMV Training: ₹11,000");
    console.log("     - MCWG Training: ₹5,000");
    console.log("     - Refresher Course: ₹3,500");
    console.log("   Online Services:");
    console.log("     - DL Printout: ₹450");
    console.log("     - License Download: ₹0 (Free)");
    console.log("     - Certificate Verification: ₹200");
  } catch (error) {
    console.error("💥 SEEDING FAILED:", error);
    console.log("\n🔍 Troubleshooting:");
    console.log(
      "   • Make sure the development server is running (npm run dev)"
    );
    console.log("   • Check Firebase configuration");
    console.log(
      "   • Try visiting http://localhost:9002/admin/services manually"
    );
    process.exit(1);
  }
}

runSeeding();
