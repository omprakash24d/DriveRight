/**
 * PhonePe Payment Initiation API Route
 * Based on official PhonePe Node.js SDK
 */

import PhonePeSDKConfiguration from '@/config/phonepeSDKConfig';
import PhonePeSDKService, { convertRupeesToPaisa } from '@/services/phonepeSDKService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for payment initiation
const paymentInitiationSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  currency: z.string().default('INR'),
  customerInfo: z.object({
    name: z.string().min(1, 'Customer name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
  }),
  serviceTitle: z.string().min(1, 'Service title is required'),
  metadata: z.object({
    bookingId: z.string().optional(),
    serviceType: z.string().optional(),
    userAgent: z.string().optional(),
    referrer: z.string().optional(),
    source: z.string().optional(),
  }).optional(),
  redirectUrl: z.string().url().optional(), // Optional, will use default if not provided
});

type PaymentInitiationRequest = z.infer<typeof paymentInitiationSchema>;

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 PhonePe SDK payment initiation started');

    // Parse and validate request body
    const body = await request.json();
    const validatedData = paymentInitiationSchema.parse(body);

    console.log('✅ Request validation successful:', {
      serviceId: validatedData.serviceId,
      amount: validatedData.amount,
      currency: validatedData.currency,
      customerEmail: validatedData.customerInfo.email
    });

    // Initialize PhonePe SDK configuration
    const config = PhonePeSDKConfiguration.getInstance();
    
    if (!config.isConfigured()) {
      console.error('❌ PhonePe SDK not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'PhonePe payment gateway not configured',
          code: 'SDK_NOT_CONFIGURED'
        },
        { status: 503 }
      );
    }

    // Validate configuration
    try {
      config.validateConfiguration();
    } catch (configError) {
      console.error('❌ PhonePe SDK configuration invalid:', configError);
      return NextResponse.json(
        {
          success: false,
          error: 'PhonePe payment gateway configuration invalid',
          code: 'SDK_CONFIG_INVALID'
        },
        { status: 503 }
      );
    }

    // Get PhonePe SDK service instance
    const phonepeConfig = config.getConfig()!;
    const phonepeService = PhonePeSDKService.getInstance(phonepeConfig);

    // Convert amount to paisa (PhonePe SDK requirement)
    const amountInPaisa = convertRupeesToPaisa(validatedData.amount);

    // Determine redirect URL
    const redirectUrl = validatedData.redirectUrl || config.getRedirectUrls().success;

    // Prepare payment request
    const paymentRequest = {
      amount: amountInPaisa,
      redirectUrl,
      customerInfo: validatedData.customerInfo,
      metadata: {
        udf1: validatedData.serviceId,
        udf2: validatedData.serviceTitle,
        udf3: validatedData.metadata?.bookingId,
        udf4: validatedData.customerInfo.email,
        udf5: JSON.stringify({
          currency: validatedData.currency,
          source: validatedData.metadata?.source || 'web',
          timestamp: new Date().toISOString()
        })
      }
    };

    console.log('💳 Initiating PhonePe payment with SDK:', {
      amount: validatedData.amount,
      amountInPaisa,
      serviceId: validatedData.serviceId,
      redirectUrl: redirectUrl.substring(0, 50) + '...'
    });

    // Initiate payment using PhonePe SDK
    const paymentResponse = await phonepeService.initiatePayment(paymentRequest);

    console.log('✅ PhonePe payment initiated successfully:', {
      merchantOrderId: paymentResponse.merchantOrderId,
      orderId: paymentResponse.orderId,
      state: paymentResponse.state
    });

    // Return success response
    return NextResponse.json({
      success: true,
      gateway: 'phonepe',
      merchantOrderId: paymentResponse.merchantOrderId,
      orderId: paymentResponse.orderId,
      checkoutUrl: paymentResponse.checkoutUrl,
      state: paymentResponse.state,
      amount: validatedData.amount,
      amountInPaisa: paymentResponse.amount,
      currency: validatedData.currency,
      expireAt: paymentResponse.expireAt,
      environment: config.getEnvironment(),
      redirectUrl,
      customerInfo: {
        name: validatedData.customerInfo.name,
        email: validatedData.customerInfo.email,
        phone: validatedData.customerInfo.phone
      },
      serviceInfo: {
        id: validatedData.serviceId,
        title: validatedData.serviceTitle
      },
      metadata: validatedData.metadata
    });

  } catch (error) {
    console.error('❌ PhonePe payment initiation failed:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: firstError.message,
          field: firstError.path.join('.'),
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Handle PhonePe SDK errors
    if (error instanceof Error && error.message.includes('PhonePe API Error')) {
      return NextResponse.json(
        {
          success: false,
          error: 'PhonePe service temporarily unavailable',
          details: error.message,
          code: 'PHONEPE_API_ERROR'
        },
        { status: 502 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'Payment initiation failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'PAYMENT_INITIATION_FAILED'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for configuration status
export async function GET(request: NextRequest) {
  try {
    const config = PhonePeSDKConfiguration.getInstance();
    const configStatus = config.getConfigStatus();

    return NextResponse.json({
      success: true,
      ...configStatus,
      hasWebhookCredentials: config.hasWebhookCredentials(),
      redirectUrls: config.isConfigured() ? config.getRedirectUrls() : null,
      webhookUrl: config.isConfigured() ? config.getWebhookUrl() : null
    });

  } catch (error) {
    console.error('❌ Failed to get PhonePe configuration status:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get configuration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
