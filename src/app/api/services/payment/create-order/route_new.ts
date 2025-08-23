import { RATE_LIMITS, withRateLimit } from '@/lib/rate-limiter';
import { EmailService } from '@/services/emailService';
import { EnhancedServicesManager } from '@/services/enhancedServicesService';
import { PhonePeService } from '@/services/phonepeService';
import { PaymentGateway } from '@/types/payment';
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { z } from 'zod';

// Enhanced payment order schema
const createServiceOrderSchema = z.object({
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
  paymentGateway: z.enum(['phonepe', 'razorpay']).optional().default('phonepe'), // PhonePe as default
  metadata: z.object({
    userAgent: z.string().optional(),
    referrer: z.string().optional(),
    source: z.string().optional()
  }).optional()
});

// Initialize Razorpay with validation
function initializeRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay configuration missing');
  }

  if (keyId.trim() === '' || keySecret.trim() === '') {
    throw new Error('Razorpay configuration invalid');
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

// Initialize Razorpay instance
let razorpay: Razorpay;
try {
  razorpay = initializeRazorpay();
} catch (error) {
  console.error('Failed to initialize Razorpay:', error);
  // razorpay will be undefined, handled in the route
}

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
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createServiceOrderSchema.parse(body);

    const { serviceId, serviceType, customerInfo, scheduledDate, notes, promoCode, paymentGateway, metadata } = validatedData;

    // Get service details and pricing
    let service;
    let serviceDetails;
    
    if (serviceType === 'training') {
      const trainingServices = await EnhancedServicesManager.getTrainingServices();
      service = trainingServices.find(s => s.id === serviceId);
      serviceDetails = service;
    } else {
      const onlineServices = await EnhancedServicesManager.getOnlineServices();
      service = onlineServices.find(s => s.id === serviceId);
      serviceDetails = service;
    }

    if (!service) {
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
    let discountApplied = 0;

    // Apply promo code if provided
    if (promoCode) {
      // Promo code validation and discount calculation
      // For now, we'll skip promo code logic
    }

    // Validate that we have a valid amount
    if (!finalAmount || finalAmount <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid service amount',
          code: 'INVALID_AMOUNT'
        },
        { status: 400 }
      );
    }

    // Create booking record first - only include fields with values to avoid Firestore undefined errors
    const bookingData: any = {
      serviceId,
      serviceType,
      customerInfo,
      bookingDate: new Date(),
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      paymentGateway // Store which gateway is being used
    };

    // Only add optional fields if they have values
    if (scheduledDate) {
      bookingData.scheduledDate = new Date(scheduledDate);
    }
    
    if (notes && notes.trim() !== '') {
      bookingData.notes = notes.trim();
    }

    const bookingId = await EnhancedServicesManager.createServiceBooking(bookingData);

    // Generate universal transaction ID
    const timestamp = Date.now().toString().slice(-8);
    const shortBookingId = bookingId.substring(0, 15);

    let paymentResponse;

    if (paymentGateway === 'phonepe') {
      // Handle PhonePe Payment
      const merchantTransactionId = PhonePeService.generateTransactionId('TXN');
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? `https://${request.headers.get('host')}` 
        : 'http://localhost:9002';

      const paymentRequest = {
        amount: Math.round(finalAmount * 100), // Convert to paise
        merchantTransactionId,
        merchantUserId: customerInfo.email.replace(/[^a-zA-Z0-9]/g, '_'),
        redirectUrl: `${baseUrl}/payment/phonepe/callback`,
        redirectMode: 'POST' as const,
        callbackUrl: `${baseUrl}/api/payment/phonepe/callback`,
        paymentInstrument: {
          type: 'PAY_PAGE' as const
        }
      };

      try {
        const phonePeResponse = await PhonePeService.initiatePayment(paymentRequest);
        
        if (!phonePeResponse.success) {
          throw new Error(`PhonePe payment initiation failed: ${phonePeResponse.message}`);
        }

        // Record transaction for PhonePe
        const transactionData = {
          bookingId,
          serviceId,
          serviceType,
          customerId: customerInfo.email,
          transactionType: 'payment' as const,
          amount: finalAmount,
          currency: 'INR' as const,
          status: 'pending' as const,
          paymentGateway: 'razorpay' as const, // Use compatible gateway type
          gatewayOrderId: merchantTransactionId,
          metadata: {
            customerIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: metadata?.userAgent || request.headers.get('user-agent') || 'unknown',
            additionalInfo: {
              discountApplied,
              originalAmount: service.pricing.basePrice,
              taxes: service.pricing.taxes,
              merchantTransactionId,
              source: metadata?.source || 'quick-services',
              actualGateway: 'phonepe' // Store actual gateway in metadata
            }
          }
        };

        const transactionId = await EnhancedServicesManager.recordTransaction(transactionData);

        paymentResponse = {
          gateway: 'phonepe',
          paymentUrl: phonePeResponse.data?.instrumentResponse.redirectInfo.url,
          merchantTransactionId,
          transactionId,
          bookingId,
          paymentConfig: {
            type: 'redirect',
            url: phonePeResponse.data?.instrumentResponse.redirectInfo.url,
            method: phonePeResponse.data?.instrumentResponse.redirectInfo.method
          }
        };

      } catch (error) {
        console.error('PhonePe payment creation failed:', error);
        throw new Error('Failed to create PhonePe payment order');
      }

    } else {
      // Handle Razorpay Payment (existing logic)
      // Check if Razorpay is properly configured
      if (!razorpay) {
        return NextResponse.json(
          {
            success: false,
            error: 'Razorpay payment gateway not available',
            code: 'PAYMENT_GATEWAY_ERROR'
          },
          { status: 503 }
        );
      }

      const amountInPaise = Math.round(finalAmount * 100);
      const receipt = `BK_${shortBookingId}_${timestamp}`;
      const currency = service.pricing.currency || 'INR';
      
      let razorpayOrder;
      try {
        razorpayOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: currency,
          receipt,
          notes: {
            bookingId,
            serviceId,
            serviceType,
            customerEmail: customerInfo.email,
            customerPhone: customerInfo.phone,
            serviceName: service.title
          }
        });

        if (!razorpayOrder || !razorpayOrder.id) {
          throw new Error('Failed to create Razorpay order - invalid response');
        }
      } catch (razorpayError) {
        console.error('Razorpay order creation failed:', razorpayError);
        throw razorpayError;
      }

      // Record transaction for Razorpay
      const transactionData = {
        bookingId,
        serviceId,
        serviceType,
        customerId: customerInfo.email,
        transactionType: 'payment' as const,
        amount: finalAmount,
        currency: (service.pricing.currency === 'INR' || service.pricing.currency === 'USD') ? service.pricing.currency : 'INR' as const,
        status: 'pending' as const,
        paymentGateway: 'razorpay' as const,
        gatewayOrderId: razorpayOrder.id,
        metadata: {
          customerIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: metadata?.userAgent || request.headers.get('user-agent') || 'unknown',
          additionalInfo: {
            discountApplied,
            originalAmount: service.pricing.basePrice,
            taxes: service.pricing.taxes,
            source: metadata?.source || 'quick-services'
          }
        }
      };

      const transactionId = await EnhancedServicesManager.recordTransaction(transactionData);

      paymentResponse = {
        gateway: 'razorpay',
        transactionId,
        bookingId,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt
        },
        paymentConfig: {
          key: process.env.RAZORPAY_KEY_ID,
          name: "DriveRight Driving School",
          description: `Payment for ${service.title}`,
          image: `${process.env.NODE_ENV === 'production' ? 'https://' + (request.headers.get('host') || 'localhost:9002') : 'http://localhost:9002'}/images/logo.jpg`,
          order_id: razorpayOrder.id,
          amount: amountInPaise,
          currency: service.pricing.currency,
          prefill: {
            name: customerInfo.name,
            email: customerInfo.email,
            contact: customerInfo.phone
          },
          theme: {
            color: "#3B82F6"
          }
        }
      };
    }

    // Send booking confirmation email
    try {
      const emailData: any = {
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
        paymentGateway
      };

      if (paymentGateway === 'razorpay' && paymentResponse.razorpayOrder?.id) {
        emailData.razorpayOrderId = paymentResponse.razorpayOrder.id;
      }

      if (paymentGateway === 'phonepe' && paymentResponse.merchantTransactionId) {
        emailData.phonePeTransactionId = paymentResponse.merchantTransactionId;
      }

      await EmailService.sendBookingConfirmation(emailData);
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    // Return success response with payment details
    return NextResponse.json({
      success: true,
      data: {
        ...paymentResponse,
        serviceDetails: {
          id: service.id,
          title: service.title,
          description: service.shortDescription || service.description,
          pricing: service.pricing,
          category: service.category
        },
        customerInfo
      }
    });

  } catch (error) {
    console.error('Error creating service order:', error);

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

    // Handle payment gateway errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      return NextResponse.json(
        {
          success: false,
          error: (error as any).error?.description || 'Payment gateway error',
          code: 'PAYMENT_GATEWAY_ERROR'
        },
        { status: (error as any).statusCode || 500 }
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

// GET endpoint to retrieve order status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const bookingId = searchParams.get('bookingId');
    const gateway = searchParams.get('gateway') as PaymentGateway;

    if (!orderId && !bookingId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order ID or Booking ID is required',
          code: 'MISSING_PARAMETER'
        },
        { status: 400 }
      );
    }

    let orderDetails = null;

    if (orderId && gateway) {
      try {
        if (gateway === 'razorpay' && razorpay) {
          orderDetails = await razorpay.orders.fetch(orderId);
        } else if (gateway === 'phonepe') {
          orderDetails = await PhonePeService.checkPaymentStatus(orderId);
        }
      } catch (gatewayError) {
        console.error(`Error fetching ${gateway} order:`, gatewayError);
      }
    }

    // Return order details and status
    let status = 'unknown';
    if (gateway === 'razorpay' && orderDetails && 'status' in orderDetails) {
      status = orderDetails.status;
    } else if (gateway === 'phonepe' && orderDetails && 'data' in orderDetails) {
      status = orderDetails.data?.state || 'unknown';
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        bookingId,
        gateway,
        orderDetails,
        status
      }
    });

  } catch (error) {
    console.error('Error fetching order status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch order status',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
