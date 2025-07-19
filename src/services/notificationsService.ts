
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore";

export interface Notification {
    id: string;
    title: string;
    description: string;
    href: string;
    timestamp: Date;
}

export async function getRecentNotifications(): Promise<Notification[]> {
    if (!db.app) return [];
    const notifications: Notification[] = [];
    const now = new Date();

    try {
        // Fetch recent enrollments
        const enrollmentsQuery = query(collection(db, 'enrollments'), orderBy('createdAt', 'desc'), limit(3));
        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        enrollmentsSnap.forEach(doc => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                title: `Enrollment: ${data.status}`,
                description: `${data.fullName} enrolled in ${data.vehicleType.toUpperCase()}.`,
                href: '/admin/enrollments',
                timestamp: (data.createdAt as Timestamp).toDate(),
            });
        });

        // Fetch recent refresher requests
        const refreshersQuery = query(collection(db, 'refresherRequests'), orderBy('createdAt', 'desc'), limit(3));
        const refreshersSnap = await getDocs(refreshersQuery);
        refreshersSnap.forEach(doc => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                title: `Refresher: ${data.status}`,
                description: `${data.name} requested a refresher course.`,
                href: '/admin/refresher-requests',
                timestamp: (data.createdAt as Timestamp).toDate(),
            });
        });

        // Fetch recent DL inquiries
        const dlInquiriesQuery = query(collection(db, 'licensePrintInquiries'), orderBy('timestamp', 'desc'), limit(3));
        const dlInquiriesSnap = await getDocs(dlInquiriesQuery);
        dlInquiriesSnap.forEach(doc => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                title: `DL Request: ${data.status}`,
                description: `${data.name} requested a DL print.`,
                href: '/admin/license-inquiries',
                timestamp: (data.timestamp as Timestamp).toDate(),
            });
        });

        // Fetch recent LL inquiries
        const llInquiriesQuery = query(collection(db, 'llInquiries'), orderBy('timestamp', 'desc'), limit(3));
        const llInquiriesSnap = await getDocs(llInquiriesQuery);
        llInquiriesSnap.forEach(doc => {
            const data = doc.data();
            notifications.push({
                id: doc.id,
                title: `LL Inquiry: ${data.status}`,
                description: `${data.name} inquired about their LL exam.`,
                href: '/admin/ll-inquiries',
                timestamp: (data.timestamp as Timestamp).toDate(),
            });
        });
        
    } catch (e) {
        console.error("Could not fetch some notifications", e);
        // Return a default error notification instead of crashing
        return [{
            id: 'error-notif',
            title: 'Error Fetching Notifications',
            description: 'Could not load all recent activity.',
            href: '#',
            timestamp: now,
        }];
    }

    // Sort all notifications by date and take the most recent 5
    return notifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
}
