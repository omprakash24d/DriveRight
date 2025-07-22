
// import { chat } from '@/ai/flows/chatbot-flow';
import { logSubmission } from '@/app/contact/_lib/logging';
import { checkRateLimit } from '@/app/contact/_lib/rate-limiter';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

const ChatRequestSchema = z.object({
  history: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })
  ),
});

// Temporary fallback response for deployment
const generateFallbackResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('course') || lowerMessage.includes('learn')) {
    return "We offer comprehensive driving courses including Learner's License and permanent license training. Please contact us at +91-9060744449 for course details and enrollment.";
  }
  
  if (lowerMessage.includes('fee') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
    return "Our course fees are competitive and designed to provide excellent value. Please contact us directly for current pricing information.";
  }
  
  if (lowerMessage.includes('time') || lowerMessage.includes('duration')) {
    return "Course duration varies based on the type of license. Typically, our courses range from 15-30 days. Contact us for specific timelines.";
  }
  
  if (lowerMessage.includes('contact') || lowerMessage.includes('phone') || lowerMessage.includes('call')) {
    return "You can reach us at +91-9060744449 or visit our contact page for more information.";
  }
  
  return "Thank you for your interest in Driving School Arwal! For detailed information about our courses, fees, and enrollment, please contact us at +91-9060744449 or visit our contact page.";
};

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

    // Use fallback response instead of Genkit AI for deployment
    const lastUserMessage = parsed.data.history[parsed.data.history.length - 1]?.content || '';
    const response = generateFallbackResponse(lastUserMessage);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { message: 'An error occurred.' },
      { status: 500 }
    );
  }
}
