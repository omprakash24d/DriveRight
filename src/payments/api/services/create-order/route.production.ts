import { paymentConfig } from '@/config/paymentConfig';
import { RATE_LIMITS, withRateLimit } from '@/lib/rate-limiter';
import { EmailService } from '@/services/emailService';
import { EnhancedServicesManager } from '@/services/enhancedServicesService';
import { PaymentService } from '@/services/productionPaymentService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Enhanced payment order schema for production
const createProductionPaymentSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  serviceType: z.enum(['training', 'online'], {
    required_error: 'Service type must be either training or online'
  }),
  customerInfo: z.object({
    name: z.string().min(1, 'Customer name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    address: z.string().optional()
  }),
  scheduledDate: z.string().optional(), // For training services
  notes: z.string().optional(),
  promoCode: z.string().optional(),
  paymentGateway: z.enum(['phonepe', 'razorpay', 'auto']).optional().default('auto'), // Auto-select best gateway
  metadata: z.object({
    userAgent: z.string().optional(),
    referrer: z.string().optional(),
    source: z.string().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  // Apply rate limiting for payment requests
  const rateLimitResponse = withRateLimit(
    RATE_LIMITS.PAYMENT,
    (req) => req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  )(request);
  
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    console.log('🚀 Production payment request received');

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createProductionPaymentSchema.parse(body);
    console.log('✅ Request validation passed:', {
      serviceId: validatedData.serviceId,
      serviceType: validatedData.serviceType,
      customerEmail: validatedData.customerInfo.email,
      paymentGateway: validatedData.paymentGateway
    });

    const { serviceId, serviceType, customerInfo, scheduledDate, notes, promoCode, paymentGateway, metadata } = validatedData;

    // Log payment configuration status
    const gatewayStatus = PaymentService.getGatewayStatus();
    console.log('💳 Payment gateway status:', gatewayStatus);

    // Validate payment system configuration
    const configValidation = paymentConfig.validateProductionConfig();
    if (!configValidation.isValid) {
      console.error('❌ Payment configuration invalid:', configValidation.errors);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment system not properly configured',
          code: 'PAYMENT_CONFIG_ERROR',
          details: configValidation.errors
        },
        { status: 503 }
      );
    }

    // Log configuration warnings
    if (configValidation.warnings.length > 0) {
      console.warn('⚠️ Payment configuration warnings:', configValidation.warnings);
    }

    // Get service details and pricing
    console.log('🔍 Fetching service details...');
    let service;
    
    if (serviceType === 'training') {
      const trainingServices = await EnhancedServicesManager.getTrainingServices();
      service = trainingServices.find(s => s.id === serviceId);
    } else {
      const onlineServices = await EnhancedServicesManager.getOnlineServices();
      service = onlineServices.find(s => s.id === serviceId);
    }

    if (!service) {
      console.error('❌ Service not found:', { serviceId, serviceType });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service not found or not available',
          code: 'SERVICE_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Check if service is active
    if (!service.isActive) {
      console.error('❌ Service is inactive:', { serviceId: service.id, title: service.title });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Service is currently not available',
          code: 'SERVICE_INACTIVE'
        },
        { status: 400 }
      );
    }

    // Validate service pricing
    if (!service.pricing || !service.pricing.finalPrice || service.pricing.finalPrice <= 0) {
      console.error('❌ Invalid pricing configuration:', {
        serviceId,
        hasPricing: !!service.pricing,
        finalPrice: service.pricing?.finalPrice
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid service pricing configuration',
          code: 'INVALID_PRICING'
        },
        { status: 400 }
      );
    }

    // Calculate final amount (including any promo codes)
    let finalAmount = service.pricing.finalPrice;
    console.log('💰 Final amount calculated:', finalAmount);

    // Create booking record first
    const bookingData: any = {
      serviceId,
      serviceType,
      customerInfo,
      bookingDate: new Date(),
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      paymentGateway: paymentGateway === 'auto' ? 'auto-selected' : paymentGateway
    };

    // Add optional fields only if they have values
    if (scheduledDate) {
      bookingData.scheduledDate = new Date(scheduledDate);
    }
    
    if (notes && notes.trim() !== '') {
      bookingData.notes = notes.trim();
    }

    console.log('📝 Creating booking...');
    const bookingId = await EnhancedServicesManager.createServiceBooking(bookingData);
    console.log('✅ Booking created:', bookingId);

    // Generate unique order ID
    const timestamp = Date.now().toString().slice(-8);
    const shortBookingId = bookingId.substring(0, 15);
    const orderId = `ORDER_${shortBookingId}_${timestamp}`;

    // Create payment request
    const paymentRequest = {
      amount: finalAmount,
      orderId,
      customerInfo,
      description: `Payment for ${service.title}`,
      metadata: {
        bookingId,
        serviceId,
        serviceType,
        source: metadata?.source || 'production-system',
        userAgent: metadata?.userAgent || request.headers.get('user-agent'),
        originalAmount: service.pricing.basePrice,
        discountApplied: 0
      },
      preferredGateway: paymentGateway
    };

    console.log('💳 Creating payment order...');
    const paymentResult = await PaymentService.createPaymentOrder(paymentRequest);

    if (!paymentResult.success) {
      console.error('❌ Payment order creation failed:', paymentResult.error);
      return NextResponse.json(
        {
          success: false,
          error: paymentResult.error || 'Failed to create payment order',
          code: 'PAYMENT_ORDER_FAILED'
        },
        { status: 500 }
      );
    }

    console.log('✅ Payment order created successfully:', {
      gateway: paymentResult.gateway,
      fallback: paymentResult.fallback || false
    });

    // Record transaction in database
    const transactionData = {
      bookingId,
      serviceId,
      serviceType,
      customerId: customerInfo.email,
      transactionType: 'payment' as const,
      amount: finalAmount,
      currency: 'INR' as const,
      status: 'pending' as const,
      paymentGateway: paymentResult.gateway === 'razorpay' ? 'razorpay' as const : 'razorpay' as const, // Compatible type
      gatewayOrderId: paymentResult.data?.orderId || paymentResult.data?.merchantTransactionId || orderId,
      metadata: {
        customerIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: metadata?.userAgent || request.headers.get('user-agent') || 'unknown',
        additionalInfo: {
          actualGateway: paymentResult.gateway,
          fallbackUsed: paymentResult.fallback || false,
          originalAmount: service.pricing.basePrice,
          discountApplied: 0,
          source: metadata?.source || 'production-system',
          productionMode: paymentConfig.isProductionMode()
        }
      }
    };

    console.log('💾 Recording transaction...');
    const transactionId = await EnhancedServicesManager.recordTransaction(transactionData);
    console.log('✅ Transaction recorded:', transactionId);

    // Send booking confirmation email
    console.log('📧 Sending booking confirmation email...');
    try {
      await EmailService.sendBookingConfirmation({
        to: customerInfo.email,
        customerName: customerInfo.name,
        bookingId,
        serviceName: service.title,
        serviceType,
        amount: finalAmount,
        currency: service.pricing.currency || 'INR',
        bookingDate: new Date(),
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        paymentStatus: 'pending',
        razorpayOrderId: paymentResult.data?.orderId || paymentResult.data?.merchantTransactionId || orderId
      });
      console.log('✅ Booking confirmation email sent');
    } catch (emailError) {
      console.error('❌ Failed to send booking confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    // Prepare response based on gateway
    const responseData = {
      success: true,
      data: {
        bookingId,
        transactionId,
        orderId,
        gateway: paymentResult.gateway,
        fallback: paymentResult.fallback || false,
        serviceDetails: {
          id: service.id,
          title: service.title,
          description: service.shortDescription || service.description,
          pricing: service.pricing,
          category: service.category
        },
        customerInfo,
        paymentConfig: paymentResult.data?.config,
        // Additional data based on gateway
        ...(paymentResult.gateway === 'razorpay' && {
          razorpayOrder: {
            id: paymentResult.data?.orderId,
            amount: Math.round(finalAmount * 100),
            currency: 'INR'
          }
        }),
        ...(paymentResult.gateway === 'phonepe' && {
          merchantTransactionId: paymentResult.data?.merchantTransactionId,
          paymentUrl: paymentResult.data?.paymentUrl,
          mockPayment: paymentResult.fallback || false
        })
      }
    };

    console.log('📤 Sending response:', {
      success: true,
      gateway: paymentResult.gateway,
      fallback: paymentResult.fallback || false,
      hasPaymentConfig: !!responseData.data.paymentConfig
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('💥 Error creating production payment order:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Handle generic errors
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check payment system status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkConfig = searchParams.get('checkConfig') === 'true';

    if (checkConfig) {
      // Return payment system configuration status
      const gatewayStatus = PaymentService.getGatewayStatus();
      const configValidation = paymentConfig.validateProductionConfig();
      const recommendation = paymentConfig.getGatewayRecommendation();

      return NextResponse.json({
        success: true,
        data: {
          status: gatewayStatus,
          validation: configValidation,
          recommendation,
          environment: process.env.NODE_ENV,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Default status response
    return NextResponse.json({
      success: true,
      data: {
        status: 'Payment system operational',
        gateways: PaymentService.getGatewayStatus(),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error checking payment system status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check payment system status'
      },
      { status: 500 }
    );
  }
}
