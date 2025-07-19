
'use server';

import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from "firebase/firestore";
import type { TestResult as TestResultType } from "./_components/TestResultDisplay";
import { format } from "date-fns";

export async function findTestResult(identifier: string): Promise<TestResultType | null> {
    try {
        const studentsRef = collection(db, "students");
        let studentQuery;

        // Simplified search logic: check if it's a phone number, otherwise assume it's a name or ID.
        // A more robust implementation might use a dedicated search service.
        if (/^\d{10,}$/.test(identifier)) {
            studentQuery = query(studentsRef, where("phone", "==", identifier), limit(1));
        } else {
            studentQuery = query(studentsRef, where("name", "==", identifier), limit(1));
        }
        
        let studentSnap = await getDocs(studentQuery);
        let studentId: string | null = null;
        
        if (!studentSnap.empty) {
            studentId = studentSnap.docs[0].id;
        } else {
             // Fallback: try searching by document ID
            try {
                const studentDoc = await getDoc(doc(db, "students", identifier));
                if (studentDoc.exists()) {
                    studentId = studentDoc.id;
                }
            } catch (e) {
                // Not a valid doc ID, proceed to return null
            }
        }

        if (!studentId) {
            return null; // No student found
        }
       
        const resultsRef = collection(db, "testResults");
        const resultQuery = query(
            resultsRef,
            where("studentId", "==", studentId),
            orderBy("date", "desc"),
            limit(1)
        );

        const resultSnap = await getDocs(resultQuery);

        if (resultSnap.empty) {
            return null;
        }

        const latestResult = resultSnap.docs[0].data();
        
        let certificateId: string | undefined = undefined;
        if (latestResult.status === 'Pass') {
            const certsRef = collection(db, "certificates");
            const certQuery = query(
                certsRef,
                where("studentId", "==", studentId),
                where("course", "==", latestResult.testType),
                orderBy("issueDate", "desc"),
                limit(1)
            );
            const certSnap = await getDocs(certQuery);
            if (!certSnap.empty) {
                certificateId = certSnap.docs[0].id;
            }
        }

        return {
            studentName: latestResult.studentName,
            testType: latestResult.testType.toUpperCase().includes("LL") ? "LL" : "DL",
            date: format(latestResult.date.toDate(), "PPP"),
            score: latestResult.score,
            passed: latestResult.status === 'Pass',
            rawResults: latestResult.rawResults,
            certificateId: certificateId,
        };

    } catch (error) {
        console.error("Error looking up test result:", error);
        return null;
    }
}
