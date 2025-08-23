import { unifiedPaymentService } from '@/services/unifiedPaymentService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createPhonePeOrderSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  merchantTransactionId: z.string().min(1, 'Transaction ID is required'),
  customerInfo: z.object({
    name: z.string().min(1, 'Customer name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Valid phone number is required')
  }),
  callbackUrl: z.string().url('Valid callback URL is required'),
  redirectUrl: z.string().url('Valid redirect URL is required')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPhonePeOrderSchema.parse(body);

    const { amount, merchantTransactionId, customerInfo, callbackUrl, redirectUrl } = validatedData;

    // Create PhonePe payment request
    const response = await unifiedPaymentService.initiatePayment({
      orderId: merchantTransactionId,
      amount: amount,
      userDetails: {
        name: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone
      },
      redirectUrl,
      callbackUrl
    });

    if (response.success) {
      return NextResponse.json({
        success: true,
        data: {
          paymentUrl: response.redirectUrl,
          merchantTransactionId,
          merchantId: 'phonepe'
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: response.error || 'Failed to initiate PhonePe payment'
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('PhonePe order creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create PhonePe order'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantTransactionId = searchParams.get('merchantTransactionId');

    if (!merchantTransactionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Merchant transaction ID is required'
        },
        { status: 400 }
      );
    }

    const status = await unifiedPaymentService.checkPaymentStatus(merchantTransactionId);

    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('PhonePe status check error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check payment status'
      },
      { status: 500 }
    );
  }
}
