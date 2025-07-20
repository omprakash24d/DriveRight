
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { logSubmission } from '@/app/contact/_lib/logging';
import { addLicensePrintInquiry } from '@/services/licensePrintInquiriesService';
import { sendLicensePrintAdminEmail } from '@/app/license-print/_lib/email-service';
import { sanitize } from '@/lib/utils';

const licensePrintSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  dlNumber: z.string().min(1),
  dob: z.coerce.date(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = licensePrintSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid input.', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const sanitizedData = {
      ...parsed.data,
      name: sanitize(parsed.data.name),
      dlNumber: sanitize(parsed.data.dlNumber),
    };

    await addLicensePrintInquiry(sanitizedData);

    sendLicensePrintAdminEmail(sanitizedData).catch(error => {
      logSubmission({
        level: 'error',
        message: 'Failed to send DL Print inquiry admin email.',
        data: { dlNumber: sanitizedData.dlNumber, error: error.message },
      });
    });

    await logSubmission({
        level: 'info',
        message: 'New Driving License Print Request.',
        data: { dlNumber: sanitizedData.dlNumber },
    });

    return NextResponse.json({ message: 'Inquiry submitted successfully.' }, { status: 200 });

  } catch (error: any) {
    await logSubmission({
      level: 'error',
      message: 'Error in /license-print/api',
      data: { errorMessage: error.message },
    });
    return NextResponse.json({ message: 'An internal server error occurred.' }, { status: 500 });
  }
}
