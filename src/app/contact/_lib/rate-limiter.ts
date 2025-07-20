
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";

const RATE_LIMIT_COLLECTION = 'rateLimits';
const RATE_LIMIT_DURATION_MINUTES = 15;
export const RATE_LIMIT_COUNT = 50;

interface RateLimitDoc {
    count: number;
    // Firestore serverTimestamp will automatically set this on creation/update
    timestamp: Timestamp;
    // TTL will be set on this field in Firestore console
    expireAt: Timestamp;
}

/**
 * Checks if a given IP has exceeded the rate limit.
 * Uses Firestore to maintain a distributed count.
 * @param ip The IP address to check.
 * @returns A promise that resolves to true if the IP is rate-limited, false otherwise.
 */
export async function checkRateLimit(ip: string): Promise<boolean> {
    if (!db.app) {
        console.warn("Firestore not initialized, rate limiting is disabled.");
        return false;
    }

    const docRef = doc(db, RATE_LIMIT_COLLECTION, ip);
    
    try {
        const docSnap = await getDoc(docRef);

        const now = Timestamp.now();
        const expirationTime = new Timestamp(now.seconds + RATE_LIMIT_DURATION_MINUTES * 60, now.nanoseconds);
        
        if (!docSnap.exists()) {
            // First request from this IP in the current window.
            await setDoc(docRef, { count: 1, timestamp: serverTimestamp(), expireAt: expirationTime });
            return false;
        }

        const data = docSnap.data() as RateLimitDoc;
        const lastRequestTime = data.timestamp;

        // Check if the record is expired
        const isExpired = (now.seconds - lastRequestTime.seconds) > (RATE_LIMIT_DURATION_MINUTES * 60);

        if (isExpired) {
            // The record has expired, reset it.
            await setDoc(docRef, { count: 1, timestamp: serverTimestamp(), expireAt: expirationTime });
            return false;
        }

        if (data.count >= RATE_LIMIT_COUNT) {
            // Limit exceeded.
            return true;
        }

        // Increment the count.
        await setDoc(docRef, { count: data.count + 1, timestamp: serverTimestamp(), expireAt: expirationTime });
        return false;

    } catch (error) {
        console.error("Error in rate limiter, allowing request to pass:", error);
        // Fail open: if Firestore has an issue, don't block legitimate users.
        return false;
    }
}
