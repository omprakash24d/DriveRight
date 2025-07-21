
import { getRefresherRequests } from "@/services/refresherRequestsService";
import { AdminRefresherRequestsView } from "./_components/AdminRefresherRequestsView";
import type { RefresherRequest } from "@/services/refresherRequestsService";
import type { Timestamp } from "firebase/firestore";

export default async function AdminRefresherRequestsPage() {
    const requests: RefresherRequest[] = await getRefresherRequests();

    // Serialize Firestore Timestamps to ISO strings for client component props
    const serializableRequests = requests.map(req => ({
      ...req,
      createdAt: (req.createdAt as Timestamp).toDate().toISOString(),
    }));


    return <AdminRefresherRequestsView initialRequests={serializableRequests} />;
}
