// Direct Firebase seeding script
require("dotenv").config();
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  getDocs,
} = require("firebase/firestore");

// Firebase configuration - using the same config as your app
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyAWm5qT1K5w8OvLj8o_bDFJKEgNtdZQ1JE",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "drive-right-43b3b.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "drive-right-43b3b",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "drive-right-43b3b.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data with your exact pricing
const enhancedTrainingServices = [
  {
    name: "LMV Training",
    description: "Light Motor Vehicle driving training course",
    price: 6000,
    duration: "30 days",
    includes: [
      "Theory Classes",
      "Practical Training",
      "Mock Test",
      "License Support",
    ],
    category: "training",
    subcategory: "vehicle",
    isActive: true,
    vehicleType: "LMV",
    createdAt: new Date(),
    updatedAt: new Date(),
    features: [
      "Expert instructors",
      "Dual control vehicles",
      "Free pickup and drop",
      "Certificate provided",
    ],
    popularity: 95,
    rating: 4.8,
    maxStudents: 10,
    ageRequirement: "18+",
  },
  {
    name: "HMV Training",
    description: "Heavy Motor Vehicle driving training course",
    price: 11000,
    duration: "45 days",
    includes: [
      "Theory Classes",
      "Practical Training",
      "Mock Test",
      "License Support",
      "Advanced Maneuvering",
    ],
    category: "training",
    subcategory: "vehicle",
    isActive: true,
    vehicleType: "HMV",
    createdAt: new Date(),
    updatedAt: new Date(),
    features: [
      "Professional HMV instructors",
      "Commercial vehicle training",
      "Job placement assistance",
      "Advanced safety training",
    ],
    popularity: 85,
    rating: 4.7,
    maxStudents: 8,
    ageRequirement: "21+",
  },
  {
    name: "MCWG Training",
    description: "Motor Cycle With Gear training course",
    price: 5000,
    duration: "20 days",
    includes: [
      "Theory Classes",
      "Practical Training",
      "Traffic Rules",
      "Safety Training",
    ],
    category: "training",
    subcategory: "vehicle",
    isActive: true,
    vehicleType: "MCWG",
    createdAt: new Date(),
    updatedAt: new Date(),
    features: [
      "Motorcycle training",
      "Gear handling",
      "Traffic navigation",
      "Safety equipment included",
    ],
    popularity: 90,
    rating: 4.6,
    maxStudents: 12,
    ageRequirement: "18+",
  },
  {
    name: "Refresher Course",
    description: "Refresher driving course for existing license holders",
    price: 3500,
    duration: "15 days",
    includes: [
      "Confidence Building",
      "Updated Traffic Rules",
      "Practical Sessions",
    ],
    category: "training",
    subcategory: "refresher",
    isActive: true,
    vehicleType: "All",
    createdAt: new Date(),
    updatedAt: new Date(),
    features: [
      "Confidence building",
      "Latest traffic rules",
      "Personalized training",
      "Flexible timings",
    ],
    popularity: 75,
    rating: 4.5,
    maxStudents: 15,
    ageRequirement: "18+",
  },
];

const enhancedOnlineServices = [
  {
    name: "DL Printout",
    description: "Digital driving license printout service",
    price: 450,
    duration: "Instant",
    includes: ["Digital Copy", "Physical Printout", "Home Delivery"],
    category: "online",
    subcategory: "document",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    features: [
      "Instant processing",
      "High-quality print",
      "Home delivery available",
      "Digital backup",
    ],
    popularity: 95,
    rating: 4.9,
    processingTime: "Same day",
    deliveryOptions: ["Home", "Office", "Digital"],
  },
  {
    name: "License Download",
    description: "Digital license download service - completely free",
    price: 0,
    duration: "Instant",
    includes: ["Digital Download", "PDF Format", "Email Delivery"],
    category: "online",
    subcategory: "document",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    features: [
      "Completely free",
      "Instant download",
      "PDF format",
      "Email delivery",
    ],
    popularity: 100,
    rating: 5.0,
    processingTime: "Instant",
    deliveryOptions: ["Email", "Download"],
  },
  {
    name: "Certificate Verification",
    description: "Verify driving certificates and licenses",
    price: 200,
    duration: "24 hours",
    includes: [
      "Verification Report",
      "Digital Certificate",
      "Authenticity Check",
    ],
    category: "online",
    subcategory: "verification",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    features: [
      "Official verification",
      "Authenticity guarantee",
      "Digital certificate",
      "Fast processing",
    ],
    popularity: 80,
    rating: 4.7,
    processingTime: "24 hours",
    deliveryOptions: ["Email", "Download"],
  },
];

const testimonials = [
  {
    name: "Rajesh Kumar",
    course: "LMV Training",
    rating: 5,
    comment: "Excellent training! Got my license on first attempt.",
    date: new Date(),
    image: "/images/testimonials/rajesh.jpg",
    verified: true,
  },
  {
    name: "Priya Singh",
    course: "HMV Training",
    rating: 5,
    comment: "Professional instructors and great facilities.",
    date: new Date(),
    image: "/images/testimonials/priya.jpg",
    verified: true,
  },
  {
    name: "Amit Sharma",
    course: "MCWG Training",
    rating: 4,
    comment: "Good training program. Learned a lot about road safety.",
    date: new Date(),
    image: "/images/testimonials/amit.jpg",
    verified: true,
  },
];

const students = [
  {
    name: "Rohit Verma",
    course: "LMV Training",
    enrollmentDate: new Date(),
    status: "Active",
    phone: "9876543210",
    email: "rohit@example.com",
    progress: 75,
  },
  {
    name: "Sneha Patel",
    course: "HMV Training",
    enrollmentDate: new Date(),
    status: "Completed",
    phone: "9876543211",
    email: "sneha@example.com",
    progress: 100,
  },
  {
    name: "Vikash Singh",
    course: "MCWG Training",
    enrollmentDate: new Date(),
    status: "Active",
    phone: "9876543212",
    email: "vikash@example.com",
    progress: 60,
  },
];

const instructors = [
  {
    name: "Ramesh Gupta",
    specialization: "LMV & HMV",
    experience: "15 years",
    phone: "9876543213",
    email: "ramesh@driveright.com",
    rating: 4.8,
    totalStudents: 500,
    isActive: true,
  },
  {
    name: "Sunita Sharma",
    specialization: "MCWG & Refresher",
    experience: "10 years",
    phone: "9876543214",
    email: "sunita@driveright.com",
    rating: 4.9,
    totalStudents: 350,
    isActive: true,
  },
  {
    name: "Manoj Kumar",
    specialization: "All Vehicles",
    experience: "12 years",
    phone: "9876543215",
    email: "manoj@driveright.com",
    rating: 4.7,
    totalStudents: 400,
    isActive: true,
  },
];

async function seedData() {
  console.log("🌱 Starting comprehensive database seeding...");
  console.log("=".repeat(60));

  const results = {
    enhancedTrainingServices: 0,
    enhancedOnlineServices: 0,
    testimonials: 0,
    students: 0,
    instructors: 0,
    errors: [],
  };

  try {
    // Seed Enhanced Training Services
    console.log("📚 Seeding Enhanced Training Services...");
    for (const service of enhancedTrainingServices) {
      try {
        await addDoc(collection(db, "enhancedTrainingServices"), service);
        results.enhancedTrainingServices++;
        console.log(`   ✓ Added: ${service.name} (₹${service.price})`);
      } catch (error) {
        results.errors.push(
          `Training Service ${service.name}: ${error.message}`
        );
      }
    }

    // Seed Enhanced Online Services
    console.log("\n💻 Seeding Enhanced Online Services...");
    for (const service of enhancedOnlineServices) {
      try {
        await addDoc(collection(db, "enhancedOnlineServices"), service);
        results.enhancedOnlineServices++;
        console.log(`   ✓ Added: ${service.name} (₹${service.price})`);
      } catch (error) {
        results.errors.push(`Online Service ${service.name}: ${error.message}`);
      }
    }

    // Seed Testimonials
    console.log("\n💬 Seeding Testimonials...");
    for (const testimonial of testimonials) {
      try {
        await addDoc(collection(db, "testimonials"), testimonial);
        results.testimonials++;
        console.log(`   ✓ Added testimonial from: ${testimonial.name}`);
      } catch (error) {
        results.errors.push(
          `Testimonial ${testimonial.name}: ${error.message}`
        );
      }
    }

    // Seed Students
    console.log("\n👨‍🎓 Seeding Students...");
    for (const student of students) {
      try {
        await addDoc(collection(db, "students"), student);
        results.students++;
        console.log(`   ✓ Added student: ${student.name}`);
      } catch (error) {
        results.errors.push(`Student ${student.name}: ${error.message}`);
      }
    }

    // Seed Instructors
    console.log("\n👨‍🏫 Seeding Instructors...");
    for (const instructor of instructors) {
      try {
        await addDoc(collection(db, "instructors"), instructor);
        results.instructors++;
        console.log(`   ✓ Added instructor: ${instructor.name}`);
      } catch (error) {
        results.errors.push(`Instructor ${instructor.name}: ${error.message}`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ SEEDING COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(60));

    console.log("\n📈 Results Summary:");
    console.log(
      `   Enhanced Training Services: ${results.enhancedTrainingServices}`
    );
    console.log(
      `   Enhanced Online Services: ${results.enhancedOnlineServices}`
    );
    console.log(`   Testimonials: ${results.testimonials}`);
    console.log(`   Students: ${results.students}`);
    console.log(`   Instructors: ${results.instructors}`);

    if (results.errors.length > 0) {
      console.log("\n⚠️ Some operations had issues:");
      results.errors.forEach((error, index) => {
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
    console.log("   • Check Firebase configuration");
    console.log("   • Ensure internet connectivity");
    console.log("   • Verify Firebase project permissions");
    process.exit(1);
  }
}

seedData();
