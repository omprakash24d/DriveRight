
'use server';

import { db } from "@/lib/firebase";
import { getAdminApp } from "@/lib/firebase-admin";
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, where, Timestamp, orderBy } from "firebase/firestore";
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

export interface Lesson {
    id: string;
    studentId: string;
    studentName: string;
    instructorId: string;
    instructorName: string;
    date: Date | Timestamp;
    time: string; // "HH:MM"
    notes?: string;
}

export type NewLessonData = Omit<Lesson, 'id'>;

const LESSONS_COLLECTION = 'lessons';

// This function is now server-only and uses the Admin SDK for all data access.
export async function getLessons(): Promise<Lesson[]> {
    const adminApp = getAdminApp();
    if (!adminApp) {
        console.error("Admin SDK not initialized. Cannot fetch lessons on server.");
        return [];
    }
    const adminDb = getAdminFirestore(adminApp);
    const lessonsCollection = adminDb.collection(LESSONS_COLLECTION);
    const q = lessonsCollection.orderBy("date");
    const snapshot = await q.get();
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            // Convert Admin Timestamp to a format compatible with the client
            date: new Timestamp(data.date.seconds, data.date.nanoseconds),
        } as Lesson;
    });
}

// Add a new lesson (can be called from Server Actions / secure routes)
export async function addLesson(lessonData: NewLessonData): Promise<string> {
    if (!db.app) throw new Error("Firebase not initialized."); // Client SDK for writes from client components
    try {
        const docRef = await addDoc(collection(db, LESSONS_COLLECTION), lessonData);
        return docRef.id;
    } catch (error) {
        console.error("Error adding lesson:", error);
        throw new Error("Could not add lesson.");
    }
}

// Update a lesson
export async function updateLesson(id: string, lessonData: Partial<NewLessonData>): Promise<void> {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = doc(db, LESSONS_COLLECTION, id);
        await updateDoc(docRef, lessonData);
    } catch (error) {
        console.error("Error updating lesson:", error);
        throw new Error("Could not update lesson.");
    }
}

// Delete a lesson
export async function deleteLesson(id: string): Promise<void> {
    if (!db.app) throw new Error("Firebase not initialized.");
    try {
        const docRef = doc(db, LESSONS_COLLECTION, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting lesson:", error);
        throw new Error("Could not delete lesson.");
    }
}
