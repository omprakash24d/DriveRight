import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { nanoid } from 'nanoid';
import { z } from 'zod';

const createOrderSchema = z.object({
  amount: z.number().int().positive('Amount must be a positive integer.'),
  currency: z.string().length(3, 'Currency must be a 3-letter ISO code.'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate input using Zod
    const validationResult = createOrderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input.', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { amount, currency } = validationResult.data;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay API keys are not configured on the server.');
      return NextResponse.json(
        { message: 'Payment provider is not configured correctly.' },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount, // Amount is already in paise from the client
      currency,
      receipt: `receipt_order_${nanoid(8)}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return NextResponse.json(
        { message: 'Failed to create Razorpay order.' },
        { status: 502 } // Bad Gateway, as it's an issue with the upstream service
      );
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    
    // Check if it's a Razorpay-specific error
    if (error.statusCode) {
      return NextResponse.json(
        { message: error.error?.description || 'An error occurred with the payment provider.' },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}
