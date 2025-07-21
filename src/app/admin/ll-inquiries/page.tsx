
import { getLlInquiries } from "@/services/llInquiriesService";
import { AdminLlInquiriesView } from "./_components/AdminLlInquiriesView";
import type { LlInquiry } from "@/services/llInquiriesService";

export default async function LlInquiriesPage() {
    const inquiries: LlInquiry[] = await getLlInquiries();
    
    return <AdminLlInquiriesView initialInquiries={inquiries} />;
}
