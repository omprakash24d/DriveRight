
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { sendEnrollmentAdminEmail, sendEnrollmentConfirmationEmail } from '../_lib/email-service';
import { logSubmission } from '@/app/contact/_lib/logging'; // Re-using contact form logger
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { nanoid } from 'nanoid';
import { MAX_FILE_SIZE, ACCEPTED_DOCUMENT_TYPES } from '@/lib/constants';

const ENROLLMENTS_COLLECTION = 'enrollments';

const formSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  mobileNumber: z.string().min(10),
  dateOfBirth: z.coerce.date(),
  state: z.string().min(1),
  address: z.string().min(10),
  vehicleType: z.enum(["hmv", "lmv", "mcwg", "lmv+mcwg", "others"]),
  documentId: z.string().optional(),
  idProof: z.custom<File>()
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 10MB.`)
    .refine((file) => ACCEPTED_DOCUMENT_TYPES.includes(file?.type), ".jpg, .jpeg, .png and .pdf files are accepted."),
  photoCropped: z.string().startsWith('data:image/'),
  photoOriginal: z.string().startsWith('data:image/'),
  paymentId: z.string().optional(),
  orderId: z.string().optional(),
  pricePaid: z.string().optional(),
});


async function uploadToStorage(dataUri: string, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadString(storageRef, dataUri, 'data_url');
    return getDownloadURL(snapshot.ref);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());
    data.idProof = formData.get('idProof'); 

    const parsed = formSchema.safeParse(data);

    if (!parsed.success) {
      console.log(parsed.error.flatten().fieldErrors);
      return NextResponse.json(
        { message: 'Invalid input.', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const requiredEnvVars = ['SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL', 'TO_EMAIL'];
    if (requiredEnvVars.some(v => !process.env[v])) {
        await logSubmission({ level: 'error', message: 'SMTP environment variables are not set.', data: {} });
        return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
    }

    const { idProof, photoCropped, photoOriginal, ...enrollmentData } = parsed.data;
    const refId = `ENR-${Date.now()}`;
    const uniqueId = nanoid();

    // --- Upload images to Firebase Storage ---
    const photoCroppedUrl = await uploadToStorage(photoCropped, `enrollments/${uniqueId}/photo_cropped.jpg`);
    const idProofUrl = await uploadToStorage(
        `data:${idProof.type};base64,${Buffer.from(await idProof.arrayBuffer()).toString('base64')}`,
        `enrollments/${uniqueId}/id_proof.${idProof.name.split('.').pop()}`
    );


    // Add to firestore with public URLs
    await addDoc(collection(db, ENROLLMENTS_COLLECTION), {
      ...enrollmentData,
      photoCroppedUrl,
      idProofUrl,
      dateOfBirth: enrollmentData.dateOfBirth.toISOString(),
      refId,
      status: 'Pending',
      createdAt: Timestamp.now(),
      adminRemarks: '',
    });
    
    const adminEmailPayload = {
      data: parsed.data,
      refId,
      idProofFile: idProof,
    };
    const userEmailPayload = {
      data: parsed.data,
      refId,
    }

    // Send emails but don't block the response
    sendEnrollmentAdminEmail(adminEmailPayload).catch(e => console.error("Admin email failed to send:", e));
    sendEnrollmentConfirmationEmail(userEmailPayload).catch(e => console.error("User confirmation email failed to send:", e));


    await logSubmission({
        level: 'info',
        message: 'New enrollment submission successful.',
        data: { refId, name: parsed.data.fullName },
    });

    return NextResponse.json({ message: 'Enrollment successful!', refId }, { status: 200 });

  } catch (error: any) {
    await logSubmission({
      level: 'error',
      message: 'Error in /enroll/api',
      data: { errorMessage: error.message },
    });
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
