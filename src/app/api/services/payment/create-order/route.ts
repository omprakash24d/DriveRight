import { RATE_LIMITS, withRateLimit } from '@/lib/rate-limiter';
import { EmailService } from '@/services/emailService';
import { EnhancedServicesManager } from '@/services/enhancedServicesService';
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
    throw new Error('Payment gateway configuration missing');
  }

  if (keyId.trim() === '' || keySecret.trim() === '') {
    throw new Error('Payment gateway configuration invalid');
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
    // Check if payment gateway is properly configured
    if (!razorpay) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment gateway not available',
          code: 'PAYMENT_GATEWAY_ERROR'
        },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createServiceOrderSchema.parse(body);

    const { serviceId, serviceType, customerInfo, scheduledDate, notes, promoCode, metadata } = validatedData;

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

    // Convert amount to paise (Razorpay uses smallest currency unit)
    const amountInPaise = Math.round(finalAmount * 100);

    // Validate the converted amount
    if (!amountInPaise || amountInPaise <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid payment amount after conversion',
          code: 'INVALID_CONVERTED_AMOUNT'
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
      paymentStatus: 'pending' as const
    };

    // Only add optional fields if they have values
    if (scheduledDate) {
      bookingData.scheduledDate = new Date(scheduledDate);
    }
    
    if (notes && notes.trim() !== '') {
      bookingData.notes = notes.trim();
    }

    const bookingId = await EnhancedServicesManager.createServiceBooking(bookingData);

    // Create Razorpay order with shortened receipt (max 40 chars)
    const shortBookingId = bookingId.substring(0, 15); // First 15 chars of booking ID
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const receipt = `BK_${shortBookingId}_${timestamp}`; // Total: 3 + 15 + 1 + 8 = 27 chars
    
    // Validate currency
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

      // Verify the order was created successfully
      if (!razorpayOrder || !razorpayOrder.id) {
        throw new Error('Failed to create Razorpay order - invalid response');
      }
    } catch (razorpayError) {
      console.error('Razorpay order creation failed:', razorpayError);
      throw razorpayError; // Re-throw to be handled by outer catch
    }

    // Record transaction with clean metadata (no undefined values)
    const transactionMetadata: any = {
      customerIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: metadata?.userAgent || request.headers.get('user-agent') || 'unknown',
      additionalInfo: {
        discountApplied,
        originalAmount: service.pricing.basePrice,
        taxes: service.pricing.taxes
      }
    };

    // Only add optional fields if they exist
    if (promoCode && promoCode.trim() !== '') {
      transactionMetadata.additionalInfo.promoCode = promoCode.trim();
    }
    
    if (metadata?.referrer && metadata.referrer.trim() !== '') {
      transactionMetadata.additionalInfo.referrer = metadata.referrer.trim();
    }
    
    if (metadata?.source && metadata.source.trim() !== '') {
      transactionMetadata.additionalInfo.source = metadata.source.trim();
    }

    const transactionData = {
      bookingId,
      serviceId,
      serviceType,
      customerId: customerInfo.email, // Using email as customer ID for now
      transactionType: 'payment' as const,
      amount: finalAmount,
      currency: service.pricing.currency,
      status: 'pending' as const,
      paymentGateway: 'razorpay' as const,
      gatewayOrderId: razorpayOrder.id,
      metadata: transactionMetadata
    };

    const transactionId = await EnhancedServicesManager.recordTransaction(transactionData);

    // Send booking confirmation email
    try {
      await EmailService.sendBookingConfirmation({
        to: customerInfo.email,
        customerName: customerInfo.name,
        bookingId,
        serviceName: service.title,
        serviceType,
        amount: finalAmount,
        currency: service.pricing.currency,
        bookingDate: new Date(),
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        paymentStatus: 'pending',
        razorpayOrderId: razorpayOrder.id
      });
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    // Return success response with Razorpay order details
    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        transactionId,
        razorpayOrder: {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt
        },
        serviceDetails: {
          id: service.id,
          title: service.title,
          description: service.shortDescription || service.description,
          pricing: service.pricing,
          category: service.category
        },
        customerInfo,
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

    // Handle Razorpay errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment gateway error',
          message: (error as any).error?.description || 'Failed to create payment order',
          code: 'PAYMENT_GATEWAY_ERROR'
        },
        { status: 500 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create service order',
        message: error instanceof Error ? error.message : 'Internal server error',
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

    // Fetch order details from Razorpay if orderId is provided
    let razorpayOrderDetails = null;
    if (orderId) {
      try {
        razorpayOrderDetails = await razorpay.orders.fetch(orderId);
      } catch (razorpayError) {
        console.error('Error fetching Razorpay order:', razorpayError);
      }
    }

    // Return booking details and order status
    // For now, return basic order status
    return NextResponse.json({
      success: true,
      data: {
        orderId,
        bookingId,
        razorpayOrder: razorpayOrderDetails,
        status: razorpayOrderDetails?.status || 'unknown'
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
