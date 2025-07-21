
import { getTrainingServices } from "@/services/quickServicesService";
import { AdminTrainingServicesView } from "./_components/AdminTrainingServicesView";
import type { TrainingService } from "@/services/quickServicesService";

export default async function AdminTrainingServicesPage() {
    const services: TrainingService[] = await getTrainingServices();
    
    return <AdminTrainingServicesView initialServices={services} />;
}
