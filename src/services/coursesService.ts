'use server';

import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { z } from 'zod';
import { addLog } from "./auditLogService";

// Constants
const COLLECTIONS = {
  COURSES: 'courses',
  LOCKS: 'locks'
} as const;

const ERROR_MESSAGES = {
  FIREBASE_NOT_INITIALIZED: "Firebase not initialized.",
  COURSE_ADD_FAILED: "Could not add course to the database.",
  COURSE_UPDATE_FAILED: "Could not update course in the database.",
  COURSE_DELETE_FAILED: "Could not delete course from the database.",
  COURSE_NOT_FOUND: "Course not found.",
  FETCH_FAILED: "Failed to fetch courses.",
  ADD_FAILED: "Failed to add course.",
  UPDATE_FAILED: "Failed to update course.",
  DELETE_FAILED: "Failed to delete course.",
  SEARCH_FAILED: "Failed to search courses.",
  SEED_FAILED: "Failed to seed default courses.",
  INVALID_INPUT: "Invalid input provided."
} as const;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Zod schemas for validation
const AttachmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  url: z.string().url()
});

const LessonSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  videoUrl: z.string().min(1),
  description: z.string().min(1).max(1000),
  attachments: z.array(AttachmentSchema).default([])
});

const ModuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  lessons: z.array(LessonSchema).default([])
});

const CourseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  price: z.string().min(1),
  value: z.string().regex(/^[a-z]+$/, "Value must contain only lowercase letters"),
  icon: z.string().min(1),
  modules: z.array(ModuleSchema).optional().default([]),
  isDeleted: z.boolean().optional().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().optional()
});

// TypeScript types derived from schemas
export type Attachment = z.infer<typeof AttachmentSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Course = z.infer<typeof CourseSchema>;

// Result types for better error handling
export type CourseResult = 
  | { success: true; data: Course[] }
  | { success: false; error: string };

export type CourseOperationResult = 
  | { success: true; data: Course }
  | { success: false; error: string };

// In-memory cache for courses
const courseCache = new Map<string, { data: Course; timestamp: number }>();
const coursesListCache: { data: Course[] | null; timestamp: number } = { data: null, timestamp: 0 };

// Helper function to clear cache
function clearCache(courseId?: string) {
  if (courseId) {
    courseCache.delete(courseId);
  } else {
    courseCache.clear();
  }
  coursesListCache.data = null;
  coursesListCache.timestamp = 0;
}

// Helper function to validate Firebase initialization
function validateFirebaseInit(): void {
  if (!db.app) {
    throw new Error(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED);
  }
}

// Helper function to handle Firestore errors
function handleFirestoreError(error: unknown, operation: string): never {
  console.error(`Error ${operation}:`, error);
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  throw new Error(`${operation} failed: ${message}`);
}

// Fetch all courses from Firestore with caching
export async function getCourses(): Promise<CourseResult> {
  try {
    // Check cache first
    if (coursesListCache.data && Date.now() - coursesListCache.timestamp < CACHE_TTL) {
      return { success: true, data: coursesListCache.data };
    }

    if (!db.app) {
      console.warn("Firebase not initialized during build. Returning empty courses array.");
      return { success: true, data: [] };
    }

    const coursesCollection = collection(db, COLLECTIONS.COURSES);
    const q = query(coursesCollection, orderBy("title"));
    const snapshot = await getDocs(q);

    const courses: Course[] = snapshot.empty ? [] : snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Course, 'id'>)
    }));

    // Update cache
    coursesListCache.data = courses;
    coursesListCache.timestamp = Date.now();

    return { success: true, data: courses };
  } catch (error) {
    console.error("Error fetching courses:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : ERROR_MESSAGES.FETCH_FAILED 
    };
  }
}

// Fetch paginated courses
export async function getCoursesPaginated(limitNum: number = 10, startAfterId?: string): Promise<CourseResult> {
  try {
    validateFirebaseInit();

    const coursesCollection = collection(db, COLLECTIONS.COURSES);
    let q = query(coursesCollection, orderBy("title"), limit(limitNum));
    
    if (startAfterId) {
      const startAfterDoc = await getDoc(doc(db, COLLECTIONS.COURSES, startAfterId));
      if (startAfterDoc.exists()) {
        q = query(coursesCollection, orderBy("title"), startAfter(startAfterDoc), limit(limitNum));
      }
    }

    const snapshot = await getDocs(q);
    const courses: Course[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Course, 'id'>)
    }));

    return { success: true, data: courses };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : ERROR_MESSAGES.FETCH_FAILED 
    };
  }
}

// Fetch a single course by ID with caching
export async function getCourse(id: string): Promise<CourseOperationResult> {
  try {
    // Input validation
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Invalid course ID provided' };
    }

    // Check cache first
    const cached = courseCache.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { success: true, data: cached.data };
    }

    validateFirebaseInit();

    const docRef = doc(db, COLLECTIONS.COURSES, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Course not found' };
    }

    const course: Course = { 
      id: docSnap.id, 
      ...(docSnap.data() as Omit<Course, 'id'>) 
    };

    // Update cache
    courseCache.set(id, { data: course, timestamp: Date.now() });

    return { success: true, data: course };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : ERROR_MESSAGES.FETCH_FAILED 
    };
  }
}

// Search courses by title
export async function searchCourses(searchTerm: string): Promise<CourseResult> {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return { success: false, error: 'Search term must be at least 2 characters long' };
    }

    validateFirebaseInit();

    const coursesCollection = collection(db, COLLECTIONS.COURSES);
    const q = query(
      coursesCollection,
      where("title", ">=", searchTerm),
      where("title", "<=", searchTerm + '\uf8ff'),
      orderBy("title")
    );
    
    const snapshot = await getDocs(q);
    const courses: Course[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Course, 'id'>)
    }));

    return { success: true, data: courses };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : ERROR_MESSAGES.SEARCH_FAILED 
    };
  }
}

// Add a new course to Firestore with validation
export async function addCourse(courseData: Omit<Course, 'id'>): Promise<CourseOperationResult> {
  try {
    // Validate input data
    const validatedData = CourseSchema.omit({ id: true }).parse(courseData);
    
    validateFirebaseInit();

    const dataToSave = { 
      ...validatedData, 
      modules: validatedData.modules || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.COURSES), dataToSave);
    
    const newCourse: Course = { id: docRef.id, ...validatedData };
    
    // Clear cache
    clearCache();
    
    await addLog('Added Course', `Title: ${validatedData.title}, ID: ${docRef.id}`);
    
    return { success: true, data: newCourse };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validation failed: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : ERROR_MESSAGES.ADD_FAILED 
    };
  }
}

// Update an existing course in Firestore
export async function updateCourse(
  id: string, 
  courseData: Partial<Omit<Course, 'id'>>
): Promise<CourseOperationResult> {
  try {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Invalid course ID provided' };
    }

    // Validate partial data
    const validatedData = CourseSchema.omit({ id: true }).partial().parse(courseData);
    
    validateFirebaseInit();

    const docRef = doc(db, COLLECTIONS.COURSES, id);
    
    // Check if course exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return { success: false, error: 'Course not found' };
    }

    const updateData = {
      ...validatedData,
      updatedAt: new Date().toISOString()
    };

    await updateDoc(docRef, updateData);
    
    // Get updated course
    const updatedDocSnap = await getDoc(docRef);
    const updatedCourse: Course = {
      id: updatedDocSnap.id,
      ...(updatedDocSnap.data() as Omit<Course, 'id'>)
    };
    
    // Clear cache
    clearCache(id);
    
    await addLog('Updated Course', `ID: ${id}, Title: ${updatedCourse.title}`);
    
    return { success: true, data: updatedCourse };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: `Validation failed: ${error.errors.map(e => e.message).join(', ')}` };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : ERROR_MESSAGES.UPDATE_FAILED 
    };
  }
}

// Soft delete a course (mark as deleted instead of removing)
export async function softDeleteCourse(id: string): Promise<CourseOperationResult> {
  try {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Invalid course ID provided' };
    }

    validateFirebaseInit();

    const docRef = doc(db, COLLECTIONS.COURSES, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Course not found' };
    }

    const courseData = docSnap.data() as Course;
    
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Clear cache
    clearCache(id);
    
    await addLog('Deleted Course', `Title: ${courseData.title}, ID: ${id}`);
    
    return { success: true, data: { ...courseData, id } };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : ERROR_MESSAGES.DELETE_FAILED 
    };
  }
}

// Hard delete a course from Firestore (improved hybrid approach)
export async function deleteCourse(id: string): Promise<CourseOperationResult> {
  try {
    if (!id || typeof id !== 'string') {
      return { success: false, error: 'Invalid course ID provided' };
    }

    // Get course data before deletion for logging
    const courseResult = await getCourse(id);
    if (!courseResult.success) {
      return courseResult;
    }

    const courseTitle = courseResult.data.title;

    // Try admin API first if available
    const adminDeleted = await tryAdminDeletion(id);
    if (adminDeleted) {
      await addLog('Deleted Course', `Title: ${courseTitle}, ID: ${id}`);
      clearCache(id);
      return { success: true, data: courseResult.data };
    }

    // Fallback to client SDK
    validateFirebaseInit();
    const docRef = doc(db, COLLECTIONS.COURSES, id);
    await deleteDoc(docRef);
    
    // Clear cache
    clearCache(id);
    
    await addLog('Deleted Course', `Title: ${courseTitle}, ID: ${id}`);
    
    return { success: true, data: courseResult.data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : ERROR_MESSAGES.DELETE_FAILED 
    };
  }
}

// Helper function to try admin deletion
async function tryAdminDeletion(id: string): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      const { deleteFromAdminAPI } = await import('@/lib/admin-utils');
      await deleteFromAdminAPI(COLLECTIONS.COURSES, id);
      return true;
    } else {
      const { deleteCourseAdmin } = await import('@/lib/admin-server-functions');
      await deleteCourseAdmin(id);
      return true;
    }
  } catch (error) {

    return false;
  }
}

// Default courses data
const DEFAULT_COURSES: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>[] = [
  {
    title: "Heavy Motor Vehicle (HMV) Training",
    description: "Get certified to drive heavy commercial vehicles like trucks and buses. Our course covers advanced vehicle control, safety regulations, and long-haul driving techniques.",
    price: "₹20000",
    value: "hmv",
    icon: "Truck",
    modules: [
      {
        id: "mod1_hmv",
        title: "HMV Fundamentals",
        lessons: [
          {
            id: "les11_hmv",
            title: "Introduction to Heavy Vehicles",
            videoUrl: "Qc0s4WMPaxY",
            description: "Understand the unique characteristics of heavy vehicles, including size, weight, and braking systems. Learn the pre-trip inspection checklist.",
            attachments: [{ 
              id: 'att111_hmv', 
              name: "Daily Inspection Checklist.pdf", 
              url: "https://example.com/checklist.pdf" 
            }]
          },
          {
            id: "les12_hmv",
            title: "Mastering the Air Brake System",
            videoUrl: "SJSe0TbdhHo",
            description: "A deep dive into the air brake system, a critical component of heavy vehicle safety. Includes practical exercises.",
            attachments: []
          }
        ]
      },
      {
        id: "mod2_hmv",
        title: "Advanced On-Road Skills",
        lessons: [
          {
            id: "les21_hmv",
            title: "Highway Driving and Defensive Techniques",
            videoUrl: "your_youtube_video_id_3",
            description: "Learn to safely manage your vehicle at high speeds, handle lane changes, and anticipate hazards on the highway.",
            attachments: []
          }
        ]
      }
    ]
  },
  {
    title: "Light Motor Vehicle (LMV) Training",
    description: "Everything you need to get your LMV license, from foundational theory to advanced on-road practice. This course covers all aspects of safe driving, preparing you for your test and beyond.",
    price: "₹15000",
    value: "lmv",
    icon: "Car",
    modules: [
      {
        id: "mod1_lmv",
        title: "Module 1: Getting Started",
        lessons: [
          {
            id: "les11_lmv",
            title: "Introduction to Your Vehicle",
            videoUrl: "your_youtube_video_id_1",
            description: "Learn about the basic components of your car, from the dashboard controls to what's under the hood. A foundational lesson for every new driver.",
            attachments: [{ 
              id: 'att111_lmv', 
              name: "Vehicle Pre-Drive Checklist.pdf", 
              url: "https://example.com/pre-drive-checklist.pdf" 
            }]
          },
          {
            id: "les12_lmv",
            title: "Basic Controls: Steering, Pedals, and Gears",
            videoUrl: "your_youtube_video_id_2",
            description: "Master the fundamentals of controlling your vehicle smoothly and safely on our practice track before heading to the road.",
            attachments: []
          }
        ]
      },
      {
        id: "mod2_lmv",
        title: "Module 2: On-Road Skills",
        lessons: [
          {
            id: "les21_lmv",
            title: "Navigating Junctions and Roundabouts",
            videoUrl: "your_youtube_video_id_3",
            description: "Techniques for safely approaching, observing, and navigating different types of intersections and roundabouts.",
            attachments: [{ 
              id: 'att211_lmv', 
              name: "Junction Priority Rules.pdf", 
              url: "https://example.com/junction-rules.pdf" 
            }]
          }
        ]
      }
    ]
  },
  {
    title: "Motorcycle with Gear (MCWG) Training",
    description: "Master the art of two-wheeling with our comprehensive motorcycle course. We cover everything from basic balance and control to advanced safety maneuvers for city and highway riding.",
    price: "Free",
    value: "mcwg",
    icon: "Bike",
    modules: [
      {
        id: "mod1_mcwg",
        title: "Fundamentals of Riding",
        lessons: [
          {
            id: "les11_mcwg",
            title: "Balance, Throttle Control, and Braking",
            videoUrl: "your_youtube_video_id_4",
            description: "Learn the core skills of motorcycle riding in a safe, controlled environment. Our instructors will guide you every step of the way.",
            attachments: []
          }
        ]
      },
      {
        id: "mod2_mcwg",
        title: "Defensive Riding and Road Safety",
        lessons: [
          {
            id: "les21_mcwg",
            title: "Hazard Perception and Evasive Maneuvers",
            videoUrl: "your_youtube_video_id_5",
            description: "Develop the crucial skills to anticipate potential dangers and react safely in traffic.",
            attachments: [{ 
              id: 'att211_mcwg', 
              name: "Riding Safety Gear Guide.pdf", 
              url: "https://example.com/safety-gear.pdf" 
            }]
          }
        ]
      }
    ]
  },
  {
    title: "Refresher Course",
    description: "Regain your confidence on the road. This course is perfect for licensed drivers who haven't driven in a while or want to brush up on specific skills like parking or highway driving.",
    price: "Free",
    value: "refresher",
    icon: "Route",
    modules: [
      {
        id: "mod1_refresher",
        title: "Core Skills Review",
        lessons: [
          {
            id: "les11_ref",
            title: "Modern Vehicle Technology Update",
            videoUrl: "your_youtube_video_id_6",
            description: "A look at modern car features like ABS, airbags, and parking sensors to get you up to speed.",
            attachments: []
          },
          {
            id: "les12_ref",
            title: "Advanced Parking Techniques",
            videoUrl: "your_youtube_video_id_7",
            description: "Master parallel, perpendicular, and angle parking in a controlled environment.",
            attachments: [{ 
              id: 'att121_ref', 
              name: "Parking Diagrams.pdf", 
              url: "https://example.com/parking-diagrams.pdf" 
            }]
          }
        ]
      }
    ]
  }
];

// Helper functions for seeding
async function getExistingCourseTitles(): Promise<Set<string>> {
  const coursesCollection = collection(db, COLLECTIONS.COURSES);
  const q = query(coursesCollection, where("title", "in", DEFAULT_COURSES.map((c: any) => c.title)));
  const snapshot = await getDocs(q);
  return new Set(snapshot.docs.map(doc => doc.data().title));
}

async function bulkAddCourses(courses: Omit<Course, 'id'>[]): Promise<number> {
  const batch = writeBatch(db);
  const coursesCollection = collection(db, COLLECTIONS.COURSES);
  
  courses.forEach((course: any) => {
    const docRef = doc(coursesCollection);
    const dataToSave = {
      ...course,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false
    };
    batch.set(docRef, dataToSave);
  });

  await batch.commit();
  return courses.length;
}

// Improved seeding function with race condition protection
export async function seedDefaultCourses(): Promise<{ success: boolean; count?: number; error?: string }> {
  const SEED_LOCK_KEY = 'course_seeding_lock';
  
  try {
    validateFirebaseInit();

    // Check/set lock to prevent concurrent seeding
    const lockDoc = doc(db, 'locks', SEED_LOCK_KEY);
    const lockSnap = await getDoc(lockDoc);
    
    if (lockSnap.exists()) {
      const lockData = lockSnap.data();
      const lockAge = Date.now() - lockData.timestamp;
      
      // If lock is recent and in progress, deny
      if (lockData.inProgress && lockAge < 5 * 60 * 1000) { // 5 minutes
        return { success: false, error: 'Seeding already in progress' };
      }
    }

    // Set lock
    await updateDoc(lockDoc, { 
      inProgress: true, 
      timestamp: Date.now() 
    });

    try {
      const existingTitles = await getExistingCourseTitles();
      const coursesToAdd = DEFAULT_COURSES
        .filter((course: any) => !existingTitles.has(course.title))
        .map(course => ({
          ...course,
          modules: [],
          isDeleted: false
        }));

      if (coursesToAdd.length === 0) {
        return { success: true, count: 0 };
      }

      const addedCount = await bulkAddCourses(coursesToAdd);
      
      // Clear cache after seeding
      clearCache();
      
      await addLog('Added Course', `Added ${addedCount} default courses`);
      
      return { success: true, count: addedCount };
    } finally {
      // Release lock
      await updateDoc(lockDoc, { 
        inProgress: false, 
        timestamp: Date.now() 
      });
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : ERROR_MESSAGES.SEED_FAILED 
    };
  }
}

// Get course statistics
export async function getCourseStats(): Promise<{
  total: number;
  active: number;
  deleted: number;
}> {
  try {
    validateFirebaseInit();

    const coursesCollection = collection(db, COLLECTIONS.COURSES);
    const allSnapshot = await getDocs(coursesCollection);
    
    let active = 0;
    let deleted = 0;
    
    allSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.isDeleted) {
        deleted++;
      } else {
        active++;
      }
    });

    return {
      total: allSnapshot.size,
      active,
      deleted
    };
  } catch (error) {
    console.error("Error fetching course stats:", error);
    return { total: 0, active: 0, deleted: 0 };
  }
}
