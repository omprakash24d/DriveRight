
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { sendRefresherAdminEmail, sendRefresherConfirmationEmail } from '../_lib/email-service';
import { logSubmission } from '@/app/contact/_lib/logging';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sanitize } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_DOCUMENT_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const REFRESHER_REQUESTS_COLLECTION = 'refresherRequests';

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  mobileNo: z.string().min(10),
  dob: z.coerce.date(),
  vehicleType: z.enum(["hmv", "lmv"]),
  reason: z.string().min(10),
  licenseUpload: z.instanceof(File).refine(f => f.size > 0).refine(f => f.size <= MAX_FILE_SIZE).refine(f => ACCEPTED_DOCUMENT_TYPES.includes(f.type)),
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());

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

    const { licenseUpload, ...unSanitizedRequestData } = parsed.data;

    const requestData = {
        ...unSanitizedRequestData,
        name: sanitize(unSanitizedRequestData.name),
        reason: sanitize(unSanitizedRequestData.reason),
    };

    const refId = `RFR-${Date.now()}`;

    // Add to firestore
    await addDoc(collection(db, REFRESHER_REQUESTS_COLLECTION), {
        refId,
        ...requestData,
        dob: requestData.dob.toISOString(), // Store as string
        status: 'Pending',
        createdAt: Timestamp.now(),
    });
    
    const adminEmailPayload = {
        data: { ...requestData, dob: requestData.dob }, // Ensure dob is a Date object for the emailer
        refId,
        file: licenseUpload,
    };
    const userEmailPayload = {
        data: requestData,
        refId,
    };

    // Emails can be sent in parallel
    await Promise.all([
      sendRefresherAdminEmail(adminEmailPayload),
      sendRefresherConfirmationEmail(userEmailPayload),
    ]);
    
    await logSubmission({
        level: 'info',
        message: 'New refresher request successful.',
        data: { refId, name: parsed.data.name },
    });

    return NextResponse.json({ message: 'Request successful!', refId }, { status: 200 });

  } catch (error: any) {
    await logSubmission({
      level: 'error',
      message: 'Error in /refresher/api',
      data: { errorMessage: error.message },
    });
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
