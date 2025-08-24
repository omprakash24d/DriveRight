/**
 * PhonePe Order Status API Route
 * Based on official PhonePe Node.js SDK
 */

import PhonePeSDKConfiguration from '@/config/phonepeSDKConfig';
import PhonePeSDKService from '@/services/phonepeSDKService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for order status request
const orderStatusSchema = z.object({
  merchantOrderId: z.string().min(1, 'Merchant Order ID is required'),
  includeAllDetails: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 PhonePe order status check started');

    // Parse and validate request body
    const body = await request.json();
    const validatedData = orderStatusSchema.parse(body);

    console.log('✅ Request validation successful:', {
      merchantOrderId: validatedData.merchantOrderId,
      includeAllDetails: validatedData.includeAllDetails
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

    // Get PhonePe SDK service instance
    const phonepeConfig = config.getConfig()!;
    const phonepeService = PhonePeSDKService.getInstance(phonepeConfig);

    console.log('🔍 Checking order status with PhonePe SDK:', {
      merchantOrderId: validatedData.merchantOrderId
    });

    // Check order status using PhonePe SDK
    const statusResponse = await phonepeService.getOrderStatus(
      validatedData.merchantOrderId,
      validatedData.includeAllDetails
    );

    console.log('✅ PhonePe order status retrieved:', {
      merchantOrderId: validatedData.merchantOrderId,
      orderId: statusResponse.orderId,
      state: statusResponse.state,
      amount: statusResponse.amount
    });

    // Return success response
    return NextResponse.json({
      success: true,
      merchantOrderId: validatedData.merchantOrderId,
      orderId: statusResponse.orderId,
      state: statusResponse.state,
      amount: statusResponse.amount,
      amountInRupees: statusResponse.amount / 100, // Convert from paisa to rupees
      expireAt: statusResponse.expireAt,
      metaInfo: statusResponse.metaInfo,
      paymentDetails: statusResponse.paymentDetails,
      environment: config.getEnvironment(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ PhonePe order status check failed:', error);

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
        error: 'Order status check failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'ORDER_STATUS_CHECK_FAILED'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for order status (query parameter based)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const merchantOrderId = url.searchParams.get('merchantOrderId');
    const includeAllDetails = url.searchParams.get('includeAllDetails') === 'true';

    if (!merchantOrderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Merchant Order ID is required',
          code: 'MISSING_ORDER_ID'
        },
        { status: 400 }
      );
    }

    console.log('🔍 PhonePe order status check (GET) started:', {
      merchantOrderId,
      includeAllDetails
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

    // Get PhonePe SDK service instance
    const phonepeConfig = config.getConfig()!;
    const phonepeService = PhonePeSDKService.getInstance(phonepeConfig);

    // Check order status using PhonePe SDK
    const statusResponse = await phonepeService.getOrderStatus(
      merchantOrderId,
      includeAllDetails
    );

    console.log('✅ PhonePe order status retrieved (GET):', {
      merchantOrderId,
      orderId: statusResponse.orderId,
      state: statusResponse.state
    });

    // Return success response
    return NextResponse.json({
      success: true,
      merchantOrderId,
      orderId: statusResponse.orderId,
      state: statusResponse.state,
      amount: statusResponse.amount,
      amountInRupees: statusResponse.amount / 100,
      expireAt: statusResponse.expireAt,
      metaInfo: statusResponse.metaInfo,
      paymentDetails: statusResponse.paymentDetails,
      environment: config.getEnvironment(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ PhonePe order status check (GET) failed:', error);

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
        error: 'Order status check failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'ORDER_STATUS_CHECK_FAILED'
      },
      { status: 500 }
    );
  }
}
