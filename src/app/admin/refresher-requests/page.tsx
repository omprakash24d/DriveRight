
import { getRefresherRequests } from "@/services/refresherRequestsService";
import { AdminRefresherRequestsView } from "./_components/AdminRefresherRequestsView";
import type { RefresherRequest } from "@/services/refresherRequestsService";

export default async function AdminRefresherRequestsPage() {
    const requests: RefresherRequest[] = await getRefresherRequests();

    return <AdminRefresherRequestsView initialRequests={requests} />;
}
