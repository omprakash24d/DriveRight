
import { logSubmission } from '@/app/contact/_lib/logging'; // Using contact form logger
import { ACCEPTED_DOCUMENT_TYPES, MAX_FILE_SIZE } from '@/lib/constants';
import { db } from '@/lib/firebase';
import { uploadFileAdmin } from '@/lib/server-utils';
import { sanitize } from '@/lib/utils';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { sendEnrollmentAdminEmail, sendEnrollmentConfirmationEmail } from '../_lib/email-service';

const ENROLLMENTS_COLLECTION = 'enrollments';

// Server-side schema for robust validation
const formSchemaServer = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  mobileNumber: z.string().min(10),
  dateOfBirth: z.coerce.date(),
  state: z.string().min(1),
  address: z.string().min(10),
  vehicleType: z.enum(["hmv", "lmv", "mcwg", "lmv+mcwg", "others"]),
  documentId: z.string().nullable().optional().transform(val => val || ""),
  idProof: z.instanceof(File)
    .refine((file) => file.size > 0, "ID Proof is required.")
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`)
    .refine((file) => ACCEPTED_DOCUMENT_TYPES.includes(file.type), `Only ${ACCEPTED_DOCUMENT_TYPES.join(', ')} files are accepted.`),
  // The client sends the cropped photo as a Base64 Data URL string
  photoCropped: z.string().startsWith('data:image/', 'Cropped photo must be a valid data URL.'),
  paymentId: z.string().nullable().optional().transform(val => val || ""),
  orderId: z.string().nullable().optional().transform(val => val || ""),
  pricePaid: z.string().nullable().optional().transform(val => val || ""),
});


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // The client sends the original photo for cropping but we only need the cropped version on the server.
    // We receive the cropped version as a data URL string.
    const croppedPhotoDataUrl = formData.get('photoCropped') as string | null;
    
    const data = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      mobileNumber: formData.get('mobileNumber'),
      dateOfBirth: formData.get('dateOfBirth'),
      state: formData.get('state'),
      address: formData.get('address'),
      vehicleType: formData.get('vehicleType'),
      documentId: formData.get('documentId'),
      idProof: formData.get('idProof'),
      photoCropped: croppedPhotoDataUrl,
      paymentId: formData.get('paymentId'),
      orderId: formData.get('orderId'),
      pricePaid: formData.get('pricePaid'),
    };

    const parsed = formSchemaServer.safeParse(data);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid input.', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const requiredEnvVars = ['SMTP_USER', 'SMTP_PASS', 'FROM_EMAIL', 'TO_EMAIL'];
    if (requiredEnvVars.some(v => !process.env[v])) {
        await logSubmission({ level: 'error', message: 'SMTP environment variables are not set.', data: {} });
        return NextResponse.json({ message: 'Server is not configured correctly.' }, { status: 500 });
    }
    
    const { idProof, photoCropped, ...unSanitizedEnrollmentData } = parsed.data;

    // Sanitize text inputs before saving
    const enrollmentData = {
      ...unSanitizedEnrollmentData,
      fullName: sanitize(unSanitizedEnrollmentData.fullName),
      address: sanitize(unSanitizedEnrollmentData.address),
      documentId: unSanitizedEnrollmentData.documentId || "", // Ensure it's always a string, never undefined
    };

    const refId = `ENR-${Date.now()}`;
    const uniqueId = nanoid();

    // Convert the data URL to a Blob/File-like object for upload
    let photoCroppedUrl = '';
    let idProofUrl = '';
    
    try {
      // Validate Firebase configuration
      if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        throw new Error('Firebase Admin SDK not configured');
      }
      
      if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
        throw new Error('Firebase Storage bucket not configured');
      }
      
      const photoBlob = await (await fetch(photoCropped)).blob();
      const photoFile = new File([photoBlob], 'photo_cropped.jpg', { type: 'image/jpeg' });

      // --- Upload images to Firebase Storage using Admin SDK ---
      photoCroppedUrl = await uploadFileAdmin(photoFile, `enrollments/${uniqueId}/photo_cropped.jpg`);
      idProofUrl = await uploadFileAdmin(idProof, `enrollments/${uniqueId}/id_proof.${idProof.name.split('.').pop()}`);

    } catch (uploadError: any) {
      console.error('Firebase Storage upload error:', uploadError);
      await logSubmission({
        level: 'error',
        message: 'File upload to Firebase Storage failed',
        data: { 
          errorMessage: uploadError.message,
          uniqueId,
          refId,
          fileName: idProof.name,
          fileSize: idProof.size,
          fileType: idProof.type,
          hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
          hasStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        },
      });
      return NextResponse.json(
        { message: 'File upload failed. Please check your Firebase configuration and try again.' },
        { status: 500 }
      );
    }

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
      data: { ...enrollmentData, dateOfBirth: enrollmentData.dateOfBirth, photoCroppedUrl },
      refId,
      idProofFile: idProof,
    };
    const userEmailPayload = {
      data: enrollmentData,
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
    return NextResponse.json({ message: 'An internal server error occurred. Please try again.' }, { status: 500 });
  }
}
