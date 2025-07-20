
import { chat } from '@/ai/flows/chatbot-flow';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { checkRateLimit } from '@/app/contact/_lib/rate-limiter';
import { logSubmission } from '@/app/contact/_lib/logging';

const ChatRequestSchema = z.object({
  history: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })
  ),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  
  try {
    const isRateLimited = await checkRateLimit(ip);
    if (isRateLimited) {
      await logSubmission({
        level: 'warn',
        message: 'Chatbot rate limit exceeded',
        data: { ip, userAgent: req.headers.get('user-agent') },
      });
      return NextResponse.json(
        { message: 'You are sending messages too quickly. Please try again in a few minutes.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { response } = await chat({ history: parsed.data.history });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { message: 'An error occurred.' },
      { status: 500 }
    );
  }
}
