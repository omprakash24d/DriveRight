import { getRefresherRequestsAdmin } from "@/lib/admin-server-functions";
import { AdminRefresherRequestsView } from "./_components/AdminRefresherRequestsView";

interface RefresherRequestData {
  id: string;
  studentName: string;
  email: string;
  mobile: string;
  licenseNumber: string;
  reason: string;
  status: string;
  createdAt: Date | string;
  notes?: string;
  updatedAt?: Date | string | null;
}

export default async function AdminRefresherRequestsPage() {
  let requests: RefresherRequestData[] = [];

  try {
    // Try to fetch data using Admin SDK for better performance and reliability
    requests = await getRefresherRequestsAdmin();
  } catch (error) {
    console.error("Failed to fetch refresher requests via Admin SDK:", error);
    // Component will handle data fetching via client-side API if no initial data
  }

  // Serialize dates to ISO strings for client component props
  const serializableRequests = requests.map((req) => ({
    ...req,
    createdAt:
      req.createdAt instanceof Date
        ? req.createdAt.toISOString()
        : req.createdAt,
    updatedAt:
      req.updatedAt instanceof Date
        ? req.updatedAt.toISOString()
        : req.updatedAt,
  }));

  return <AdminRefresherRequestsView initialRequests={serializableRequests} />;
}
