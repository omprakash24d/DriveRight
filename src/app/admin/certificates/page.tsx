
import { getCertificates } from "@/services/certificatesService";
import { AdminCertificatesView } from "./_components/AdminCertificatesView";
import type { Certificate } from "@/services/certificatesService";

// This is now a Server Component that fetches data securely on the server.
export default async function AdminCertificatesPage() {
    const certificates: Certificate[] = await getCertificates();
    
    return <AdminCertificatesView initialCertificates={certificates} />;
}
