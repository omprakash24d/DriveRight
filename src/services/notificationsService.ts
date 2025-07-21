
'use server';

import { getAdminApp } from "@/lib/firebase-admin";
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

export interface Notification {
    id: string;
    title: string;
    description: string;
    href: string;
    timestamp: Date; // Keep as Date object for server-side logic
}

// This function is designed to run ONLY on the server, called by the secure API route.
export async function getRecentNotificationsForAdmin(): Promise<Notification[]> {
    const adminApp = getAdminApp();
    if (!adminApp) {
        console.error("Admin SDK not initialized. Cannot fetch notifications.");
        return [];
    }
    const adminDb = getAdminFirestore(adminApp);
    const notifications: Notification[] = [];
    const now = new Date();

    try {
        const collectionsToFetch = [
            { name: 'enrollments', dateField: 'createdAt', titlePrefix: 'Enrollment', descField: 'fullName', href: '/admin/enrollments' },
            { name: 'refresherRequests', dateField: 'createdAt', titlePrefix: 'Refresher', descField: 'name', href: '/admin/refresher-requests' },
            { name: 'licensePrintInquiries', dateField: 'timestamp', titlePrefix: 'DL Request', descField: 'name', href: '/admin/license-inquiries' },
            { name: 'llInquiries', dateField: 'timestamp', titlePrefix: 'LL Inquiry', descField: 'name', href: '/admin/ll-inquiries' },
        ];

        for (const c of collectionsToFetch) {
            const q = adminDb.collection(c.name).orderBy(c.dateField, 'desc').limit(3);
            const snapshot = await q.get();
            snapshot.forEach(doc => {
                const data = doc.data();
                const status = data.status || 'New';
                const descriptionName = data[c.descField] || 'N/A';
                
                let description = '';
                if(c.name === 'enrollments') {
                    description = `${descriptionName} enrolled in ${data.vehicleType?.toUpperCase()}.`;
                } else if (c.name === 'refresherRequests') {
                    description = `${descriptionName} requested a refresher course.`;
                } else if (c.name === 'licensePrintInquiries') {
                    description = `${descriptionName} requested a DL print.`;
                } else {
                    description = `${descriptionName} inquired about their LL exam.`;
                }
                
                notifications.push({
                    id: doc.id,
                    title: `${c.titlePrefix}: ${status}`,
                    description: description,
                    href: c.href,
                    timestamp: (data[c.dateField] as FirebaseFirestore.Timestamp).toDate(),
                });
            });
        }
        
    } catch (e) {
        console.error("Could not fetch some notifications on server", e);
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
