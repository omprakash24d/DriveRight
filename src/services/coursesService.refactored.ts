// Refactored course service using modular architecture
'use server';

// Re-export types and utilities
export * from './modules/courseTypes';

// Import repository functions
import {
    addCourse,
    bulkUpdateCourses,
    clearCourseCache,
    deleteCourse,
    getAllCourses,
    getCacheStats,
    getCourseById,
    searchCourses,
    updateCourse
} from './modules/courseRepository';

import {
    COURSE_METADATA,
    DEFAULT_COURSES,
    getCourseByValue as getDefaultCourseByValue,
    getCoursesByCategory as getDefaultCoursesByCategory,
    getFreeCourses as getDefaultFreeCourses,
    getPaidCourses as getDefaultPaidCourses
} from './modules/courseData';

import {
    Course,
    CourseNotFoundError,
    CourseOperationError,
    CourseValidationError
} from './modules/courseTypes';

// Main service functions - simple wrappers around repository functions
export const getCourses = getAllCourses;
export const getCourse = getCourseById;
export const createCourse = addCourse;
export const updateExistingCourse = updateCourse;
export const deleteCourseById = deleteCourse;
export const findCourses = searchCourses;
export const updateMultipleCourses = bulkUpdateCourses;

// Utility functions
export async function getActiveCourses(): Promise<Course[]> {
  const allCourses = await getAllCourses();
  return allCourses.filter(course => course.isActive);
}

export async function getPopularCourses(limit: number = 5): Promise<Course[]> {
  const searchResult = await searchCourses({
    sortBy: 'enrollmentCount',
    sortOrder: 'desc',
    limit
  });
  return searchResult.courses;
}

export async function getRecentCourses(limit: number = 5): Promise<Course[]> {
  const searchResult = await searchCourses({
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit
  });
  return searchResult.courses;
}

export async function getCoursesByPriceRange(min: number, max: number): Promise<Course[]> {
  const searchResult = await searchCourses({
    priceRange: { min, max }
  });
  return searchResult.courses;
}

// Seeding function for default courses
export async function seedDefaultCourses(): Promise<number> {
  try {
    // Check if any courses already exist
    const existingCourses = await getAllCourses();
    if (existingCourses.length > 0) {
      return 0;
    }

    let seededCount = 0;
    
    for (const courseData of DEFAULT_COURSES) {
      try {
        await addCourse(courseData);
        seededCount++;
      } catch (error) {
        console.error(`Failed to seed course ${courseData.title}:`, error);
      }
    }

    return seededCount;
  } catch (error) {
    console.error('Error seeding default courses:', error);
    throw new CourseOperationError('seed', error as Error);
  }
}

// Statistics and analytics
export async function getCourseStatistics() {
  try {
    const allCourses = await getAllCourses();
    
    const stats = {
      total: allCourses.length,
      active: allCourses.filter(c => c.isActive).length,
      inactive: allCourses.filter(c => !c.isActive).length,
      free: allCourses.filter(c => c.price.toLowerCase() === 'free').length,
      paid: allCourses.filter(c => c.price.toLowerCase() !== 'free').length,
      totalEnrollments: allCourses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0),
      averageRating: allCourses.length > 0 
        ? allCourses.reduce((sum, c) => sum + (c.rating || 0), 0) / allCourses.length 
        : 0,
      categories: [...new Set(allCourses.map(c => c.value))],
      recentlyAdded: allCourses
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5),
      mostPopular: allCourses
        .sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
        .slice(0, 5),
      highestRated: allCourses
        .filter(c => c.rating > 0)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5)
    };

    return stats;
  } catch (error) {
    console.error('Error calculating course statistics:', error);
    throw new CourseOperationError('calculate statistics', error as Error);
  }
}

// Cache management
export function clearCache(): void {
  clearCourseCache();
}

export function getCacheInfo() {
  return getCacheStats();
}

// Course enrollment functions
export async function enrollStudentInCourse(courseId: string, studentId: string): Promise<void> {
  try {
    const course = await getCourseById(courseId);
    if (!course) {
      throw new CourseNotFoundError(courseId);
    }

    // Update enrollment count
    await updateCourse(courseId, {
      enrollmentCount: (course.enrollmentCount || 0) + 1,
      updatedAt: new Date()
    });

    // Note: Student enrollment logic would be handled by the enrollment service
    // This is just updating the course's enrollment count
    
  } catch (error) {
    console.error(`Error enrolling student ${studentId} in course ${courseId}:`, error);
    throw error;
  }
}

export async function unenrollStudentFromCourse(courseId: string, studentId: string): Promise<void> {
  try {
    const course = await getCourseById(courseId);
    if (!course) {
      throw new CourseNotFoundError(courseId);
    }

    // Update enrollment count (ensure it doesn't go below 0)
    const newCount = Math.max((course.enrollmentCount || 0) - 1, 0);
    await updateCourse(courseId, {
      enrollmentCount: newCount,
      updatedAt: new Date()
    });

    // Note: Student unenrollment logic would be handled by the enrollment service
    
  } catch (error) {
    console.error(`Error unenrolling student ${studentId} from course ${courseId}:`, error);
    throw error;
  }
}

// Course rating functions
export async function updateCourseRating(courseId: string, newRating: number): Promise<void> {
  try {
    if (newRating < 0 || newRating > 5) {
      throw new CourseValidationError('Rating must be between 0 and 5');
    }

    await updateCourse(courseId, {
      rating: newRating,
      updatedAt: new Date()
    });
    
  } catch (error) {
    console.error(`Error updating rating for course ${courseId}:`, error);
    throw error;
  }
}

// Legacy compatibility - maintaining old function names
export const getCourseByValue = getDefaultCourseByValue;
export const getCoursesByCategory = getDefaultCoursesByCategory;
export const getFreeCourses = getDefaultFreeCourses;
export const getPaidCourses = getDefaultPaidCourses;

// Metadata export
export const courseMetadata = COURSE_METADATA;
