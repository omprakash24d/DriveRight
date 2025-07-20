
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp, setDoc, where, limit } from "firebase/firestore";
import { addLog } from "./auditLogService";
import type { User as FirebaseUser } from 'firebase/auth';
import type { Course } from "./coursesService";
import { getCourse } from "./coursesService";
import type { TestResult } from "./resultsService";
import type { Certificate } from "./certificatesService";


// For admin-managed student records
export interface Student {
    id: string;
    name: string;
    email: string;
    phone: string;
    joined: Timestamp;
    avatar?: string; // Now a URL
}

// For authenticated users
export interface UserProfile {
    uid: string;
    email: string | null;
    name: string | null;
    avatar?: string; // Now a URL
    createdAt: Timestamp;
}

export interface EnrolledCourse {
    courseId: string;
    title: string;
    description: string;
    enrolledAt: Date;
}

export interface UserActivity {
    results: TestResult[];
    certificates: Certificate[];
}

const STUDENTS_COLLECTION = 'students'; // For admin panel
const USERS_COLLECTION = 'users'; // For authenticated users


// --- Functions for Authenticated Users ---

export async function createStudentUserInDb(user: FirebaseUser, name: string, avatar?: string) {
    if (!db.app) throw new Error("Firebase not initialized.");
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const userDoc = await getDoc(userRef);

    // This function creates a user profile in the 'users' collection,
    // which is separate from the admin-managed 'students' collection.
    if (!userDoc.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            name: name,
            avatar: avatar || null,
            createdAt: Timestamp.now(),
        });
    }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!db.app) return null;
    try {
        const userRef = doc(db, USERS_COLLECTION, uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
}


export async function updateUserProfile(userId: string, data: { name?: string, avatar?: string }) {
    if (!db.app) throw new Error("Firebase not initialized.");
    
    const userDocRef = doc(db, USERS_COLLECTION, userId);
    
    const firestoreUpdateData: { name?: string, avatar?: string } = {};
    if (data.name) firestoreUpdateData.name = data.name;
    // Allow setting avatar to an empty string to remove it, or updating it
    if (data.avatar !== undefined) {
      firestoreUpdateData.avatar = data.avatar;
    }

    if (Object.keys(firestoreUpdateData).length > 0) {
        await updateDoc(userDocRef, firestoreUpdateData);
    }
}


export async function enrollUserInCourse(userId: string, courseId: string): Promise<void> {
    if (!db.app) throw new Error("Firebase not initialized.");
    const course = await getCourse(courseId);
    if (!course) {
        throw new Error("Course not found, cannot enroll.");
    }
    const enrollmentRef = doc(db, USERS_COLLECTION, userId, 'enrolledCourses', course.id);
    await setDoc(enrollmentRef, {
        title: course.title,
        description: course.description,
        enrolledAt: Timestamp.now(),
    });
}

export async function isUserEnrolled(userId: string, courseId: string): Promise<boolean> {
    if (!db.app) return false;
    const enrollmentRef = doc(db, USERS_COLLECTION, userId, 'enrolledCourses', courseId);
    const docSnap = await getDoc(enrollmentRef);
    return docSnap.exists();
}

export async function getUserEnrolledCourses(userId: string): Promise<EnrolledCourse[]> {
    if (!db.app) return [];
    const enrollmentsRef = collection(db, USERS_COLLECTION, userId, 'enrolledCourses');
    const q = query(enrollmentsRef, orderBy("enrolledAt", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            courseId: doc.id,
            title: data.title,
            description: data.description,
            enrolledAt: (data.enrolledAt as Timestamp).toDate(),
        }
    });
}

// --- Functions for Admin Panel ---

// Fetch all students from Firestore
export async function getStudents(): Promise<Student[]> {
  if (!db.app) return [];
  try {
    const studentsCollection = collection(db, STUDENTS_COLLECTION);
    const q = query(studentsCollection, orderBy("name"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Student, 'id'>)
    }));
  } catch (error) {
    console.error("Error fetching students:", error);
    throw new Error("Could not fetch students from the database.");
  }
}

// Fetch a single student by ID
export async function getStudent(id: string): Promise<Student | null> {
    if (!db.app) return null;
    try {
        const docRef = doc(db, STUDENTS_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...(docSnap.data() as Omit<Student, 'id'>) };
        } else {
            console.warn(`No student document found with id: ${id}`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching student with id ${id}:`, error);
        return null;
    }
}

// Add a new student to Firestore
export async function addStudent(studentData: Omit<Student, 'id' | 'joined'>) {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const dataWithTimestamp = {
            ...studentData,
            joined: Timestamp.now(),
        };
        const docRef = await addDoc(collection(db, STUDENTS_COLLECTION), dataWithTimestamp);
        await addLog('Added Student', `Name: ${studentData.name}`);
        return docRef.id;
    } catch (error) {
        console.error("Error adding student: ", error);
        throw new Error("Could not add student to the database.");
    }
}

/**
 * Creates a student record from an enrollment approval.
 * Checks if a student with the same email already exists to prevent duplicates.
 */
export async function createStudentFromEnrollment(studentData: { name: string; email: string; phone: string; avatar?: string; }) {
    if (!db.app) throw new Error("Firebase not initialized.");
    const studentsRef = collection(db, STUDENTS_COLLECTION);
    const q = query(studentsRef, where("email", "==", studentData.email), limit(1));
    
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      console.log(`Student with email ${studentData.email} already exists.`);
      // Update existing student with avatar if it's new
      const studentDoc = querySnapshot.docs[0];
      if (studentData.avatar && !studentDoc.data().avatar) {
        await updateDoc(studentDoc.ref, { avatar: studentData.avatar });
         await addLog('Updated Student', `Avatar updated for ${studentData.name} from enrollment.`);
      }
      return studentDoc.id;
    }
    
    return addStudent(studentData);
}


// Update an existing student in Firestore
export async function updateStudent(id: string, studentData: Partial<Omit<Student, 'id' | 'joined'>>) {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = doc(db, STUDENTS_COLLECTION, id);
        await updateDoc(docRef, studentData);
        await addLog('Updated Student', `ID: ${id}`);
    } catch (error) {
        console.error("Error updating student: ", error);
        throw new Error("Could not update student in the database.");
    }
}

// Delete a student from Firestore
export async function deleteStudent(id: string): Promise<void> {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = doc(db, STUDENTS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        const studentName = docSnap.exists() ? docSnap.data().name : `ID: ${id}`;
        
        await deleteDoc(docRef);
        await addLog('Deleted Student', `Name: ${studentName}`);
    } catch (error) {
        console.error("Error deleting student: ", error);
        throw new Error("Could not delete student from the database.");
    }
}


// Seed the database with default students
export async function seedDefaultStudents(): Promise<number> {
    if (!db.app) throw new Error("Firebase not initialized.");
    const defaultStudents: Omit<Student, 'id' | 'joined'>[] = [
        { name: "Priya Sharma", email: "priya.sharma@example.com", phone: "9876543210" },
        { name: "Rahul Verma", email: "rahul.verma@example.com", phone: "9876543211" },
        { name: "Anjali Gupta", email: "anjali.gupta@example.com", phone: "9876543212" },
    ];
    try {
        const studentsCollection = collection(db, STUDENTS_COLLECTION);
        const q = query(studentsCollection, where("email", "in", defaultStudents.map(s => s.email)));
        const existingStudentsSnapshot = await getDocs(q);
        const existingEmails = new Set(existingStudentsSnapshot.docs.map(doc => doc.data().email));

        const studentsToAdd = defaultStudents.filter(student => !existingEmails.has(student.email));
        
        if (studentsToAdd.length === 0) {
            return 0; // No new students to add
        }

        const addPromises = studentsToAdd.map(studentData => addStudent(studentData));
        await Promise.all(addPromises);
        
        // A single log entry for the batch operation
        await addLog('Added Student', `Seeded ${studentsToAdd.length} default students.`);

        return studentsToAdd.length;
    } catch (error) {
        console.error("Error seeding default students:", error);
        throw new Error("Could not seed default students.");
    }
}
