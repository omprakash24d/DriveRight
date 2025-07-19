
"use server";

import { findCertificate as findCertificateService } from '@/services/certificatesService';

export interface VerificationResult {
    status: 'valid' | 'invalid' | 'error';
    message?: string;
    certificateId?: string;
}

/**
 * Verifies a certificate by its number. This is a server action.
 * @param code The certificate number to verify.
 * @returns A promise that resolves with the verification result.
 */
export async function verifyCertificate(code: string): Promise<VerificationResult> {
    const trimmedCode = code.trim();

    if (!trimmedCode) {
        return { status: 'invalid', message: "No certificate code provided." };
    }

    try {
        const certificate = await findCertificateService(trimmedCode, ''); // Name is not used for this lookup

        if (!certificate) {
            return { 
                status: 'invalid', 
                message: 'Certificate not found or details are incorrect. Please double-check the code or contact the issuing authority if you believe this is an error.' 
            };
        }

        return {
            status: 'valid',
            certificateId: certificate.id
        };

    } catch (error: any) {
        let errorMessage = 'An unexpected error occurred during verification.';
        if (error.code === 'permission-denied') {
            errorMessage = 'Permission denied. Please check Firestore security rules for the certificates collection.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        return { 
            status: 'error', 
            message: errorMessage
        };
    }
}
