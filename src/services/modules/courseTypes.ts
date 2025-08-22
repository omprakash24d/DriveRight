// Course validation schemas and types
import { z } from 'zod';

// Zod schemas for validation
export const AttachmentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  url: z.string().url()
});

export const LessonSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(255),
  videoUrl: z.string().min(1),
  description: z.string().min(1).max(1000),
  attachments: z.array(AttachmentSchema).default([])
});

export const ModuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(255),
  lessons: z.array(LessonSchema).min(1)
});

export const CourseSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(1000),
  price: z.string().min(1).max(50),
  value: z.string().min(1).max(50),
  icon: z.string().min(1).max(50),
  modules: z.array(ModuleSchema).min(1),
  isActive: z.boolean().default(true),
  enrollmentCount: z.number().int().min(0).default(0),
  rating: z.number().min(0).max(5).default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export const CourseUpdateSchema = CourseSchema.partial().omit({ 
  createdAt: true 
}).extend({
  updatedAt: z.date().default(() => new Date())
});

// TypeScript types derived from schemas
export type Attachment = z.infer<typeof AttachmentSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Course = z.infer<typeof CourseSchema> & { 
  id: string; 
  createdAt: Date; 
  updatedAt: Date; 
};
export type CourseUpdate = z.infer<typeof CourseUpdateSchema>;

// Course status enum
export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// Course difficulty levels
export enum CourseDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

// Course categories
export enum CourseCategory {
  LMV = 'lmv',
  HMV = 'hmv',
  MCWG = 'mcwg',
  REFRESHER = 'refresher',
  SPECIALIZED = 'specialized'
}

// Search and filter types
export interface CourseSearchOptions {
  query?: string;
  category?: CourseCategory;
  difficulty?: CourseDifficulty;
  status?: CourseStatus;
  priceRange?: {
    min: number;
    max: number;
  };
  sortBy?: 'title' | 'price' | 'rating' | 'enrollmentCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CourseSearchResult {
  courses: Course[];
  total: number;
  hasMore: boolean;
  filters: {
    categories: { value: CourseCategory; count: number }[];
    difficulties: { value: CourseDifficulty; count: number }[];
    priceRanges: { min: number; max: number; count: number }[];
  };
}

// Error types
export class CourseNotFoundError extends Error {
  constructor(id: string) {
    super(`Course with ID ${id} not found`);
    this.name = 'CourseNotFoundError';
  }
}

export class CourseValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'CourseValidationError';
  }
}

export class CourseOperationError extends Error {
  constructor(operation: string, originalError?: Error) {
    super(`Failed to ${operation} course: ${originalError?.message || 'Unknown error'}`);
    this.name = 'CourseOperationError';
    this.cause = originalError;
  }
}
