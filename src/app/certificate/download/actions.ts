
'use server';

import { findCertificate as findCertificateService } from '@/services/certificatesService';

export async function findCertificate(certNumber: string): Promise<{id: string} | null> {
    // Search by certificate number only, name is not required.
    const certificate = await findCertificateService(certNumber.trim(), '');
    if (certificate) {
        return { id: certificate.id };
    }
    return null;
}
