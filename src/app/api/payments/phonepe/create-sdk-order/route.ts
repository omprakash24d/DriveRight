/**
 * PhonePe SDK Order Creation API Route
 * For mobile app integration - generates order token
 * Based on official PhonePe Node.js SDK
 */

import PhonePeSDKConfiguration from '@/config/phonepeSDKConfig';
import PhonePeSDKService, { convertRupeesToPaisa } from '@/services/phonepeSDKService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for SDK order creation
const sdkOrderSchema = z.object({
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
    platform: z.string().default('mobile'),
    appVersion: z.string().optional(),
  }).optional(),
  redirectUrl: z.string().url().optional(), // Optional, will use default if not provided
  merchantOrderId: z.string().optional(), // Optional, will generate UUID if not provided
});

type SDKOrderRequest = z.infer<typeof sdkOrderSchema>;

export async function POST(request: NextRequest) {
  try {
    console.log('📱 PhonePe SDK order creation started');

    // Parse and validate request body
    const body = await request.json();
    const validatedData = sdkOrderSchema.parse(body);

    console.log('✅ SDK order request validation successful:', {
      serviceId: validatedData.serviceId,
      amount: validatedData.amount,
      currency: validatedData.currency,
      platform: validatedData.metadata?.platform || 'mobile'
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

    console.log('📱 Creating PhonePe SDK order:', {
      amount: validatedData.amount,
      amountInPaisa,
      serviceId: validatedData.serviceId,
      redirectUrl: redirectUrl.substring(0, 50) + '...'
    });

    // Prepare SDK order request
    const sdkOrderRequest = {
      amount: amountInPaisa,
      redirectUrl,
      merchantOrderId: validatedData.merchantOrderId
    };

    // Create SDK order using PhonePe SDK
    const orderResponse = await phonepeService.createSDKOrder(sdkOrderRequest);

    console.log('✅ PhonePe SDK order created successfully:', {
      merchantOrderId: orderResponse.merchantOrderId,
      orderId: orderResponse.orderId,
      state: orderResponse.state
    });

    // Return success response with order token
    return NextResponse.json({
      success: true,
      gateway: 'phonepe',
      merchantOrderId: orderResponse.merchantOrderId,
      orderId: orderResponse.orderId,
      token: orderResponse.token,
      state: orderResponse.state,
      amount: validatedData.amount,
      amountInPaisa: amountInPaisa,
      currency: validatedData.currency,
      expireAt: orderResponse.expireAt,
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
      metadata: {
        ...validatedData.metadata,
        createdAt: new Date().toISOString(),
        orderType: 'SDK_ORDER'
      }
    });

  } catch (error) {
    console.error('❌ PhonePe SDK order creation failed:', error);

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
        error: 'SDK order creation failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'SDK_ORDER_CREATION_FAILED'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for SDK configuration and status
export async function GET(request: NextRequest) {
  try {
    const config = PhonePeSDKConfiguration.getInstance();
    const configStatus = config.getConfigStatus();

    return NextResponse.json({
      success: true,
      ...configStatus,
      hasWebhookCredentials: config.hasWebhookCredentials(),
      redirectUrls: config.isConfigured() ? config.getRedirectUrls() : null,
      supportedPlatforms: ['android', 'ios', 'mobile_web'],
      sdkVersion: {
        nodeSDK: 'pg-sdk-node',
        supportedMobileSDKs: {
          android: 'PhonePe Android SDK',
          ios: 'PhonePe iOS SDK'
        }
      },
      integrationInfo: {
        orderTokenUsage: 'Use the returned token with PhonePe Mobile SDK to initiate payment',
        tokenExpiry: 'Token expires based on order expiry time',
        requiredFields: ['token', 'merchantOrderId', 'amount']
      }
    });

  } catch (error) {
    console.error('❌ Failed to get PhonePe SDK configuration status:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get SDK configuration status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
