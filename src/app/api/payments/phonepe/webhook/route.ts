/**
 * PhonePe Webhook Handler API Route
 * Based on official PhonePe Node.js SDK
 */

import PhonePeSDKConfiguration from '@/config/phonepeSDKConfig';
import PhonePeSDKService from '@/services/phonepeSDKService';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📨 PhonePe webhook received');

    // Get authorization header
    const authorizationHeader = request.headers.get('authorization');
    if (!authorizationHeader) {
      console.error('❌ Missing authorization header in webhook');
      return NextResponse.json(
        {
          success: false,
          error: 'Missing authorization header',
          code: 'MISSING_AUTHORIZATION'
        },
        { status: 400 }
      );
    }

    // Get request body as string
    const responseBody = await request.text();
    if (!responseBody) {
      console.error('❌ Empty webhook body');
      return NextResponse.json(
        {
          success: false,
          error: 'Empty request body',
          code: 'EMPTY_BODY'
        },
        { status: 400 }
      );
    }

    console.log('📨 Webhook data received:', {
      hasAuthorization: !!authorizationHeader,
      bodyLength: responseBody.length
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

    if (!config.hasWebhookCredentials()) {
      console.error('❌ PhonePe webhook credentials not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook credentials not configured',
          code: 'WEBHOOK_CREDENTIALS_MISSING'
        },
        { status: 503 }
      );
    }

    // Get PhonePe SDK service instance
    const phonepeConfig = config.getConfig()!;
    const phonepeService = PhonePeSDKService.getInstance(phonepeConfig);

    console.log('🔐 Validating webhook with PhonePe SDK');

    // Validate webhook using PhonePe SDK
    const callbackResponse = phonepeService.validateCallback(
      authorizationHeader,
      responseBody
    );

    console.log('✅ PhonePe webhook validated successfully:', {
      type: callbackResponse.type,
      orderId: callbackResponse.payload.orderId,
      state: callbackResponse.payload.state
    });

    // Process the validated callback
    await processWebhookCallback(callbackResponse);

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      type: callbackResponse.type,
      orderId: callbackResponse.payload.orderId,
      state: callbackResponse.payload.state,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ PhonePe webhook processing failed:', error);

    // Handle PhonePe SDK errors
    if (error instanceof Error && error.message.includes('PhonePe API Error')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook validation failed',
          details: error.message,
          code: 'WEBHOOK_VALIDATION_FAILED'
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'WEBHOOK_PROCESSING_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * Process the validated webhook callback
 */
async function processWebhookCallback(callbackResponse: any) {
  try {
    const { type, payload } = callbackResponse;

    console.log('🔄 Processing webhook callback:', {
      type,
      orderId: payload.orderId,
      state: payload.state,
      amount: payload.amount
    });

    switch (type) {
      case 'CHECKOUT_ORDER_COMPLETED':
        await handleOrderCompleted(payload);
        break;

      case 'CHECKOUT_ORDER_FAILED':
        await handleOrderFailed(payload);
        break;

      case 'PG_REFUND_COMPLETED':
        await handleRefundCompleted(payload);
        break;

      case 'PG_REFUND_FAILED':
        await handleRefundFailed(payload);
        break;

      case 'PG_REFUND_ACCEPTED':
        await handleRefundAccepted(payload);
        break;

      default:
        console.warn('⚠️ Unknown webhook type:', type);
        break;
    }

    console.log('✅ Webhook callback processed successfully');

  } catch (error) {
    console.error('❌ Webhook callback processing failed:', error);
    throw error;
  }
}

/**
 * Handle order completed webhook
 */
async function handleOrderCompleted(payload: any) {
  console.log('🎉 Processing order completed webhook:', {
    orderId: payload.orderId,
    originalMerchantOrderId: payload.originalMerchantOrderId,
    amount: payload.amount
  });

  // TODO: Implement your order completion logic here
  // Examples:
  // - Update order status in database
  // - Send confirmation email
  // - Update inventory
  // - Trigger fulfillment process

  // Example implementation:
  /*
  await updateOrderStatus(payload.originalMerchantOrderId, {
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    phonepeOrderId: payload.orderId,
    phonepeTransactionId: payload.paymentDetails?.[0]?.transactionId,
    paidAmount: payload.amount,
    paidAt: new Date(),
    paymentDetails: payload.paymentDetails
  });

  await sendOrderConfirmationEmail(payload.originalMerchantOrderId);
  */

  console.log('✅ Order completed webhook processed');
}

/**
 * Handle order failed webhook
 */
async function handleOrderFailed(payload: any) {
  console.log('❌ Processing order failed webhook:', {
    orderId: payload.orderId,
    originalMerchantOrderId: payload.originalMerchantOrderId,
    errorCode: payload.errorCode,
    detailedErrorCode: payload.detailedErrorCode
  });

  // TODO: Implement your order failure logic here
  // Examples:
  // - Update order status in database
  // - Send failure notification
  // - Log failure for analysis
  // - Trigger retry mechanism if applicable

  // Example implementation:
  /*
  await updateOrderStatus(payload.originalMerchantOrderId, {
    status: 'FAILED',
    paymentStatus: 'FAILED',
    errorCode: payload.errorCode,
    detailedErrorCode: payload.detailedErrorCode,
    failedAt: new Date(),
    paymentDetails: payload.paymentDetails
  });

  await sendOrderFailureNotification(payload.originalMerchantOrderId);
  */

  console.log('✅ Order failed webhook processed');
}

/**
 * Handle refund completed webhook
 */
async function handleRefundCompleted(payload: any) {
  console.log('💰 Processing refund completed webhook:', {
    refundId: payload.refundId,
    merchantRefundId: payload.merchantRefundId,
    amount: payload.amount
  });

  // TODO: Implement your refund completion logic here
  // Examples:
  // - Update refund status in database
  // - Send refund confirmation email
  // - Update accounting records
  // - Notify customer service

  // Example implementation:
  /*
  await updateRefundStatus(payload.merchantRefundId, {
    status: 'COMPLETED',
    phonepeRefundId: payload.refundId,
    refundedAmount: payload.amount,
    refundedAt: new Date(),
    paymentDetails: payload.paymentDetails
  });

  await sendRefundConfirmationEmail(payload.merchantRefundId);
  */

  console.log('✅ Refund completed webhook processed');
}

/**
 * Handle refund failed webhook
 */
async function handleRefundFailed(payload: any) {
  console.log('❌ Processing refund failed webhook:', {
    refundId: payload.refundId,
    merchantRefundId: payload.merchantRefundId,
    errorCode: payload.errorCode,
    detailedErrorCode: payload.detailedErrorCode
  });

  // TODO: Implement your refund failure logic here
  // Examples:
  // - Update refund status in database
  // - Send failure notification
  // - Log failure for manual intervention
  // - Trigger manual refund process

  // Example implementation:
  /*
  await updateRefundStatus(payload.merchantRefundId, {
    status: 'FAILED',
    errorCode: payload.errorCode,
    detailedErrorCode: payload.detailedErrorCode,
    failedAt: new Date(),
    paymentDetails: payload.paymentDetails
  });

  await notifyRefundFailure(payload.merchantRefundId);
  */

  console.log('✅ Refund failed webhook processed');
}

/**
 * Handle refund accepted webhook
 */
async function handleRefundAccepted(payload: any) {
  console.log('⏳ Processing refund accepted webhook:', {
    refundId: payload.refundId,
    merchantRefundId: payload.merchantRefundId,
    amount: payload.amount
  });

  // TODO: Implement your refund acceptance logic here
  // Examples:
  // - Update refund status to processing
  // - Send acknowledgment notification
  // - Set up status monitoring

  // Example implementation:
  /*
  await updateRefundStatus(payload.merchantRefundId, {
    status: 'PROCESSING',
    phonepeRefundId: payload.refundId,
    acceptedAt: new Date(),
    paymentDetails: payload.paymentDetails
  });

  await sendRefundProcessingNotification(payload.merchantRefundId);
  */

  console.log('✅ Refund accepted webhook processed');
}

// GET endpoint to verify webhook endpoint is working
export async function GET(request: NextRequest) {
  const config = PhonePeSDKConfiguration.getInstance();
  
  return NextResponse.json({
    success: true,
    message: 'PhonePe webhook endpoint is active',
    configured: config.isConfigured(),
    hasWebhookCredentials: config.hasWebhookCredentials(),
    environment: config.getEnvironment(),
    timestamp: new Date().toISOString()
  });
}
