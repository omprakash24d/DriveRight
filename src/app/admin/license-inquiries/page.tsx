
import { getLicensePrintInquiries } from "@/services/licensePrintInquiriesService";
import { AdminLicenseInquiriesView } from "./_components/AdminLicenseInquiriesView";
import type { LicensePrintInquiry } from "@/services/licensePrintInquiriesService";

export default async function LicenseInquiriesPage() {
    const inquiries: LicensePrintInquiry[] = await getLicensePrintInquiries();
    
    return <AdminLicenseInquiriesView initialInquiries={inquiries} />;
}
