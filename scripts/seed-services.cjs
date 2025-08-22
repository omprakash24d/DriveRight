const admin = require("firebase-admin");
require("dotenv").config();

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.error(
      "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set"
    );
    process.exit(1);
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket:
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        "driveright-11b83.firebasestorage.app",
    });
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    process.exit(1);
  }
}

const db = admin.firestore();

const sampleTrainingServices = [
  {
    title: "LMV Basic Training",
    description:
      "Comprehensive training for Light Motor Vehicle driving with professional instructors and modern vehicles.",
    shortDescription: "Basic car driving course with certification",
    icon: "Car",
    category: "LMV",
    services: [
      "Theory Classes",
      "Practical Training",
      "Test Preparation",
      "License Support",
    ],
    duration: { value: 30, unit: "days" },
    pricing: {
      basePrice: 5000,
      currency: "INR",
      discountPrice: 4500,
      discountPercentage: 10,
      isDiscounted: true,
      discountValidUntil: admin.firestore.Timestamp.fromDate(
        new Date("2025-12-31")
      ),
    },
    features: [
      "Professional Certified Instructors",
      "Modern Well-Maintained Vehicles",
      "Comprehensive Test Preparation",
      "Flexible Scheduling",
      "License Application Support",
    ],
    prerequisites: [
      "Valid Learner's License",
      "Age 18+",
      "Medical Certificate",
    ],
    certification: "Government Approved Certificate",
    instructorRequired: true,
    maxStudents: 10,
    ctaHref: "/services/training/lmv-basic",
    ctaText: "Enroll Now",
    isActive: true,
    priority: 1,
    bookingSettings: {
      requireApproval: false,
      allowRescheduling: true,
      cancellationPolicy:
        "24 hours notice required for cancellation/rescheduling",
      advanceBookingDays: 30,
    },
    seoMetadata: {
      metaTitle: "LMV Basic Training - Professional Car Driving Course",
      metaDescription:
        "Learn car driving with our comprehensive LMV basic training course. Professional instructors, modern vehicles, and test preparation included.",
      keywords: [
        "car driving",
        "LMV training",
        "driving school",
        "license training",
      ],
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    title: "MCWG Training",
    description:
      "Complete Motorcycle with Gear training program focusing on safety and skill development.",
    shortDescription: "Professional motorcycle driving course",
    icon: "Bike",
    category: "MCWG",
    services: [
      "Theory Classes",
      "Practical Training",
      "Safety Training",
      "Traffic Rules",
    ],
    duration: { value: 15, unit: "days" },
    pricing: {
      basePrice: 3000,
      currency: "INR",
      discountPrice: 2700,
      discountPercentage: 10,
      isDiscounted: true,
      discountValidUntil: admin.firestore.Timestamp.fromDate(
        new Date("2025-12-31")
      ),
    },
    features: [
      "Expert Safety Training",
      "Professional Instructors",
      "Modern Motorcycles",
      "Protective Gear Included",
      "Traffic Rule Education",
    ],
    prerequisites: [
      "Valid Learner's License",
      "Age 16+",
      "Basic Health Certificate",
    ],
    certification: "RTO Approved Certificate",
    instructorRequired: true,
    maxStudents: 8,
    ctaHref: "/services/training/mcwg",
    ctaText: "Book Training",
    isActive: true,
    priority: 2,
    bookingSettings: {
      requireApproval: false,
      allowRescheduling: true,
      cancellationPolicy: "24 hours notice required",
      advanceBookingDays: 20,
    },
    seoMetadata: {
      metaTitle: "MCWG Training - Professional Motorcycle Driving Course",
      metaDescription:
        "Master motorcycle riding with our comprehensive MCWG training. Expert instructors, safety focus, and modern bikes.",
      keywords: [
        "motorcycle training",
        "MCWG course",
        "bike driving",
        "motorcycle license",
      ],
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

const sampleOnlineServices = [
  {
    title: "License Download",
    description:
      "Download your driving license instantly in digital format with official authentication.",
    shortDescription: "Quick and secure license download",
    icon: "Download",
    category: "Download",
    pricing: {
      basePrice: 100,
      currency: "INR",
      isDiscounted: false,
    },
    processingTime: { value: 5, unit: "minutes" },
    requiredDocuments: ["License Number", "Date of Birth", "Mobile Number"],
    deliveryMethod: "download",
    features: [
      "Instant Download",
      "Official PDF Format",
      "Secure Authentication",
      "Multiple Download Access",
      "24/7 Availability",
    ],
    href: "/services/online/license-download",
    ctaText: "Download Now",
    isActive: true,
    priority: 1,
    automatedProcessing: true,
    requiresVerification: false,
    seoMetadata: {
      metaTitle: "Download Driving License Online - Instant Digital Copy",
      metaDescription:
        "Download your driving license instantly online. Secure, official format, available 24/7.",
      keywords: [
        "license download",
        "digital license",
        "online license",
        "driving license copy",
      ],
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    title: "License Verification",
    description:
      "Verify the authenticity and validity of any driving license with official database check.",
    shortDescription: "Official license verification service",
    icon: "ShieldCheck",
    category: "Verification",
    pricing: {
      basePrice: 50,
      currency: "INR",
      isDiscounted: false,
    },
    processingTime: { value: 2, unit: "hours" },
    requiredDocuments: ["License Number", "Full Name", "Date of Birth"],
    deliveryMethod: "email",
    features: [
      "Official Database Check",
      "Detailed Verification Report",
      "Certificate of Authenticity",
      "Instant Email Delivery",
      "Legal Document Status",
    ],
    href: "/services/online/license-verification",
    ctaText: "Verify License",
    isActive: true,
    priority: 2,
    automatedProcessing: false,
    requiresVerification: true,
    seoMetadata: {
      metaTitle: "License Verification Service - Official Authentication",
      metaDescription:
        "Verify driving license authenticity with our official verification service. Get detailed reports instantly.",
      keywords: [
        "license verification",
        "license check",
        "authentic license",
        "license validation",
      ],
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    title: "License Print Service",
    description:
      "Get a high-quality printed copy of your driving license delivered to your address.",
    shortDescription: "Professional license printing service",
    icon: "Printer",
    category: "Document",
    pricing: {
      basePrice: 200,
      currency: "INR",
      discountPrice: 150,
      discountPercentage: 25,
      isDiscounted: true,
      discountValidUntil: admin.firestore.Timestamp.fromDate(
        new Date("2025-12-31")
      ),
    },
    processingTime: { value: 3, unit: "days" },
    requiredDocuments: ["License Number", "Address Proof", "Identity Proof"],
    deliveryMethod: "physical",
    features: [
      "High-Quality Printing",
      "Secure Packaging",
      "Door-to-Door Delivery",
      "Track Delivery Status",
      "Official Format",
    ],
    href: "/services/online/license-print",
    ctaText: "Order Print",
    isActive: true,
    priority: 3,
    automatedProcessing: false,
    requiresVerification: true,
    seoMetadata: {
      metaTitle: "License Print Service - Professional Document Printing",
      metaDescription:
        "Get high-quality printed copies of your driving license delivered to your door. Professional service with tracking.",
      keywords: [
        "license print",
        "license copy",
        "document printing",
        "license delivery",
      ],
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

async function seedServices() {
  try {
    console.log("🌱 Starting service seeding process...");

    // Check and seed training services
    const trainingRef = db.collection("enhancedTrainingServices");
    const trainingSnapshot = await trainingRef.get();

    console.log(`📊 Found ${trainingSnapshot.size} existing training services`);

    if (trainingSnapshot.empty) {
      console.log("🚗 Seeding training services...");
      for (const [index, service] of sampleTrainingServices.entries()) {
        const docId = `training-${index + 1}`;
        await trainingRef.doc(docId).set(service);
        console.log(`✅ Created training service: ${service.title}`);
      }
    } else {
      console.log("ℹ️  Training services already exist");
    }

    // Check and seed online services
    const onlineRef = db.collection("enhancedOnlineServices");
    const onlineSnapshot = await onlineRef.get();

    console.log(`📊 Found ${onlineSnapshot.size} existing online services`);

    if (onlineSnapshot.empty) {
      console.log("💻 Seeding online services...");
      for (const [index, service] of sampleOnlineServices.entries()) {
        const docId = `online-${index + 1}`;
        await onlineRef.doc(docId).set(service);
        console.log(`✅ Created online service: ${service.title}`);
      }
    } else {
      console.log("ℹ️  Online services already exist");
    }

    console.log("🎉 Service seeding completed successfully!");

    // Summary
    const finalTrainingCount = (await trainingRef.get()).size;
    const finalOnlineCount = (await onlineRef.get()).size;

    console.log("\n📈 Final Summary:");
    console.log(`   Training Services: ${finalTrainingCount}`);
    console.log(`   Online Services: ${finalOnlineCount}`);
    console.log(`   Total Services: ${finalTrainingCount + finalOnlineCount}`);
  } catch (error) {
    console.error("❌ Error seeding services:", error);
    process.exit(1);
  }
}

// Run the seeding
seedServices()
  .then(() => {
    console.log("✨ Seeding process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  });
