// Firebase Firestore Collections Setup and Seeding
// Run this script to set up the required collections for the enhanced About section

import { db } from "@/lib/firebase";
import { collection, doc, writeBatch } from "firebase/firestore";

export interface StudentRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'completed' | 'inactive' | 'pending';
  enrolledCourses: string[];
  completedCourses: string[];
  enrollmentDate: Date;
  completionDate?: Date;
  totalLessons: number;
  completedLessons: number;
}

export interface EnrollmentRecord {
  id: string;
  studentId: string;
  courseId: string;
  courseName: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  enrollmentDate: Date;
  completionDate?: Date;
  totalFee: number;
  paidAmount: number;
  instructorId?: string;
}

export interface TestResult {
  id: string;
  studentId: string;
  courseId: string;
  testType: 'theory' | 'practical' | 'final';
  passed: boolean;
  score: number;
  maxScore: number;
  date: Date;
  attemptNumber: number;
  rating?: number; // Student rating of instruction (1-5)
  feedback?: string;
}

export interface CourseRecord {
  id: string;
  name: string;
  code: string;
  description: string;
  duration: number; // in days
  price: number;
  category: 'LMV' | 'MCWG' | 'HMV' | 'Special';
  status: 'active' | 'inactive';
  totalEnrollments: number;
  completionRate: number;
}

// Seed data for testing
const seedStudents: StudentRecord[] = [
  {
    id: '1',
    name: 'Rahul Kumar',
    email: 'rahul@example.com',
    phone: '+91-9876543210',
    status: 'completed',
    enrolledCourses: ['lmv-basic'],
    completedCourses: ['lmv-basic'],
    enrollmentDate: new Date('2024-01-15'),
    completionDate: new Date('2024-02-28'),
    totalLessons: 30,
    completedLessons: 30
  },
  {
    id: '2',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91-9876543211',
    status: 'active',
    enrolledCourses: ['mcwg-basic'],
    completedCourses: [],
    enrollmentDate: new Date('2024-06-01'),
    totalLessons: 20,
    completedLessons: 15
  },
  {
    id: '3',
    name: 'Amit Singh',
    email: 'amit@example.com',
    phone: '+91-9876543212',
    status: 'completed',
    enrolledCourses: ['lmv-advanced'],
    completedCourses: ['lmv-advanced'],
    enrollmentDate: new Date('2024-03-10'),
    completionDate: new Date('2024-04-25'),
    totalLessons: 35,
    completedLessons: 35
  }
];

const seedEnrollments: EnrollmentRecord[] = [
  {
    id: '1',
    studentId: '1',
    courseId: 'lmv-basic',
    courseName: 'LMV Basic Training',
    status: 'completed',
    enrollmentDate: new Date('2024-01-15'),
    completionDate: new Date('2024-02-28'),
    totalFee: 15000,
    paidAmount: 15000,
    instructorId: 'inst-001'
  },
  {
    id: '2',
    studentId: '2',
    courseId: 'mcwg-basic',
    courseName: 'MCWG Basic Training',
    status: 'active',
    enrollmentDate: new Date('2024-06-01'),
    totalFee: 8000,
    paidAmount: 5000,
    instructorId: 'inst-002'
  },
  {
    id: '3',
    studentId: '3',
    courseId: 'lmv-advanced',
    courseName: 'LMV Advanced Training',
    status: 'completed',
    enrollmentDate: new Date('2024-03-10'),
    completionDate: new Date('2024-04-25'),
    totalFee: 18000,
    paidAmount: 18000,
    instructorId: 'inst-001'
  }
];

const seedTestResults: TestResult[] = [
  {
    id: '1',
    studentId: '1',
    courseId: 'lmv-basic',
    testType: 'theory',
    passed: true,
    score: 45,
    maxScore: 50,
    date: new Date('2024-02-15'),
    attemptNumber: 1,
    rating: 5,
    feedback: 'Excellent instruction, very clear explanations'
  },
  {
    id: '2',
    studentId: '1',
    courseId: 'lmv-basic',
    testType: 'practical',
    passed: true,
    score: 85,
    maxScore: 100,
    date: new Date('2024-02-25'),
    attemptNumber: 1,
    rating: 5
  },
  {
    id: '3',
    studentId: '2',
    courseId: 'mcwg-basic',
    testType: 'theory',
    passed: true,
    score: 42,
    maxScore: 50,
    date: new Date('2024-06-20'),
    attemptNumber: 1,
    rating: 4
  },
  {
    id: '4',
    studentId: '3',
    courseId: 'lmv-advanced',
    testType: 'final',
    passed: true,
    score: 92,
    maxScore: 100,
    date: new Date('2024-04-20'),
    attemptNumber: 1,
    rating: 5,
    feedback: 'Outstanding training quality'
  }
];

const seedCourses: CourseRecord[] = [
  {
    id: 'lmv-basic',
    name: 'LMV Basic Training',
    code: 'LMV-B',
    description: 'Basic Light Motor Vehicle training for beginners',
    duration: 45,
    price: 15000,
    category: 'LMV',
    status: 'active',
    totalEnrollments: 150,
    completionRate: 92
  },
  {
    id: 'mcwg-basic',
    name: 'MCWG Basic Training',
    code: 'MCWG-B',
    description: 'Motorcycle Without Gear basic training',
    duration: 30,
    price: 8000,
    category: 'MCWG',
    status: 'active',
    totalEnrollments: 200,
    completionRate: 95
  },
  {
    id: 'lmv-advanced',
    name: 'LMV Advanced Training',
    code: 'LMV-A',
    description: 'Advanced Light Motor Vehicle training with defensive driving',
    duration: 60,
    price: 18000,
    category: 'LMV',
    status: 'active',
    totalEnrollments: 75,
    completionRate: 88
  }
];

// Function to seed all collections
export async function seedFirebaseCollections(): Promise<void> {
  try {

    
    const batch = writeBatch(db);
    
    // Seed Students

    for (const student of seedStudents) {
      const studentRef = doc(db, 'students', student.id);
      batch.set(studentRef, {
        ...student,
        enrollmentDate: student.enrollmentDate,
        completionDate: student.completionDate || null
      });
    }
    
    // Seed Enrollments

    for (const enrollment of seedEnrollments) {
      const enrollmentRef = doc(db, 'enrollments', enrollment.id);
      batch.set(enrollmentRef, {
        ...enrollment,
        enrollmentDate: enrollment.enrollmentDate,
        completionDate: enrollment.completionDate || null
      });
    }
    
    // Seed Test Results

    for (const result of seedTestResults) {
      const resultRef = doc(db, 'testResults', result.id);
      batch.set(resultRef, {
        ...result,
        date: result.date
      });
    }
    
    // Seed Courses

    for (const course of seedCourses) {
      const courseRef = doc(db, 'courses', course.id);
      batch.set(courseRef, course);
    }
    
    // Commit the batch
    await batch.commit();
    





    
  } catch (error) {
    console.error('❌ Error seeding collections:', error);
    throw error;
  }
}

// Function to check if collections exist and have data
export async function checkCollectionsExist(): Promise<boolean> {
  try {
    const collections = ['students', 'enrollments', 'testResults', 'courses'];
    
    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);
      // You would need to add a check here, but for now we'll assume they need seeding
    }
    
    return false; // Assume they need seeding for now
  } catch (error) {
    console.error('Error checking collections:', error);
    return false;
  }
}

// Export individual seeding functions for granular control
export async function seedStudentsCollection(): Promise<void> {
  const batch = writeBatch(db);
  
  for (const student of seedStudents) {
    const studentRef = doc(db, 'students', student.id);
    batch.set(studentRef, {
      ...student,
      enrollmentDate: student.enrollmentDate,
      completionDate: student.completionDate || null
    });
  }
  
  await batch.commit();

}

export async function seedEnrollmentsCollection(): Promise<void> {
  const batch = writeBatch(db);
  
  for (const enrollment of seedEnrollments) {
    const enrollmentRef = doc(db, 'enrollments', enrollment.id);
    batch.set(enrollmentRef, {
      ...enrollment,
      enrollmentDate: enrollment.enrollmentDate,
      completionDate: enrollment.completionDate || null
    });
  }
  
  await batch.commit();

}

export async function seedTestResultsCollection(): Promise<void> {
  const batch = writeBatch(db);
  
  for (const result of seedTestResults) {
    const resultRef = doc(db, 'testResults', result.id);
    batch.set(resultRef, {
      ...result,
      date: result.date
    });
  }
  
  await batch.commit();

}

export async function seedCoursesCollection(): Promise<void> {
  const batch = writeBatch(db);
  
  for (const course of seedCourses) {
    const courseRef = doc(db, 'courses', course.id);
    batch.set(courseRef, course);
  }
  
  await batch.commit();

}
