
'use server';

import { db } from "@/lib/firebase";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from "firebase/firestore";
import { addLog } from "./auditLogService";

// Define the shape of the course data
export interface Attachment {
  id: string;
  name: string;
  url: string;
}

export interface Lesson {
  id: string;
  title: string;
  videoUrl: string; // YouTube Video ID
  description: string;
  attachments: Attachment[];
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
    id: string;
    title: string;
    description: string;
    price: string;
    value: string; // Used for the "Enroll Now" link query param, e.g., 'lmv'
    icon: string; // Storing the name of the Lucide icon as a string, e.g., 'Car'
    modules?: Module[];
}

const COURSES_COLLECTION = 'courses';

// Fetch all courses from Firestore
export async function getCourses(): Promise<Course[]> {
  if (!db.app) {
    console.warn("Firebase not initialized during build. Returning empty courses array.");
    return [];
  }
  try {
    const coursesCollection = collection(db, COURSES_COLLECTION);
    const q = query(coursesCollection, orderBy("title"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return [];
    }

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<Course, 'id'>)
    }));
  } catch (error) {
    console.error("Error fetching courses, returning empty array:", error);
    return [];
  }
}

// Fetch a single course by ID
export async function getCourse(id: string): Promise<Course | null> {
    if (!db.app) return null;
    try {
        const docRef = doc(db, COURSES_COLLECTION, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...(docSnap.data() as Omit<Course, 'id'>) };
        } else {
            console.log("No such course document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching course:", error);
        return null;
    }
}

// Add a new course to Firestore
export async function addCourse(courseData: Omit<Course, 'id'>) {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const dataToSave = { ...courseData, modules: courseData.modules || [] };
        const docRef = await addDoc(collection(db, COURSES_COLLECTION), dataToSave);
        await addLog('Added Course', `Title: ${courseData.title}`);
        return docRef.id;
    } catch (error) {
        console.error("Error adding course: ", error);
        throw new Error("Could not add course to the database.");
    }
}

// Update an existing course in Firestore
export async function updateCourse(id: string, courseData: Partial<Omit<Course, 'id'>>) {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = doc(db, COURSES_COLLECTION, id);
        await updateDoc(docRef, courseData);
        await addLog('Updated Course', `ID: ${id}`);
    } catch (error) {
        console.error("Error updating course: ", error);
        throw new Error("Could not update course in the database.");
    }
}

// Delete a course from Firestore (hybrid admin/client approach)
export async function deleteCourse(id: string): Promise<void> {
    try {
        // Try admin API first if we're on client side
        if (typeof window !== 'undefined') {
            try {
                const { deleteFromAdminAPI } = await import('@/lib/admin-utils');
                await deleteFromAdminAPI('courses', id);
                return;
            } catch (adminError) {
                console.log('Admin API not available, falling back to client SDK');
                // Fall through to client SDK approach
            }
        } else {
            // Server-side: try admin server function
            try {
                const { deleteCourseAdmin } = await import('@/lib/admin-server-functions');
                await deleteCourseAdmin(id);
                return;
            } catch (adminError) {
                console.log('Admin server function failed, falling back to client SDK');
                // Fall through to client SDK approach
            }
        }

        // Client SDK fallback
        if (!db.app) throw new Error("Firebase not initialized.");
        const docRef = doc(db, COURSES_COLLECTION, id);
        const courseSnap = await getDoc(docRef);
        const courseTitle = courseSnap.exists() ? courseSnap.data().title : `ID: ${id}`;
        
        await deleteDoc(docRef);
        await addLog('Deleted Course', `Title: ${courseTitle}`);
    } catch (error) {
        console.error("Error deleting course: ", error);
        throw new Error("Could not delete course from the database.");
    }
}

// New server action to seed the database
export async function seedDefaultCourses(): Promise<number> {
    if (!db.app) throw new Error("Firebase not initialized.");
    const defaultCourses: Omit<Course, 'id'>[] = [
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
                          attachments: [{ id: 'att111_hmv', name: "Daily Inspection Checklist.pdf", url: "#" }]
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
                          attachments: [{ id: 'att111_lmv', name: "Vehicle Pre-Drive Checklist.pdf", url: "#" }]
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
                          attachments: [{ id: 'att211_lmv', name: "Junction Priority Rules.pdf", url: "#" }]
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
                          attachments: [{ id: 'att211_mcwg', name: "Riding Safety Gear Guide.pdf", url: "#" }]
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
                          attachments: [{ id: 'att121_ref', name: "Parking Diagrams.pdf", url: "#" }]
                      }
                  ]
              }
          ]
      }
    ];

    try {
        const coursesCollection = collection(db, COURSES_COLLECTION);
        const q = query(coursesCollection, where("title", "in", defaultCourses.map(c => c.title)));
        const existingCoursesSnapshot = await getDocs(q);
        const existingTitles = new Set(existingCoursesSnapshot.docs.map(doc => doc.data().title));
        
        const coursesToAdd = defaultCourses.filter(course => !existingTitles.has(course.title));

        if (coursesToAdd.length === 0) {
            return 0; // No new courses to add
        }

        const addPromises = coursesToAdd.map(courseData => {
            return addDoc(collection(db, COURSES_COLLECTION), courseData);
        });

        await Promise.all(addPromises);
        await addLog('Added Course', `Seeded ${coursesToAdd.length} default courses`);
        
        return coursesToAdd.length;
    } catch (error) {
        console.error("Error seeding default courses: ", error);
        throw new Error("Could not seed default courses.");
    }
}
