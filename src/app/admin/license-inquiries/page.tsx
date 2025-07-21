
import { getLicensePrintInquiries } from "@/services/licensePrintInquiriesService";
import { AdminLicenseInquiriesView } from "./_components/AdminLicenseInquiriesView";
import type { LicensePrintInquiry } from "@/services/licensePrintInquiriesService";
import type { Timestamp } from "firebase/firestore";

export default async function LicenseInquiriesPage() {
    const inquiries: LicensePrintInquiry[] = await getLicensePrintInquiries();

    // Serialize Firestore Timestamps to ISO strings for client component props
    const serializableInquiries = inquiries.map(inquiry => ({
        ...inquiry,
        timestamp: (inquiry.timestamp as Timestamp).toDate().toISOString(),
    }));
    
    return <AdminLicenseInquiriesView initialInquiries={serializableInquiries} />;
}
