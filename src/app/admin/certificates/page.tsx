
import { getCertificates } from "@/services/certificatesService";
import { AdminCertificatesView } from "./_components/AdminCertificatesView";
import type { Certificate } from "@/services/certificatesService";
import type { Timestamp } from "firebase/firestore";

// This is now a Server Component that fetches data securely on the server.
export default async function AdminCertificatesPage() {
    const certificates: Certificate[] = await getCertificates();
    
    // Serialize Firestore Timestamps to ISO strings for client component props
    const serializableCertificates = certificates.map(cert => ({
      ...cert,
      issueDate: (cert.issueDate as Timestamp).toDate().toISOString(),
    }));

    return <AdminCertificatesView initialCertificates={serializableCertificates} />;
}
