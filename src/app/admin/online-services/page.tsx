
import { getOnlineServices } from "@/services/quickServicesService";
import { AdminOnlineServicesView } from "./_components/AdminOnlineServicesView";
import type { OnlineService } from "@/services/quickServicesService";

export default async function AdminOnlineServicesPage() {
    const services: OnlineService[] = await getOnlineServices();
    
    return <AdminOnlineServicesView initialServices={services} />;
}
