import { getLicensePrintInquiriesAdmin } from "@/lib/admin-server-functions";
import { AdminLicenseInquiriesView } from "./_components/AdminLicenseInquiriesView";

interface LicensePrintInquiryData {
  id: string;
  name: string;
  email: string;
  dlNumber: string;
  dob: string;
  mobileNumber: string;
  address: string;
  state: string;
  status: string;
  notes: string;
  timestamp: Date | string;
}

export default async function LicenseInquiriesPage() {
  let inquiries: LicensePrintInquiryData[] = [];

  try {
    // Try to fetch data using Admin SDK for better performance and reliability
    inquiries = await getLicensePrintInquiriesAdmin();
  } catch (error) {
    console.error(
      "Failed to fetch license print inquiries via Admin SDK:",
      error
    );
    // Component will handle data fetching via client-side API if no initial data
  }

  // Serialize dates to ISO strings for client component props
  const serializableInquiries = inquiries.map((inquiry) => ({
    ...inquiry,
    timestamp:
      inquiry.timestamp instanceof Date
        ? inquiry.timestamp.toISOString()
        : inquiry.timestamp,
  }));

  return <AdminLicenseInquiriesView initialInquiries={serializableInquiries} />;
}
