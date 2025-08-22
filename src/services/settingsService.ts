
import { schoolConfig } from "@/lib/config";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ReactNode } from "react";
import { addLog } from "./auditLogService";

export interface HomepageStat {
  icon: string;
  value: string;
  label: string;
}

export interface WhyChooseUsPoint {
  icon: string;
  title: string;
  description: string;
}

// Define the shape of the settings data
export interface SiteSettings {
  siteName: ReactNode;
  schoolName: string;
  contactEmail: string;
  phone: string;
  address: string;
  whatsappNumber: string;
  adminEmails: string[];
  // Homepage fields
  homepageHeroTitle: string;
  homepageHeroSubtitle: string;
  homepageAboutTitle: string;
  homepageAboutText1: string;
  homepageAboutText2: string;
  homepageStats: HomepageStat[];
  // Section Titles
  whyChooseUsTitle: string;
  whyChooseUsSubtitle: string;
  galleryTitle: string;
  gallerySubtitle:string;
  quickServicesTitle: string;
  quickServicesSubtitle: string;
  onlineToolsTitle: string;
  onlineToolsSubtitle: string;
  videoSectionTitle: string;
  videoSectionSubtitle: string;
  ctaTitle: string;
  ctaDescription: string;
  // Developer Note
  developerNoteTitle: string;
  developerNoteText: string;
  developerAvatarUrl: string;
  // About Page
  aboutPageTitle: string;
  aboutPageSubtitle: string;
  aboutPageText1: string;
  aboutPageText2: string;
  whyChooseUsPoints: WhyChooseUsPoint[];
}

const SETTINGS_DOC_ID = 'siteConfiguration';

const defaultWhyChooseUsPoints: WhyChooseUsPoint[] = [
    {
      icon: "UserCheck",
      title: "Certified Instructors",
      description: "Our team consists of government-certified instructors with years of experience and a passion for teaching safe driving.",
    },
    {
      icon: "Car",
      title: "Modern Fleet",
      description: "Learn in a fleet of modern, dual-control vehicles that are safe, comfortable, and equipped with the latest technology.",
    },
    {
      icon: "Clock",
      title: "Flexible Scheduling",
      description: "We offer flexible class schedules, including weekends and evenings, to accommodate your busy lifestyle.",
    },
    {
      icon: "Award",
      title: "High Pass Rate",
      description: "Our structured curriculum, personalized attention, and mock tests contribute to one of the highest pass rates.",
    },
];


const defaultSettings: SiteSettings = {
    siteName: schoolConfig.name,
    schoolName: schoolConfig.name,
    contactEmail: schoolConfig.contactEmail,
    phone: schoolConfig.phone,
    address: schoolConfig.address,
    whatsappNumber: schoolConfig.whatsappNumber,
    adminEmails: (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'admin@example.com').split(',').map(e => e.trim()),
    homepageHeroTitle: "Learn to Drive with Confidence",
    homepageHeroSubtitle: "Your journey to safe and skilled driving starts here. Professional instructors, modern techniques.",
    homepageAboutTitle: "Your Path to Safe Driving",
    homepageAboutText1: "Here, our mission is to empower you with the skills and confidence to navigate the road safely. We go beyond basic instruction, offering personalized training that adapts to your learning style. Our experienced instructors and modern, dual-control vehicles create a supportive environment for you to master driving.",
    homepageAboutText2: "From our state-of-the-art facility in Roadtown, we guide you through every step of your journey—from the theory test to your final road exam. Join us and discover the freedom of driving with competence and peace of mind.",
    homepageStats: [
        { icon: "TrendingUp", value: "95%", label: "First-Attempt Pass Rate" },
        { icon: "Users", value: "5,000+", label: "Students Trained" },
        { icon: "Award", value: "10+", label: "Years of Experience" },
    ],
    whyChooseUsTitle: "Why Choose Us?",
    whyChooseUsSubtitle: "We are committed to providing the highest quality driving education to ensure you are safe and confident on the road.",
    galleryTitle: "A Glimpse Into Our School",
    gallerySubtitle: "Explore our facility, our modern fleet, and see our students in action.",
    quickServicesTitle: "Our Driving Services",
    quickServicesSubtitle: "From novice drivers to seasoned professionals, we have a course tailored for your needs.",
    onlineToolsTitle: "Online Tools & Resources",
    onlineToolsSubtitle: "Access our digital services for results, downloads, and verification.",
    videoSectionTitle: "Student Experiences & Guides",
    videoSectionSubtitle: "Watch our tutorials and hear from our successful students.",
    ctaTitle: "Ready to Get Behind the Wheel?",
    ctaDescription: "Your journey towards becoming a confident and safe driver starts with a single step. Enroll in one of our courses today!",
    developerNoteTitle: "A Note from the Developer",
    developerNoteText: "Hello! I'm Om Prakash, the developer behind this driving school portal. I've built this application using modern technologies like Next.js, Firebase, and Google's Generative AI to create a seamless and efficient experience for both students and administrators. My goal was to provide a robust, secure, and user-friendly platform. I hope you find it helpful on your journey to becoming a safe and confident driver!",
    developerAvatarUrl: "https://om.indhinditech.com/_next/image?url=%2Fimages%2Fom.jpg&w=828&q=75",
    // About Page Defaults
    aboutPageTitle: "Our Mission: Safe, Confident Driving for All",
        aboutPageSubtitle: "Discover the values and people that make Driving School Arwal the leading choice for driving education in the region.",
    aboutPageText1: "Founded over a decade ago, Our School was born from a simple yet powerful vision: to create a new generation of drivers who are not just licensed, but are truly safe, confident, and responsible on the road. We believe that learning to drive is a rite of passage, a skill that opens up a world of freedom and opportunity. It's a responsibility we take seriously.",
    aboutPageText2: "Our approach is built on a foundation of patience, expertise, and personalized instruction. We understand that every student learns differently, which is why we tailor our programs to fit your individual needs. From our modern, dual-control vehicles to our comprehensive curriculum that blends theory with extensive practical experience, every aspect of our school is designed to create a supportive and effective learning environment. Our ultimate goal is not just to help you pass your test, but to build a lifetime of safe driving habits.",
    whyChooseUsPoints: defaultWhyChooseUsPoints,
};

// Fetch settings from Firestore
export async function getSiteSettings(): Promise<SiteSettings> {
  if (!db.app) {
    console.warn("Firebase not initialized during build. Returning default settings.");
    return defaultSettings;
  }
  try {
    const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const firestoreData = docSnap.data();
      // If Firestore has adminEmails, use it. Otherwise, use defaults.
      // This is the key fix: It prioritizes the database over the .env file.
      const adminEmails = firestoreData.adminEmails && firestoreData.adminEmails.length > 0 
        ? firestoreData.adminEmails 
        : defaultSettings.adminEmails;

      return { 
        ...defaultSettings, 
        ...firestoreData,
        adminEmails,
      };
    } else {
      // If no settings doc exists, return defaults. The doc can be created from the admin panel.
      console.warn("Site settings not found in Firestore. Returning default settings.");
      return defaultSettings;
    }
  } catch (error) {
    console.error("Error fetching site settings, falling back to default static data:", error);
    // Return defaults on error
    return defaultSettings;
  }
}

// Save settings to Firestore
export async function saveSiteSettings(settings: Partial<SiteSettings>): Promise<void> {
  if (!db.app) throw new Error("Firebase not initialized.");
  const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
  // Using setDoc with merge will create the document if it doesn't exist, or update it if it does.
  await setDoc(docRef, settings, { merge: true });
  await addLog('Updated Site Settings', 'All site configuration');
}
