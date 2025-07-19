
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { logSubmission } from '@/app/contact/_lib/logging';
import { addLlInquiry } from '@/services/llInquiriesService';
import { sendLlInquiryAdminEmail } from '../_lib/email-service';

const llInquirySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  applicationNo: z.string().min(1),
  dob: z.coerce.date(),
  mobileNumber: z.string().min(10),
  state: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = llInquirySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid input.', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    await addLlInquiry(parsed.data);

    // Send admin notification email, but don't block the user on it
    sendLlInquiryAdminEmail(parsed.data).catch(error => {
      logSubmission({
        level: 'error',
        message: 'Failed to send LL inquiry admin email.',
        data: { appNo: parsed.data.applicationNo, error: error.message },
      });
    });

    await logSubmission({
        level: 'info',
        message: 'LL Exam Result Inquiry.',
        data: { appNo: parsed.data.applicationNo },
    });

    return NextResponse.json({ message: 'Inquiry logged successfully.' }, { status: 200 });

  } catch (error: any) {
    await logSubmission({
      level: 'error',
      message: 'Error in /ll-exam-pass/api',
      data: { errorMessage: error.message },
    });
    return NextResponse.json({ message: 'An internal server error occurred while logging.' }, { status: 500 });
  }
}
