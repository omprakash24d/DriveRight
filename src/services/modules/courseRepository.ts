// Course database operations module
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
  Timestamp,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { addLog } from "../auditLogService";
import {
  Course,
  CourseNotFoundError,
  CourseOperationError,
  CourseSchema,
  CourseSearchOptions,
  CourseSearchResult,
  CourseUpdate,
  CourseUpdateSchema,
  CourseValidationError
} from "./courseTypes";

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
  INVALID_INPUT: "Invalid input provided."
} as const;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// In-memory cache for courses
const courseCache = new Map<string, { data: Course[]; timestamp: number }>();

// Helper functions
function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_TTL;
}

function validateFirebaseConnection() {
  if (!db) {
    throw new CourseOperationError('initialize', new Error(ERROR_MESSAGES.FIREBASE_NOT_INITIALIZED));
  }
}

function convertFirestoreDoc(doc: any): Course {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Course;
}

// Database operations
export async function getAllCourses(): Promise<Course[]> {
  validateFirebaseConnection();
  
  const cacheKey = 'all-courses';
  const cached = courseCache.get(cacheKey);
  
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }

  try {
    const q = query(
      collection(db, COLLECTIONS.COURSES),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const courses = querySnapshot.docs.map(convertFirestoreDoc);
    
    // Update cache
    courseCache.set(cacheKey, {
      data: courses,
      timestamp: Date.now()
    });
    
    return courses;
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw new CourseOperationError('fetch', error as Error);
  }
}

export async function getCourseById(id: string): Promise<Course | null> {
  validateFirebaseConnection();
  
  if (!id || typeof id !== 'string') {
    throw new CourseValidationError('Course ID is required and must be a string');
  }

  try {
    const docRef = doc(db, COLLECTIONS.COURSES, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return convertFirestoreDoc(docSnap);
  } catch (error) {
    console.error(`Error fetching course ${id}:`, error);
    throw new CourseOperationError('fetch', error as Error);
  }
}

export async function addCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  validateFirebaseConnection();

  try {
    // Validate course data
    const validatedData = CourseSchema.parse({
      ...courseData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const docData = {
      ...validatedData,
      createdAt: Timestamp.fromDate(validatedData.createdAt),
      updatedAt: Timestamp.fromDate(validatedData.updatedAt)
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.COURSES), docData);
    
    // Clear cache
    courseCache.clear();
    
    // Add audit log
    await addLog('Added Course', `Created course: ${courseData.title}`);
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding course:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      throw new CourseValidationError('Invalid course data', error.message);
    }
    
    throw new CourseOperationError('add', error as Error);
  }
}

export async function updateCourse(id: string, updateData: CourseUpdate): Promise<void> {
  validateFirebaseConnection();

  if (!id || typeof id !== 'string') {
    throw new CourseValidationError('Course ID is required and must be a string');
  }

  try {
    // Validate update data
    const validatedData = CourseUpdateSchema.parse({
      ...updateData,
      updatedAt: new Date()
    });

    const docData = {
      ...validatedData,
      updatedAt: Timestamp.fromDate(validatedData.updatedAt)
    };

    const docRef = doc(db, COLLECTIONS.COURSES, id);
    
    // Check if course exists
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new CourseNotFoundError(id);
    }
    
    await updateDoc(docRef, docData);
    
    // Clear cache
    courseCache.clear();
    
    // Add audit log
    await addLog('Updated Course', `Updated course: ${updateData.title || 'unknown'}`);
    
  } catch (error) {
    console.error(`Error updating course ${id}:`, error);
    
    if (error instanceof CourseNotFoundError) {
      throw error;
    }
    
    if (error instanceof Error && error.name === 'ZodError') {
      throw new CourseValidationError('Invalid update data', error.message);
    }
    
    throw new CourseOperationError('update', error as Error);
  }
}

export async function deleteCourse(id: string): Promise<void> {
  validateFirebaseConnection();

  if (!id || typeof id !== 'string') {
    throw new CourseValidationError('Course ID is required and must be a string');
  }

  try {
    const docRef = doc(db, COLLECTIONS.COURSES, id);
    
    // Check if course exists and get data for logging
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new CourseNotFoundError(id);
    }
    
    const courseData = convertFirestoreDoc(docSnap);
    
    await deleteDoc(docRef);
    
    // Clear cache
    courseCache.clear();
    
    // Add audit log
    await addLog('Deleted Course', `Deleted course: ${courseData.title}`);
    
  } catch (error) {
    console.error(`Error deleting course ${id}:`, error);
    
    if (error instanceof CourseNotFoundError) {
      throw error;
    }
    
    throw new CourseOperationError('delete', error as Error);
  }
}

export async function searchCourses(options: CourseSearchOptions = {}): Promise<CourseSearchResult> {
  validateFirebaseConnection();

  try {
    let q = query(collection(db, COLLECTIONS.COURSES));
    
    // Apply filters
    if (options.category) {
      q = query(q, where('value', '==', options.category));
    }
    
    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }
    
    // Apply sorting
    const sortField = options.sortBy || 'createdAt';
    const sortDirection = options.sortOrder || 'desc';
    q = query(q, orderBy(sortField, sortDirection));
    
    // Apply pagination
    if (options.limit) {
      q = query(q, limit(options.limit));
    }
    
    const querySnapshot = await getDocs(q);
    let courses = querySnapshot.docs.map(convertFirestoreDoc);
    
    // Apply text search (client-side for now)
    if (options.query) {
      const searchTerm = options.query.toLowerCase();
      courses = courses.filter(course => 
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply price range filter
    if (options.priceRange) {
      courses = courses.filter(course => {
        const price = parseFloat(course.price.replace(/[^\d.]/g, '')) || 0;
        return price >= (options.priceRange?.min || 0) && 
               price <= (options.priceRange?.max || Infinity);
      });
    }
    
    // Apply offset
    if (options.offset) {
      courses = courses.slice(options.offset);
    }
    
    // Calculate result metadata
    const total = courses.length;
    const hasMore = options.limit ? courses.length === options.limit : false;
    
    return {
      courses,
      total,
      hasMore,
      filters: {
        categories: [], // Feature coming soon
        difficulties: [], // Feature coming soon
        priceRanges: [] // Feature coming soon
      }
    };
    
  } catch (error) {
    console.error('Error searching courses:', error);
    throw new CourseOperationError('search', error as Error);
  }
}

export async function bulkUpdateCourses(updates: { id: string; data: CourseUpdate }[]): Promise<void> {
  validateFirebaseConnection();

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new CourseValidationError('Updates array is required and must not be empty');
  }

  try {
    const batch = writeBatch(db);
    
    for (const update of updates) {
      const validatedData = CourseUpdateSchema.parse({
        ...update.data,
        updatedAt: new Date()
      });
      
      const docData = {
        ...validatedData,
        updatedAt: Timestamp.fromDate(validatedData.updatedAt)
      };
      
      const docRef = doc(db, COLLECTIONS.COURSES, update.id);
      batch.update(docRef, docData);
    }
    
    await batch.commit();
    
    // Clear cache
    courseCache.clear();
    
    // Add audit log
    await addLog('Updated Course', `Bulk updated ${updates.length} courses`);
    
  } catch (error) {
    console.error('Error bulk updating courses:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      throw new CourseValidationError('Invalid update data in bulk operation', error.message);
    }
    
    throw new CourseOperationError('bulk update', error as Error);
  }
}

// Cache management
export function clearCourseCache(): void {
  courseCache.clear();
}

export function getCacheStats() {
  return {
    size: courseCache.size,
    keys: Array.from(courseCache.keys()),
    timestamps: Array.from(courseCache.entries()).map(([key, value]) => ({
      key,
      timestamp: value.timestamp,
      age: Date.now() - value.timestamp,
      valid: isCacheValid(value.timestamp)
    }))
  };
}
