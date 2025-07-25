
import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { Timestamp } from 'firebase-admin/firestore';
import { sendCertificateNotificationEmail } from '@/app/certificate/_lib/email-service';
import { addLog } from '@/services/auditLogService';
import { getStudent } from '@/services/studentsService';
import { schoolConfig } from '@/lib/config';
import { verifyAdmin } from '@/lib/admin-auth';

const CERTIFICATES_COLLECTION = 'certificates';

const newCertificateSchema = z.object({
    studentId: z.string(),
    studentName: z.string(),
    studentEmail: z.string().email(),
    course: z.string(),
    type: z.enum(["LL", "DL"]),
});

export async function POST(request: NextRequest) {
    try {
        await verifyAdmin(); // Middleware already runs, but this is an extra layer for Server Action-like safety.
        const adminDb = getFirestore(getAdminApp()!);
        
        const body = await request.json();
        const certData = newCertificateSchema.parse(body);

        const appBaseUrl = schoolConfig.appBaseUrl;

        const studentProfile = await getStudent(certData.studentId);
        
        const newCert = {
            studentId: certData.studentId,
            studentName: certData.studentName,
            studentEmail: certData.studentEmail,
            course: certData.course,
            type: certData.type,
            studentName_lowercase: certData.studentName.toLowerCase(),
            studentAvatar: studentProfile?.avatar || '',
            status: 'Issued' as const,
            issueDate: Timestamp.now(),
            certificateUrl: '#',
            certNumber: 'PENDING',
        };

        const docRef = await adminDb.collection(CERTIFICATES_COLLECTION).add(newCert);
        
        const certNumber = `${certData.type}-${docRef.id.substring(0, 8).toUpperCase()}`;
        const certificateUrl = `${appBaseUrl}/certificate/view/${docRef.id}`;
        
        await docRef.update({
            certNumber: certNumber,
            certificateUrl: certificateUrl
        });

        await sendCertificateNotificationEmail({
            to: certData.studentEmail,
            studentName: certData.studentName,
            course: certData.course,
            certNumber: certNumber,
            certificateUrl: certificateUrl,
        });

        await addLog('Generated Certificate', `For: ${certData.studentName}, Cert No: ${certNumber}`);
        
        return NextResponse.json({ success: true, id: docRef.id });

    } catch (error: any) {
        console.error("Error in POST /api/admin/certificates:", error);
        
        let status = 500;
        if (error.message.startsWith('Unauthorized')) status = 401;
        if (error.message.startsWith('Forbidden')) status = 403;

        return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status });
    }
}


export async function DELETE(request: NextRequest) {
    try {
        await verifyAdmin();
        const adminDb = getFirestore(getAdminApp()!);

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 });
        }

        const docRef = adminDb.collection(CERTIFICATES_COLLECTION).doc(id);
        const docSnap = await docRef.get();
        const certNumber = docSnap.exists ? docSnap.data()?.certNumber : `ID: ${id}`;

        await docRef.delete();
        await addLog('Deleted Certificate', `Cert No: ${certNumber}`);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error in DELETE /api/admin/certificates:", error);

        let status = 500;
        if (error.message.startsWith('Unauthorized')) status = 401;
        if (error.message.startsWith('Forbidden')) status = 403;

        return NextResponse.json({ error: error.message || 'An unknown error occurred.' }, { status });
    }
}
