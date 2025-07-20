
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '../_lib/rate-limiter';
import { analyzeSubmission } from '../_ai/spam-filter';
import { personalizeResponse } from '../_ai/personalize-response';
import { logSubmission } from '../_lib/logging';
import { sendAdminEmail, sendConfirmationEmail } from '../_lib/email-service';
import { sanitize } from '@/lib/utils';

// Zod schema for input validation
const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.').trim(),
  email: z.string().email('Please enter a valid email address.').trim(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters.')
    .max(15000, 'Message must not exceed 15000 characters.')
    .trim(),
  honeypot: z.string().optional(),
});

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

  try {
    const isRateLimited = await checkRateLimit(ip);
    if (isRateLimited) {
      await logSubmission({
        level: 'warn',
        message: 'Contact form rate limit exceeded',
        data: { ip, userAgent: req.headers.get('user-agent') },
      });
      return NextResponse.json(
        { message: 'Too many requests, please try again later.' },
        { status: 429 }
      );
    }

    const requiredEnvVars = [
      'SMTP_USER',
      'SMTP_PASS',
      'FROM_EMAIL',
      'TO_EMAIL',
      'GOOGLE_API_KEY',
    ];
    const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);

    if (missingEnvVars.length > 0) {
      const errorMessage = `Server configuration error: The following environment variables are missing: ${missingEnvVars.join(
        ', '
      )}. Please ensure they are set in your .env.local file and restart the server.`;
      await logSubmission({ level: 'error', message: errorMessage, data: {} });
      // Return a generic error to the client
      return NextResponse.json({ message: "Server is not configured correctly. Please contact support." }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('attachment') as File | null;

    const body = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
      honeypot: formData.get('honeypot'),
    };

    const parsed = contactFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid input.', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    // Sanitize inputs
    const sanitizedData = {
        name: sanitize(parsed.data.name),
        email: parsed.data.email, // Email is validated, not sanitized
        message: sanitize(parsed.data.message),
        honeypot: parsed.data.honeypot
    };


    if (file && file.size > MAX_ATTACHMENT_SIZE) {
      return NextResponse.json(
        { message: `File size exceeds the ${MAX_ATTACHMENT_SIZE / 1024 / 1024}MB limit.` },
        { status: 400 }
      );
    }

    const { name, email, message, honeypot } = sanitizedData;

    const spamAnalysis = await analyzeSubmission({
      ipAddress: ip,
      content: message,
      honeypotFilled: !!honeypot,
    });

    if (spamAnalysis.isSpam) {
      await logSubmission({
        level: 'info',
        message: 'Spam submission detected and blocked.',
        data: { reason: spamAnalysis.reason, ip },
      });
      // To prevent bots from knowing they were blocked, we return a success message.
      const personalizedResponseData = await personalizeResponse({ message: 'spam' });
      return NextResponse.json(
        {
          message: 'Your message has been sent successfully.',
          personalizedMessage: personalizedResponseData.personalizedMessage,
        },
        { status: 200 }
      );
    }

    const emailPayload = { data: sanitizedData, file };

    // Send emails
    try {
      await sendAdminEmail(emailPayload);
      await logSubmission({
        level: 'info',
        message: 'Successfully sent submission email to administrator.',
        data: { ip, to: process.env.TO_EMAIL },
      });
    } catch (error: any) {
      // Still log the admin email failure, but re-throw the error to be
      // caught by the main catch block, as this email is critical.
      await logSubmission({
        level: 'error',
        message: 'Failed to send submission email to administrator.',
        data: { ip, error: error.message },
      });
       throw error;
    }
    
    try {
      await sendConfirmationEmail(emailPayload);
       await logSubmission({
        level: 'info',
        message: 'Successfully sent auto-reply email to user.',
        data: { email: sanitizedData.email },
      });
    } catch(error: any) {
       await logSubmission({
        level: 'warn',
        message: 'Failed to send auto-reply email to user.',
        data: { email: sanitizedData.email, error: error.message },
      });
      // Do not re-throw, as the main submission was successful
    }

    const personalizedResponseData = await personalizeResponse({ message });

    return NextResponse.json(
      {
        message: 'Your message has been sent successfully.',
        personalizedMessage: personalizedResponseData.personalizedMessage,
      },
      { status: 200 }
    );
  } catch (error: any) {
    await logSubmission({
      level: 'error',
      message: 'Detailed error in /contact/api',
      data: { 
        errorMessage: error.message,
        errorCode: error.code,
        fullError: error.toString()
      },
    });

    // Return a generic, safe error message to the client.
    return NextResponse.json(
      { message: 'An internal server error occurred. Please try again later or contact support directly.' },
      { status: 500 }
    );
  }
}
