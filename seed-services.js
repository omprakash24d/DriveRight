// Seed services data for testing
const {
  seedDefaultTrainingServices,
  seedDefaultOnlineServices,
} = require("./src/services/quickServicesService.ts");

async function seedServices() {
  try {
    console.log("🌱 Seeding training services...");
    const trainingCount = await seedDefaultTrainingServices();
    console.log(`✅ Added ${trainingCount} training services`);

    console.log("🌱 Seeding online services...");
    const onlineCount = await seedDefaultOnlineServices();
    console.log(`✅ Added ${onlineCount} online services`);

    console.log("\n🎉 Services seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding services:", error);
  }
}

seedServices();
