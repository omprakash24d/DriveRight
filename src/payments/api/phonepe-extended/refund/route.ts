/**
 * PhonePe Refund API Route
 * Based on official PhonePe Node.js SDK
 */

import PhonePeSDKConfiguration from '@/config/phonepeSDKConfig';
import PhonePeSDKService, { convertRupeesToPaisa } from '@/services/phonepeSDKService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for refund initiation
const refundInitiationSchema = z.object({
  originalMerchantOrderId: z.string().min(1, 'Original Merchant Order ID is required'),
  amount: z.number().min(1, 'Refund amount must be greater than 0'),
  reason: z.string().optional(),
  merchantRefundId: z.string().optional(), // Will generate UUID if not provided
  metadata: z.object({
    adminId: z.string().optional(),
    reason: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
});

// Validation schema for refund status check
const refundStatusSchema = z.object({
  refundId: z.string().min(1, 'Refund ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('💰 PhonePe refund initiation started');

    // Parse and validate request body
    const body = await request.json();
    const validatedData = refundInitiationSchema.parse(body);

    console.log('✅ Refund request validation successful:', {
      originalMerchantOrderId: validatedData.originalMerchantOrderId,
      amount: validatedData.amount,
      reason: validatedData.reason
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

    // Convert amount to paisa (PhonePe SDK requirement)
    const amountInPaisa = convertRupeesToPaisa(validatedData.amount);

    console.log('💰 Initiating PhonePe refund with SDK:', {
      originalMerchantOrderId: validatedData.originalMerchantOrderId,
      amount: validatedData.amount,
      amountInPaisa,
      merchantRefundId: validatedData.merchantRefundId || 'auto-generated'
    });

    // Prepare refund request
    const refundRequest = {
      originalMerchantOrderId: validatedData.originalMerchantOrderId,
      amount: amountInPaisa,
      merchantRefundId: validatedData.merchantRefundId
    };

    // Initiate refund using PhonePe SDK
    const refundResponse = await phonepeService.initiateRefund(refundRequest);

    console.log('✅ PhonePe refund initiated successfully:', {
      merchantRefundId: refundResponse.merchantRefundId,
      refundId: refundResponse.refundId,
      state: refundResponse.state,
      amount: refundResponse.amount
    });

    // Return success response
    return NextResponse.json({
      success: true,
      merchantRefundId: refundResponse.merchantRefundId,
      refundId: refundResponse.refundId,
      state: refundResponse.state,
      amount: validatedData.amount,
      amountInPaisa: refundResponse.amount,
      originalMerchantOrderId: validatedData.originalMerchantOrderId,
      reason: validatedData.reason,
      environment: config.getEnvironment(),
      timestamp: new Date().toISOString(),
      metadata: validatedData.metadata
    });

  } catch (error) {
    console.error('❌ PhonePe refund initiation failed:', error);

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

    // Handle refund amount validation
    if (error instanceof Error && error.message.includes('refund amount')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid refund amount',
          details: error.message,
          code: 'INVALID_REFUND_AMOUNT'
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'Refund initiation failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'REFUND_INITIATION_FAILED'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for refund status
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const refundId = url.searchParams.get('refundId');

    if (!refundId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Refund ID is required',
          code: 'MISSING_REFUND_ID'
        },
        { status: 400 }
      );
    }

    console.log('🔍 PhonePe refund status check started:', { refundId });

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

    // Check refund status using PhonePe SDK
    const statusResponse = await phonepeService.getRefundStatus(refundId);

    console.log('✅ PhonePe refund status retrieved:', {
      refundId,
      merchantRefundId: statusResponse.merchantRefundId,
      state: statusResponse.state,
      amount: statusResponse.amount
    });

    // Return success response
    return NextResponse.json({
      success: true,
      refundId,
      merchantId: statusResponse.merchantId,
      merchantRefundId: statusResponse.merchantRefundId,
      state: statusResponse.state,
      amount: statusResponse.amount,
      amountInRupees: statusResponse.amount / 100, // Convert from paisa to rupees
      paymentDetails: statusResponse.paymentDetails,
      environment: config.getEnvironment(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ PhonePe refund status check failed:', error);

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
        error: 'Refund status check failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'REFUND_STATUS_CHECK_FAILED'
      },
      { status: 500 }
    );
  }
}
