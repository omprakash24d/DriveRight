import PhonePeSDKConfiguration from '@/config/phonepeSDKConfig';
import { RATE_LIMITS, withRateLimit } from '@/lib/rate-limiter';
import { EnhancedServicesManager } from '@/services/enhancedServicesService';
import PhonePeSDKService, { convertRupeesToPaisa } from '@/services/phonepeSDKService';
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
    console.log('🔍 Payment order request received');
    
    const validatedData = createServiceOrderSchema.parse(body);
    console.log('✅ Request validation passed');

    const { serviceId, serviceType, customerInfo, scheduledDate, notes, promoCode, paymentGateway, metadata } = validatedData;

    // Get service details and pricing
    let service;
    let serviceDetails;
    
    console.log('🔍 Fetching services for type:', serviceType);
    
    if (serviceType === 'training') {
      const trainingServices = await EnhancedServicesManager.getTrainingServices();
      console.log('📚 Training services fetched:', trainingServices.length, 'services');
      service = trainingServices.find(s => s.id === serviceId);
      serviceDetails = service;
    } else {
      const onlineServices = await EnhancedServicesManager.getOnlineServices();
      console.log('💻 Online services fetched:', onlineServices.length, 'services');
      service = onlineServices.find(s => s.id === serviceId);
      serviceDetails = service;
    }

    console.log('🎯 Service lookup completed');

    if (!service) {
      console.error('❌ Service not found:', serviceId);
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
      console.error('❌ Service is inactive:', {
        serviceId: service.id,
        title: service.title,
        isActive: service.isActive
      });
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
    console.log('🔍 Validating service pricing for:', serviceId);
    
    if (!service.pricing || !service.pricing.finalPrice || service.pricing.finalPrice <= 0) {
      console.error('❌ Invalid pricing configuration for service:', serviceId);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid service pricing configuration',
          code: 'INVALID_PRICING',
          details: {
            hasPricing: !!service.pricing,
            finalPrice: service.pricing?.finalPrice,
            serviceId
          }
        },
        { status: 400 }
      );
    }

    // Calculate final amount (including any promo codes)
    let finalAmount = service.pricing.finalPrice;
    let discountApplied = 0;

    console.log('💰 Calculating final amount:', {
      baseFinalPrice: finalAmount,
      discountApplied,
      promoCode
    });

    // Apply promo code if provided
    if (promoCode) {
      // Promo code validation and discount calculation
      // For now, we'll skip promo code logic
      console.log('🎟️ Promo code provided but not implemented:', promoCode);
    }

    // Validate that we have a valid amount
    if (!finalAmount || finalAmount <= 0) {
      console.error('❌ Invalid final amount:', {
        finalAmount,
        servicePricing: service.pricing
      });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid service amount',
          code: 'INVALID_AMOUNT'
        },
        { status: 400 }
      );
    }

    console.log('✅ Final amount validated:', finalAmount);

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

    console.log('📝 Creating booking...');

    const bookingId = await EnhancedServicesManager.createServiceBooking(bookingData);
    console.log('✅ Booking created successfully:', bookingId);

    // Generate universal transaction ID
    const timestamp = Date.now().toString().slice(-8);
    const shortBookingId = bookingId.substring(0, 15);

    let paymentResponse;

    console.log('🚀 Processing payment with gateway:', paymentGateway);

    if (paymentGateway === 'phonepe') {
      console.log('📱 Initiating PhonePe payment with official SDK...');
      
      // Initialize PhonePe SDK configuration
      const phonepeConfig = PhonePeSDKConfiguration.getInstance();
      
      if (!phonepeConfig.isConfigured()) {
        console.error('❌ PhonePe SDK not configured, falling back to legacy service');
        
        // Fallback to legacy PhonePe service
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

          // Legacy payment handling...
          const additionalInfo: any = {
            discountApplied,
            originalAmount: service.pricing.basePrice,
            merchantTransactionId,
            source: metadata?.source || 'quick-services',
            actualGateway: 'phonepe-legacy',
            sdkVersion: 'legacy'
          };

          if (service.pricing.taxes !== undefined && service.pricing.taxes !== null) {
            additionalInfo.taxes = service.pricing.taxes;
          }

          const transactionData = {
            bookingId,
            serviceId,
            serviceType,
            customerId: customerInfo.email,
            transactionType: 'payment' as const,
            amount: finalAmount,
            currency: 'INR' as const,
            status: 'pending' as const,
            paymentGateway: 'phonepe' as const,
            gatewayOrderId: merchantTransactionId,
            metadata: {
              customerIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
              userAgent: metadata?.userAgent || request.headers.get('user-agent') || 'unknown',
              additionalInfo
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
          console.error('❌ Legacy PhonePe payment failed:', error);
          return NextResponse.json(
            {
              success: false,
              error: 'Payment gateway temporarily unavailable',
              code: 'PAYMENT_GATEWAY_ERROR'
            },
            { status: 503 }
          );
        }
        
      } else {
        // Use new PhonePe SDK
        try {
          phonepeConfig.validateConfiguration();
          
          const phonepeSDKConfig = phonepeConfig.getConfig()!;
          const phonepeSDKService = PhonePeSDKService.getInstance(phonepeSDKConfig);
          
          // Convert amount to paisa
          const amountInPaisa = convertRupeesToPaisa(finalAmount);
          
          // Get redirect URL (PhonePe will handle the merchantOrderId automatically)
          const redirectUrls = phonepeConfig.getRedirectUrls();
          const redirectUrl = redirectUrls.success;
          
          console.log('🔧 Initiating PhonePe SDK payment...');

          // Prepare SDK payment request
          const sdkPaymentRequest = {
            amount: amountInPaisa,
            redirectUrl,
            customerInfo: {
              name: customerInfo.name,
              email: customerInfo.email,
              phone: customerInfo.phone
            },
            metadata: {
              udf1: serviceId,
              udf2: service.title,
              udf3: bookingId,
              udf4: customerInfo.email,
              udf5: JSON.stringify({
                serviceType,
                originalAmount: service.pricing.basePrice,
                discountApplied,
                source: metadata?.source || 'web',
                timestamp: new Date().toISOString()
              })
            }
          };

          console.log('� Initiating PhonePe SDK payment...');
          
          // Initiate payment using PhonePe SDK
          const sdkResponse = await phonepeSDKService.initiatePayment(sdkPaymentRequest);
          
          console.log('✅ PhonePe SDK payment initiated successfully');

          // Record transaction for PhonePe SDK
          const additionalInfo: any = {
            discountApplied,
            originalAmount: service.pricing.basePrice,
            phonepeOrderId: sdkResponse.orderId,
            merchantOrderId: sdkResponse.merchantOrderId,
            source: metadata?.source || 'web',
            actualGateway: 'phonepe-sdk',
            sdkVersion: 'official',
            environment: phonepeConfig.getEnvironment()
          };

          if (service.pricing.taxes !== undefined && service.pricing.taxes !== null) {
            additionalInfo.taxes = service.pricing.taxes;
          }

          const transactionData = {
            bookingId,
            serviceId,
            serviceType,
            customerId: customerInfo.email,
            transactionType: 'payment' as const,
            amount: finalAmount,
            currency: 'INR' as const,
            status: 'pending' as const,
            paymentGateway: 'phonepe' as const,
            gatewayOrderId: sdkResponse.merchantOrderId,
            metadata: {
              customerIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
              userAgent: metadata?.userAgent || request.headers.get('user-agent') || 'unknown',
              additionalInfo
            }
          };

          console.log('💾 Recording PhonePe SDK transaction...');
          const transactionId = await EnhancedServicesManager.recordTransaction(transactionData);
          console.log('✅ PhonePe SDK transaction recorded:', transactionId);

          // Use the checkout URL directly from PhonePe SDK response
          const finalRedirectUrl = sdkResponse.checkoutUrl;
          
          paymentResponse = {
            gateway: 'phonepe',
            paymentUrl: finalRedirectUrl,
            merchantOrderId: sdkResponse.merchantOrderId,
            orderId: sdkResponse.orderId,
            transactionId,
            bookingId,
            state: sdkResponse.state,
            expireAt: sdkResponse.expireAt,
            environment: phonepeConfig.getEnvironment(),
            paymentConfig: {
              type: 'redirect',
              url: finalRedirectUrl,
              method: 'GET'
            },
            sdkInfo: {
              version: 'official',
              merchantOrderId: sdkResponse.merchantOrderId,
              orderId: sdkResponse.orderId
            }
          };

          console.log('✅ PhonePe SDK payment response prepared');

        } catch (error) {
          console.error('❌ PhonePe SDK payment creation failed:', error);
          
          // Check if this is a configuration error or API error
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
          
          return NextResponse.json(
            {
              success: false,
              error: 'Payment gateway configuration error',
              details: error instanceof Error ? error.message : 'Unknown error',
              code: 'PAYMENT_GATEWAY_CONFIG_ERROR'
            },
            { status: 503 }
          );
        }
      }
      
    } else {
      console.log('💳 Initiating Razorpay payment...');
      // Handle Razorpay Payment (existing logic)
      // Check if Razorpay is properly configured
      if (!razorpay) {
        console.error('❌ Razorpay not configured');
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
      
      console.log('🔧 Razorpay configuration:', {
        amountInPaise,
        receipt,
        currency,
        originalAmount: finalAmount
      });
      
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

        console.log('✅ Razorpay order created:', {
          id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          status: razorpayOrder.status
        });

        if (!razorpayOrder || !razorpayOrder.id) {
          throw new Error('Failed to create Razorpay order - invalid response');
        }
      } catch (razorpayError) {
        console.error('❌ Razorpay order creation failed:', razorpayError);
        throw razorpayError;
      }

      // Record transaction for Razorpay - Filter out undefined values to avoid Firebase errors
      const additionalInfo: any = {
        discountApplied,
        originalAmount: service.pricing.basePrice,
        source: metadata?.source || 'quick-services'
      };

      // Only add taxes if it has a value
      if (service.pricing.taxes !== undefined && service.pricing.taxes !== null) {
        additionalInfo.taxes = service.pricing.taxes;
      }

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
          additionalInfo
        }
      };

      console.log('💾 Recording Razorpay transaction:', transactionData);

      const transactionId = await EnhancedServicesManager.recordTransaction(transactionData);
      console.log('✅ Razorpay transaction recorded:', transactionId);

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

      console.log('✅ Razorpay payment response prepared:', {
        ...paymentResponse,
        paymentConfig: { ...paymentResponse.paymentConfig, key: 'HIDDEN' }
      });
    }

    // Email will be sent after payment confirmation via webhook or status verification
    // This ensures users only receive emails for successful payments
    console.log('� Payment order creation completed - email will be sent after payment confirmation');

    console.log('🎉 Payment order creation completed successfully');

    // Return success response with payment details
    const finalResponse = {
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
        customerInfo,
        // Add booking data for confirmation API
        bookingData: {
          bookingId: paymentResponse.bookingId,
          transactionId: paymentResponse.transactionId,
          serviceId: service.id,
          serviceType,
          customerEmail: customerInfo.email,
          customerName: customerInfo.name,
          amount: finalAmount,
          // Include merchantOrderId for PhonePe SDK callbacks
          merchantOrderId: paymentResponse.merchantOrderId || paymentResponse.orderId,
          gateway: paymentGateway
        }
      }
    };

    console.log('📤 Payment order created successfully');

    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error('💥 Error creating service order:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Handle validation errors
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error details:', error.errors);
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
      console.error('❌ Payment gateway error:', error);
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
    console.error('❌ Generic error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      type: typeof error,
      error
    });

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
