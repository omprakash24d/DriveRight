// Seed enhanced services with proper pricing
const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin SDK
const serviceAccount = require("./config/project-config.cjs");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const sampleTrainingServices = [
  {
    title: "Basic Driving Course",
    description: "Learn fundamental driving skills with certified instructors",
    shortDescription: "Complete beginner's driving course",
    category: "basic",
    difficulty: "beginner",
    duration: "30 days",
    isActive: true,
    priority: 1,
    features: [
      "20 hours of driving practice",
      "Traffic rules education",
      "Parking techniques",
      "Highway driving",
      "Defensive driving skills",
    ],
    pricing: {
      basePrice: 5000,
      currency: "INR",
      discountPercentage: 10,
      discountValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      taxes: {
        gst: 18,
        serviceTax: 0,
        otherCharges: 100,
      },
      finalPrice: 5508, // Will be calculated: 5000 - 10% + 18% GST + 100 charges
    },
    metadata: {
      instructorCount: 5,
      carTypes: ["Manual", "Automatic"],
      locations: ["Central Delhi", "South Delhi"],
      languages: ["Hindi", "English"],
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    title: "Advanced Driving Course",
    description: "Advanced techniques for experienced drivers",
    shortDescription: "Advanced driving skills and techniques",
    category: "advanced",
    difficulty: "intermediate",
    duration: "15 days",
    isActive: true,
    priority: 2,
    features: [
      "High-speed driving techniques",
      "Emergency braking",
      "Night driving",
      "Weather-specific driving",
      "Advanced parking methods",
    ],
    pricing: {
      basePrice: 7500,
      currency: "INR",
      discountPercentage: 0,
      taxes: {
        gst: 18,
        serviceTax: 0,
        otherCharges: 150,
      },
      finalPrice: 9000, // 7500 + 18% GST + 150 charges
    },
    metadata: {
      instructorCount: 3,
      carTypes: ["Manual", "Automatic", "Luxury"],
      locations: ["All Delhi"],
      languages: ["Hindi", "English", "Punjabi"],
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

const sampleOnlineServices = [
  {
    title: "Online Traffic Rules Course",
    description: "Learn traffic rules and regulations online",
    shortDescription: "Comprehensive online traffic education",
    category: "education",
    difficulty: "beginner",
    duration: "Self-paced",
    isActive: true,
    priority: 1,
    features: [
      "Interactive video lessons",
      "Practice tests",
      "Digital certificate",
      "24/7 access",
      "Mobile app support",
    ],
    pricing: {
      basePrice: 999,
      currency: "INR",
      discountPercentage: 20,
      discountValidUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      taxes: {
        gst: 18,
        serviceTax: 0,
        otherCharges: 0,
      },
      finalPrice: 945, // 999 - 20% + 18% GST
    },
    metadata: {
      videoCount: 25,
      testCount: 50,
      certificateIncluded: true,
      languages: ["Hindi", "English"],
      accessDuration: "Lifetime",
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    title: "Driving Test Preparation",
    description: "Online preparation for driving license test",
    shortDescription: "Mock tests and practice for driving exam",
    category: "test-prep",
    difficulty: "intermediate",
    duration: "2 weeks",
    isActive: true,
    priority: 2,
    features: [
      "Mock driving tests",
      "State-specific questions",
      "Performance analytics",
      "Expert tips and tricks",
      "Updated question bank",
    ],
    pricing: {
      basePrice: 599,
      currency: "INR",
      discountPercentage: 0,
      taxes: {
        gst: 18,
        serviceTax: 0,
        otherCharges: 50,
      },
      finalPrice: 757, // 599 + 18% GST + 50 charges
    },
    metadata: {
      questionsCount: 500,
      mockTestCount: 10,
      statesSupported: ["Delhi", "Maharashtra", "Karnataka"],
      languages: ["Hindi", "English"],
      accessDuration: "60 days",
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

async function seedEnhancedServices() {
  try {
    console.log("🌱 Seeding enhanced training services...");

    // Clear existing training services
    const trainingSnapshot = await db.collection("trainingServices").get();
    const trainingBatch = db.batch();
    trainingSnapshot.docs.forEach((doc) => {
      trainingBatch.delete(doc.ref);
    });
    await trainingBatch.commit();

    // Add new training services
    for (const service of sampleTrainingServices) {
      await db.collection("trainingServices").add(service);
    }
    console.log(`✅ Added ${sampleTrainingServices.length} training services`);

    console.log("🌱 Seeding enhanced online services...");

    // Clear existing online services
    const onlineSnapshot = await db.collection("onlineServices").get();
    const onlineBatch = db.batch();
    onlineSnapshot.docs.forEach((doc) => {
      onlineBatch.delete(doc.ref);
    });
    await onlineBatch.commit();

    // Add new online services
    for (const service of sampleOnlineServices) {
      await db.collection("onlineServices").add(service);
    }
    console.log(`✅ Added ${sampleOnlineServices.length} online services`);

    console.log("\n🎉 Enhanced services seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding enhanced services:", error);
    process.exit(1);
  }
}

seedEnhancedServices();
