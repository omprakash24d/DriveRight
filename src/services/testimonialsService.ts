
import { db } from "@/lib/firebase";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { addLog } from "./auditLogService";

// Define the shape of the testimonial data
export interface Testimonial {
    id: string;
    name: string;
    course: string;
    quote: string;
    avatar?: string; // URL to avatar image
}

const TESTIMONIALS_COLLECTION = 'testimonials';

// Fetch all testimonials from Firestore
export async function getTestimonials(): Promise<Testimonial[]> {
  if (!db.app) {
    return [];
  }
  try {
    const testimonialsCollection = collection(db, TESTIMONIALS_COLLECTION);
    const snapshot = await getDocs(testimonialsCollection);
    
    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Testimonial, 'id'>)
    }));
  } catch (error) {
    return [];
  }
}

// Fetch a single testimonial by ID
export async function getTestimonial(id: string): Promise<Testimonial | null> {
    if (!db.app) return null;
    try {
        const docRef = doc(db, TESTIMONIALS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...(docSnap.data() as Omit<Testimonial, 'id'>) };
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

// Add a new testimonial to Firestore
export async function addTestimonial(testimonialData: Omit<Testimonial, 'id'>) {
    if (!db.app) {
        throw new Error("Database connection not available");
    }
    try {
        const docRef = await addDoc(collection(db, TESTIMONIALS_COLLECTION), testimonialData);
        await addLog('Added Testimonial', `From: ${testimonialData.name}`);
        return docRef.id;
    } catch (error) {
        throw new Error("Could not add testimonial to the database.");
    }
}

// Update an existing testimonial in Firestore
export async function updateTestimonial(id: string, testimonialData: Partial<Omit<Testimonial, 'id'>>) {
    if (!db.app) {
        throw new Error("Database connection not available");
    }
    try {
        const docRef = doc(db, TESTIMONIALS_COLLECTION, id);
        await updateDoc(docRef, testimonialData);
        await addLog('Updated Testimonial', `ID: ${id}`);
    } catch (error) {
        throw new Error("Could not update testimonial in the database.");
    }
}

// Delete a testimonial from Firestore
export async function deleteTestimonial(id: string): Promise<void> {
    if (!db.app) {
        throw new Error("Database connection not available");
    }
    try {
        const docRef = doc(db, TESTIMONIALS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        const testimonialName = docSnap.exists() ? docSnap.data().name : `ID: ${id}`;
        
        await deleteDoc(docRef);
        await addLog('Deleted Testimonial', `From: ${testimonialName}`);
    } catch (error) {
        throw new Error("Could not delete testimonial from the database.");
    }
}

// Seed the database with default testimonials
export async function seedDefaultTestimonials(): Promise<number> {
    if (!db.app) {
        return 0;
    }
    const defaultTestimonials: Omit<Testimonial, 'id'>[] = [
      {
        name: "Rohan Kumar",
        course: "LMV License Course",
        quote: "The instructors at Driving School Arwal are incredibly patient and knowledgeable. They teach from the basics and never get frustrated. I felt comfortable behind the wheel and passed my test on the first try! The facilities are great too, with enough space to learn driving, parking, and hill hold.",
      },
      {
        name: "Abhishek Roy",
        course: "Motorcycle (MCWG) Course",
        quote: "A fantastic experience! The thorough curriculum covered safety and practical skills, and I enjoyed trying out multiple bikes. Highly recommend for new riders!",
      },
      {
        name: "Manikant",
        course: "Refresher Course",
        quote: "After years of not driving, I was very nervous. The refresher course was exactly what I needed to regain my confidence. My supportive instructor tailored the lessons to my needs, and the simulator was a great way to practice before hitting the road. At the end, they took me out on the actual roads to familiarize me with real driving conditions, and I practiced on the RTO-style 8 route before my driving test.",
      },
    ];
    try {
        const testimonialsCollection = collection(db, TESTIMONIALS_COLLECTION);
        const q = query(testimonialsCollection, where("name", "in", defaultTestimonials.map(t => t.name)));
        const existingSnapshot = await getDocs(q);
        const existingNames = new Set(existingSnapshot.docs.map(doc => doc.data().name));
        
        const toAdd = defaultTestimonials.filter(t => !existingNames.has(t.name));

        if (toAdd.length === 0) {
            return 0; // No new testimonials to add
        }

        const addPromises = toAdd.map(data => {
            return addDoc(collection(db, TESTIMONIALS_COLLECTION), data);
        });

        await Promise.all(addPromises);
        await addLog('Added Testimonial', `Seeded ${toAdd.length} default testimonials`);
        
        return toAdd.length;
    } catch (error) {
        throw new Error("Could not seed default testimonials.");
    }
}
