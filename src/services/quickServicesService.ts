
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, addDoc, doc, getDoc, updateDoc, deleteDoc, where } from "firebase/firestore";
import { addLog } from "./auditLogService";

// --- Base and Discriminated Union Types ---
type BaseService = {
    id: string;
    title: string;
    description: string;
    icon: string; // Keep as string for flexibility with iconMap
};

export type TrainingService = BaseService & {
    ctaHref: string;
    ctaText: string;
    services: string[];
};

export type OnlineService = BaseService & {
    href: string;
    ctaText: string;
};


const TRAINING_SERVICES_COLLECTION = 'trainingServices';
const ONLINE_SERVICES_COLLECTION = 'onlineServices';


// --- Training Services ---

export async function getTrainingServices(): Promise<TrainingService[]> {
  if (!db.app) {
    console.warn("Firebase not initialized during build. Returning empty training services array.");
    return [];
  }
  try {
    const servicesCollection = collection(db, TRAINING_SERVICES_COLLECTION);
    const snapshot = await getDocs(servicesCollection);

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<TrainingService, 'id'>)
    }));
  } catch (error) {
    console.error("Error fetching training services, returning empty array:", error);
    return [];
  }
}

export async function getTrainingService(id: string): Promise<TrainingService | null> {
    if (!db.app) return null;
    try {
        const docRef = doc(db, TRAINING_SERVICES_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as TrainingService : null;
    } catch (error) {
        console.error("Error fetching training service:", error);
        throw new Error("Could not fetch training service.");
    }
}

export async function addTrainingService(serviceData: Omit<TrainingService, 'id'>) {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = await addDoc(collection(db, TRAINING_SERVICES_COLLECTION), serviceData);
        await addLog('Added Training Service', `Title: ${serviceData.title}`);
        return docRef.id;
    } catch (error) {
        console.error("Error adding training service: ", error);
        throw new Error("Could not add training service.");
    }
}

export async function updateTrainingService(id: string, serviceData: Partial<Omit<TrainingService, 'id'>>) {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = doc(db, TRAINING_SERVICES_COLLECTION, id);
        await updateDoc(docRef, serviceData);
        await addLog('Updated Training Service', `ID: ${id}`);
    } catch (error) {
        console.error("Error updating training service: ", error);
        throw new Error("Could not update training service.");
    }
}

export async function deleteTrainingService(id: string): Promise<void> {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = doc(db, TRAINING_SERVICES_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        const title = docSnap.exists() ? docSnap.data().title : `ID: ${id}`;
        await deleteDoc(docRef);
        await addLog('Deleted Training Service', `Title: ${title}`);
    } catch (error) {
        console.error("Error deleting training service: ", error);
        throw new Error("Could not delete training service.");
    }
}


export async function seedDefaultTrainingServices(): Promise<number> {
    if (!db.app) throw new Error("Firebase not initialized.");
    const defaultTrainingServices: Omit<TrainingService, 'id'>[] = [
      {
        icon: "Truck",
        title: "Heavy Motor Training",
        description: "Comprehensive training for heavy vehicles including trucks and buses, preparing you for professional driving.",
        services: [
          "New Enrollment",
          "HMV Training Only",
          "Refresher Course",
          "License Renewal",
        ],
        ctaText: "Enroll in HMV",
        ctaHref: "/enroll?vehicleType=hmv"
      },
      {
        icon: "Car",
        title: "LMV Training",
        description: "Everything you need to get your Light Motor Vehicle license, from learning to test.",
        services: [
            "New Enrollment",
            "LMV Training",
            "LMV Learning",
            "LMV Driving License",
        ],
        ctaText: "Enroll in LMV",
        ctaHref: "/enroll?vehicleType=lmv"
      },
      {
        icon: "Bike",
        title: "Motorcycle Training",
        description: "Specialized training for two-wheelers, focusing on balance, safety, and traffic navigation.",
        services: [
          "MCWG New Application",
          "Balance & Control",
          "Safety Protocols",
          "On-road Practice",
        ],
        ctaText: "Enroll in MCWG",
        ctaHref: "/enroll?vehicleType=mcwg"
      },
    ];

    try {
        const servicesCollection = collection(db, TRAINING_SERVICES_COLLECTION);
        const q = query(servicesCollection, where("title", "in", defaultTrainingServices.map(s => s.title)));
        const existingServicesSnapshot = await getDocs(q);
        const existingTitles = new Set(existingServicesSnapshot.docs.map(doc => doc.data().title));
        
        const servicesToAdd = defaultTrainingServices.filter(service => !existingTitles.has(service.title));

        if (servicesToAdd.length === 0) {
            return 0;
        }

        const addPromises = servicesToAdd.map(serviceData => {
            return addDoc(collection(db, TRAINING_SERVICES_COLLECTION), serviceData);
        });

        await Promise.all(addPromises);
        await addLog('Added Training Service', `Seeded ${servicesToAdd.length} default training services.`);
        
        return servicesToAdd.length;
    } catch (error) {
        console.error("Error seeding default training services: ", error);
        throw new Error("Could not seed default training services.");
    }
}

// --- Online Services ---

export async function getOnlineServices(): Promise<OnlineService[]> {
    if (!db.app) {
      console.warn("Firebase not initialized during build. Returning empty online services array.");
      return [];
    }
    try {
      const servicesCollection = collection(db, ONLINE_SERVICES_COLLECTION);
      const snapshot = await getDocs(servicesCollection);
  
      if (snapshot.empty) {
        return [];
      }
  
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<OnlineService, 'id'>)
      }));
    } catch (error) {
      console.error("Error fetching online services, returning empty array:", error);
      return [];
    }
}


export async function getOnlineService(id: string): Promise<OnlineService | null> {
    if (!db.app) return null;
    try {
        const docRef = doc(db, ONLINE_SERVICES_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as OnlineService : null;
    } catch (error) {
        console.error("Error fetching online service:", error);
        throw new Error("Could not fetch online service.");
    }
}

export async function addOnlineService(serviceData: Omit<OnlineService, 'id'>) {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = await addDoc(collection(db, ONLINE_SERVICES_COLLECTION), serviceData);
        await addLog('Added Online Service', `Title: ${serviceData.title}`);
        return docRef.id;
    } catch (error) {
        console.error("Error adding online service: ", error);
        throw new Error("Could not add online service.");
    }
}

export async function updateOnlineService(id: string, serviceData: Partial<Omit<OnlineService, 'id'>>) {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = doc(db, ONLINE_SERVICES_COLLECTION, id);
        await updateDoc(docRef, serviceData);
        await addLog('Updated Online Service', `ID: ${id}`);
    } catch (error) {
        console.error("Error updating online service: ", error);
        throw new Error("Could not update online service.");
    }
}

export async function deleteOnlineService(id: string): Promise<void> {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = doc(db, ONLINE_SERVICES_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        const title = docSnap.exists() ? docSnap.data().title : `ID: ${id}`;
        await deleteDoc(docRef);
        await addLog('Deleted Online Service', `Title: ${title}`);
    } catch (error) {
        console.error("Error deleting online service: ", error);
        throw new Error("Could not delete online service.");
    }
}


export async function seedDefaultOnlineServices(): Promise<number> {
    if (!db.app) throw new Error("Firebase not initialized.");
    const defaultOnlineServices: Omit<OnlineService, 'id'>[] = [
      {
        icon: "FileCheck2",
        title: "Learning License Exam Pass",
        description: "Get your LL test passed online. Enter your application number, DOB, and phone to have our team assist you.",
        ctaText: "Check LL Status",
        href: "/ll-exam-pass",
      },
      {
        icon: "Printer",
        title: "Driving License Print",
        description: "Request a print-ready copy of your official driving license via email for any class of vehicle.",
        ctaText: "Request License Print",
        href: "/license-print",
      },
      {
        icon: "Download",
        title: "Certificate Download",
        description: "Passed your test? Download your official driving school document here.",
        ctaText: "Download Certificate",
        href: "/certificate/download",
      },
      {
        icon: "BadgeCheck",
        title: "Verify Certificate",
        description: "Verify the authenticity of any certificate issued by Driving School Arwal.",
        ctaText: "Verify Certificate",
        href: "/certificate/verify",
      },
    ];

    try {
        const servicesCollection = collection(db, ONLINE_SERVICES_COLLECTION);
        const q = query(servicesCollection, where("title", "in", defaultOnlineServices.map(s => s.title)));
        const existingServicesSnapshot = await getDocs(q);
        const existingTitles = new Set(existingServicesSnapshot.docs.map(doc => doc.data().title));
        
        const servicesToAdd = defaultOnlineServices.filter(service => !existingTitles.has(service.title));

        if (servicesToAdd.length === 0) {
            return 0;
        }

        const addPromises = servicesToAdd.map(serviceData => {
            return addDoc(collection(db, ONLINE_SERVICES_COLLECTION), serviceData);
        });

        await Promise.all(addPromises);
        await addLog('Added Online Service', `Seeded ${servicesToAdd.length} default online services.`);
        
        return servicesToAdd.length;
    } catch (error) {
        console.error("Error seeding default online services: ", error);
        throw new Error("Could not seed default online services.");
    }
}
