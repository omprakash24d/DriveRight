
import { fetchFromAdminAPI, isServerSide } from "@/lib/admin-utils";
import { db } from "@/lib/firebase";
import type { User as FirebaseUser } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, setDoc, Timestamp, updateDoc, where } from "firebase/firestore";
import { addLog } from "./auditLogService";
import type { Certificate } from "./certificatesService";
import { getCourse } from "./coursesService";
import type { TestResult } from "./resultsService";

// For admin dashboard - user and enrollment types
interface UserWithId {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: string;
    createdAt?: Timestamp;
}

interface EnrollmentWithId {
    id: string;
    userId: string;
    selectedCourse?: string;
    status?: string;
    createdAt?: Timestamp;
}

// For admin dashboard student list
export interface StudentBase {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    currentCourse: string;
    enrollmentStatus: string;
    enrollmentDate: Timestamp | null;
    totalEnrollments: number;
}


// For admin-managed student records
export interface Student {
    id: string;
    name: string;
    email: string;
    phone: string;
    joined: Timestamp | Date;
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
    enrolledAt: Date | Timestamp;
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
    const courseResult = await getCourse(courseId);
    if (!courseResult.success) {
        throw new Error("Course not found, cannot enroll.");
    }
    const course = courseResult.data;
    const enrollmentRef = doc(db, USERS_COLLECTION, userId, 'enrolledCourses', courseId);
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
  // If running on server side, try to use admin API first
  if (isServerSide()) {
    try {
      return await fetchFromAdminAPI('students');
    } catch (adminError) {
      // Return empty array instead of trying client SDK on server
      return [];
    }
  }
  
  // Fallback to client SDK (for client-side only)
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
    return [];
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
      return null;
    }
  } catch (error) {
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
        throw new Error("Could not update student in the database.");
    }
}

// Delete a student from Firestore (hybrid admin/client approach)
export async function deleteStudent(id: string): Promise<void> {
    try {
        // Try admin API first if we're on client side
        if (typeof window !== 'undefined') {
            try {
                const { deleteFromAdminAPI } = await import('@/lib/admin-utils');
                await deleteFromAdminAPI('students', id);
                await addLog('Deleted Student', `ID: ${id} (via admin API)`);
                return;
            } catch (adminError) {

                // Fall through to client SDK approach
            }
        } else {
            // Server-side: try admin server function
            try {
                const { deleteStudentAdmin } = await import('@/lib/admin-server-functions');
                await deleteStudentAdmin(id);
                return;
            } catch (adminError) {

                // Fall through to client SDK approach
            }
        }

        // Client SDK fallback - this will throw an error for delete operations
        // as regular users don't have delete permissions
        if (!db.app) throw new Error("Firebase not initialized.");
        
        // Attempt to delete (this will likely fail due to security rules)
        await deleteDoc(doc(db, 'students', id));
        await addLog('Deleted Student', `ID: ${id} (via client SDK)`);
        
    } catch (error) {
        if (error instanceof Error && error.message.includes('admin API delete failed: 401')) {
            throw new Error("Delete student functionality requires admin privileges");
        }
        throw new Error("Could not delete student - admin privileges required");
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
        throw new Error("Could not seed default students.");
    }
}

// Get students for admin dashboard
export async function getStudentsAdmin(): Promise<StudentBase[]> {
  // If running on server side, try to use admin API first
  if (isServerSide()) {
    try {
      return await fetchFromAdminAPI('students');
    } catch (adminError) {
      // Return empty array instead of trying client SDK on server
      return [];
    }
  }
  
  // Fallback to client SDK (for client-side only)
  if (!db.app) return [];

  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'student'),
      orderBy('createdAt', 'desc')
    );
    
    const enrollmentsQuery = query(
      collection(db, 'enrollments'),
      orderBy('createdAt', 'desc')
    );

    const [usersSnapshot, enrollmentsSnapshot] = await Promise.all([
      getDocs(usersQuery),
      getDocs(enrollmentsQuery)
    ]);

    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserWithId[];

    const enrollments = enrollmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as EnrollmentWithId[];

    // Group enrollments by user
    const enrollmentsByUser = enrollments.reduce((acc, enrollment) => {
      if (!acc[enrollment.userId]) {
        acc[enrollment.userId] = [];
      }
      acc[enrollment.userId].push(enrollment);
      return acc;
    }, {} as Record<string, EnrollmentWithId[]>);

    const students: StudentBase[] = users.map(user => {
      const userEnrollments = enrollmentsByUser[user.id] || [];
      const latestEnrollment = userEnrollments[0]; // Already sorted by createdAt desc

      return {
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        currentCourse: latestEnrollment?.selectedCourse || 'None',
        enrollmentStatus: latestEnrollment?.status || 'Not Enrolled',
        enrollmentDate: latestEnrollment?.createdAt || null,
        totalEnrollments: userEnrollments.length
      };
    });

    return students;
  } catch (error) {
    console.error('Error fetching students from client SDK:', error);
    return [];
  }
}
