export const COLLECTIONS = {
  COURSES: 'courses',
  LOCKS: 'locks'
} as const;

export const ERROR_MESSAGES = {
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

export const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const PAGINATION_LIMITS = {
  DEFAULT: 10,
  MAX: 50
} as const;
