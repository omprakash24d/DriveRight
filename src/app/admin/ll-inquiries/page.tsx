
import { getLlInquiries } from "@/services/llInquiriesService";
import { AdminLlInquiriesView } from "./_components/AdminLlInquiriesView";
import type { LlInquiry } from "@/services/llInquiriesService";
import type { Timestamp } from "firebase/firestore";

export default async function LlInquiriesPage() {
    const inquiries: LlInquiry[] = await getLlInquiries();

    // Serialize Firestore Timestamps to ISO strings for client component props
    const serializableInquiries = inquiries.map(inquiry => ({
        ...inquiry,
        timestamp: (inquiry.timestamp as Timestamp).toDate().toISOString(),
    }));
    
    return <AdminLlInquiriesView initialInquiries={serializableInquiries} />;
}
