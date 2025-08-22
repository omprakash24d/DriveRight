// Check and seed enhanced services data
import dotenv from "dotenv";
import { getApps, initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  setDoc,
  Timestamp,
} from "firebase/firestore";

// Load environment variables
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const sampleTrainingServices = [
  {
    id: "lmv-basic",
    title: "LMV Basic Training",
    description: "Comprehensive training for Light Motor Vehicle driving",
    shortDescription: "Basic car driving course",
    icon: "Car",
    category: "LMV",
    services: ["Theory Classes", "Practical Training", "Test Preparation"],
    duration: { value: 30, unit: "days" },
    pricing: {
      basePrice: 5000,
      currency: "INR",
      discountPrice: 4500,
      discountPercentage: 10,
      isDiscounted: true,
    },
    features: [
      "Professional Instructors",
      "Modern Vehicles",
      "Test Preparation",
    ],
    instructorRequired: true,
    maxStudents: 10,
    ctaHref: "/services/training/lmv-basic",
    ctaText: "Enroll Now",
    isActive: true,
    priority: 1,
    bookingSettings: {
      requireApproval: false,
      allowRescheduling: true,
      cancellationPolicy: "24 hours notice required",
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: "mcwg-training",
    title: "MCWG Training",
    description: "Motorcycle with Gear training program",
    shortDescription: "Motorcycle driving course",
    icon: "Bike",
    category: "MCWG",
    services: ["Theory Classes", "Practical Training", "Safety Training"],
    duration: { value: 15, unit: "days" },
    pricing: {
      basePrice: 3000,
      currency: "INR",
      discountPrice: 2700,
      discountPercentage: 10,
      isDiscounted: true,
    },
    features: ["Safety Training", "Expert Instructors", "Modern Bikes"],
    instructorRequired: true,
    maxStudents: 8,
    ctaHref: "/services/training/mcwg",
    ctaText: "Book Now",
    isActive: true,
    priority: 2,
    bookingSettings: {
      requireApproval: false,
      allowRescheduling: true,
      cancellationPolicy: "24 hours notice required",
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

const sampleOnlineServices = [
  {
    id: "license-download",
    title: "License Download",
    description: "Download your driving license digitally",
    shortDescription: "Quick license download",
    icon: "Download",
    category: "Download",
    pricing: {
      basePrice: 100,
      currency: "INR",
      isDiscounted: false,
    },
    processingTime: { value: 5, unit: "minutes" },
    deliveryMethod: "download",
    features: ["Instant Download", "Official Format", "Secure Process"],
    href: "/services/online/license-download",
    ctaText: "Download Now",
    isActive: true,
    priority: 1,
    automatedProcessing: true,
    requiresVerification: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
  {
    id: "license-verification",
    title: "License Verification",
    description: "Verify the authenticity of your driving license",
    shortDescription: "License verification service",
    icon: "Shield",
    category: "Verification",
    pricing: {
      basePrice: 50,
      currency: "INR",
      isDiscounted: false,
    },
    processingTime: { value: 2, unit: "hours" },
    deliveryMethod: "email",
    features: [
      "Quick Verification",
      "Official Response",
      "Certificate Included",
    ],
    href: "/services/online/license-verification",
    ctaText: "Verify Now",
    isActive: true,
    priority: 2,
    automatedProcessing: false,
    requiresVerification: true,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  },
];

async function checkAndSeedServices() {
  try {
    console.log("Checking enhanced services collections...");

    // Check training services
    const trainingSnapshot = await getDocs(
      collection(db, "enhancedTrainingServices")
    );
    console.log(`Training services found: ${trainingSnapshot.size}`);

    if (trainingSnapshot.empty) {
      console.log("Seeding training services...");
      for (const service of sampleTrainingServices) {
        await setDoc(doc(db, "enhancedTrainingServices", service.id), service);
        console.log(`Created training service: ${service.title}`);
      }
    }

    // Check online services
    const onlineSnapshot = await getDocs(
      collection(db, "enhancedOnlineServices")
    );
    console.log(`Online services found: ${onlineSnapshot.size}`);

    if (onlineSnapshot.empty) {
      console.log("Seeding online services...");
      for (const service of sampleOnlineServices) {
        await setDoc(doc(db, "enhancedOnlineServices", service.id), service);
        console.log(`Created online service: ${service.title}`);
      }
    }

    console.log("Service check completed successfully!");
  } catch (error) {
    console.error("Error checking/seeding services:", error);
  }
}

checkAndSeedServices();
