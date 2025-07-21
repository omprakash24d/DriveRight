
import { db } from "@/lib/firebase";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { addLog } from "./auditLogService";

// Define the shape of the instructor data
export interface Instructor {
    id: string;
    name: string;
    experience: string;
    specialties: string; // Storing as a comma-separated string for simplicity in the form
    bio: string;
    avatar?: string; // URL to avatar image
}

const INSTRUCTORS_COLLECTION = 'instructors';

// Fetch all instructors from Firestore
export async function getInstructors(): Promise<Instructor[]> {
  if (!db.app) {
    console.warn("Firebase not initialized during build. Returning empty instructors array.");
    return [];
  }
  try {
    const instructorsCollection = collection(db, INSTRUCTORS_COLLECTION);
    const q = query(instructorsCollection, orderBy("name"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Instructor, 'id'>)
    }));
  } catch (error) {
    console.error("Error fetching instructors:", error);
    return [];
  }
}

// Fetch a single instructor by ID
export async function getInstructor(id: string): Promise<Instructor | null> {
    if (!db.app) return null;
    try {
        const docRef = doc(db, INSTRUCTORS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...(docSnap.data() as Omit<Instructor, 'id'>) };
        } else {
            console.log("No such instructor document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching instructor:", error);
        return null;
    }
}

// Add a new instructor to Firestore
export async function addInstructor(instructorData: Omit<Instructor, 'id'>) {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = await addDoc(collection(db, INSTRUCTORS_COLLECTION), instructorData);
        await addLog('Added Instructor', `Name: ${instructorData.name}`);
        return docRef.id;
    } catch (error) {
        console.error("Error adding instructor: ", error);
        throw new Error("Could not add instructor to the database.");
    }
}

// Update an existing instructor in Firestore
export async function updateInstructor(id: string, instructorData: Partial<Omit<Instructor, 'id'>>) {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = doc(db, INSTRUCTORS_COLLECTION, id);
        await updateDoc(docRef, instructorData);
        await addLog('Updated Instructor', `ID: ${id}`);
    } catch (error) {
        console.error("Error updating instructor: ", error);
        throw new Error("Could not update instructor in the database.");
    }
}

// Delete an instructor from Firestore (hybrid admin/client approach)
export async function deleteInstructor(id: string): Promise<void> {
    try {
        // Try admin API first if we're on client side
        if (typeof window !== 'undefined') {
            try {
                const { deleteFromAdminAPI } = await import('@/lib/admin-utils');
                await deleteFromAdminAPI('instructors', id);
                return;
            } catch (adminError) {
                console.log('Admin API not available, falling back to client SDK');
                // Fall through to client SDK approach
            }
        } else {
            // Server-side: try admin server function
            try {
                const { deleteInstructorAdmin } = await import('@/lib/admin-server-functions');
                await deleteInstructorAdmin(id);
                return;
            } catch (adminError) {
                console.log('Admin server function failed, falling back to client SDK');
                // Fall through to client SDK approach
            }
        }

        // Client SDK fallback
        if (!db.app) throw new Error("Firebase not initialized.");
        const docRef = doc(db, INSTRUCTORS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        const instructorName = docSnap.exists() ? docSnap.data().name : `ID: ${id}`;
        
        await deleteDoc(docRef);
        await addLog('Deleted Instructor', `Name: ${instructorName}`);
    } catch (error) {
        console.error("Error deleting instructor: ", error);
        throw new Error("Could not delete instructor from the database.");
    }
}

// Seed the database with default instructors
export async function seedDefaultInstructors(): Promise<number> {
    if (!db.app) throw new Error("Firebase not initialized.");
    const defaultInstructors: Omit<Instructor, 'id'>[] = [
      {
        name: "Om Prakash",
        experience: "20+ Years",
        specialties: "HMV, Defensive Driving, Night Driving",
        bio: "With over two decades of experience, Mr. Om Prakash is our most senior instructor, specializing in heavy motor vehicles and advanced defensive driving techniques.",
      },
      {
        name: "Rajnish Kumar",
        experience: "12+ Years",
        specialties: "LMV, City Traffic Navigation, Parking",
        bio: "Rajnish is an expert in navigating dense city traffic. He has a calm and patient teaching style, making him perfect for new drivers learning to handle LMV.",
      },
      {
        name: "Nitish Kumar",
        experience: "10+ Years",
        specialties: "MCWG, Advanced Two-Wheeler Control",
        bio: "A passionate biker, Nitish excels in teaching motorcycle control and safety. He focuses on building confidence and skill for both new and experienced riders.",
      },
      {
        name: "Anish Kumar",
        experience: "8+ Years",
        specialties: "LMV, Refresher Courses, Fuel Efficiency",
        bio: "Anish is known for his friendly approach and specializes in refresher courses for licensed drivers. He also teaches techniques for maximizing fuel efficiency.",
      }
    ];

    try {
        const instructorsCollection = collection(db, INSTRUCTORS_COLLECTION);
        const q = query(instructorsCollection, where("name", "in", defaultInstructors.map(i => i.name)));
        const existingInstructorsSnapshot = await getDocs(q);
        const existingNames = new Set(existingInstructorsSnapshot.docs.map(doc => doc.data().name));
        
        const instructorsToAdd = defaultInstructors.filter(instructor => !existingNames.has(instructor.name));

        if (instructorsToAdd.length === 0) {
            return 0; // No new instructors to add
        }

        const addPromises = instructorsToAdd.map(instructorData => {
            return addDoc(collection(db, INSTRUCTORS_COLLECTION), instructorData);
        });

        await Promise.all(addPromises);
        await addLog('Added Instructor', `Seeded ${instructorsToAdd.length} default instructors`);
        
        return instructorsToAdd.length;
    } catch (error) {
        console.error("Error seeding default instructors: ", error);
        throw new Error("Could not seed default instructors.");
    }
}
