import { getLlInquiriesAdmin } from "@/lib/admin-server-functions";
import { AdminLlInquiriesView } from "./_components/AdminLlInquiriesView";

interface LlInquiryData {
  id: string;
  name: string;
  email: string;
  applicationNo: string;
  dob: string;
  mobileNumber: string;
  state: string;
  status: string;
  notes: string;
  timestamp: Date | string;
}

export default async function LlInquiriesPage() {
  let inquiries: LlInquiryData[] = [];

  try {
    // Try to fetch data using Admin SDK for better performance and reliability
    inquiries = await getLlInquiriesAdmin();
  } catch (error) {
    console.error("Failed to fetch LL inquiries via Admin SDK:", error);
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

  return <AdminLlInquiriesView initialInquiries={serializableInquiries} />;
}
