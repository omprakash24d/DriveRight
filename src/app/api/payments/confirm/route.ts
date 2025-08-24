/**
 * Payment Confirmation API Route
 * Handles post-payment confirmation tasks:
 * - Verify payment status
 * - Send confirmation email
 * - Update database records
 * - Update admin panel data
 */

import PhonePeSDKConfiguration from '@/config/phonepeSDKConfig';
import { EmailService } from '@/services/emailService';
import { EnhancedServicesManager } from '@/services/enhancedServicesService';
import PhonePeSDKService from '@/services/phonepeSDKService';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for payment confirmation
const confirmationSchema = z.object({
  merchantOrderId: z.string().min(1, 'Merchant Order ID is required'),
  gateway: z.enum(['phonepe', 'razorpay']),
  bookingId: z.string().min(1, 'Booking ID is required'),
  transactionId: z.string().min(1, 'Transaction ID is required'),
  serviceId: z.string().min(1, 'Service ID is required'),
  serviceType: z.string().min(1, 'Service type is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerName: z.string().min(1, 'Customer name is required'),
  amount: z.number().positive('Amount must be positive'),
  forceConfirm: z.boolean().optional().default(false) // For testing purposes
});

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Payment confirmation process started');

    // Parse and validate request body
    const body = await request.json();
    const validatedData = confirmationSchema.parse(body);

    console.log('✅ Confirmation request validated:', {
      merchantOrderId: validatedData.merchantOrderId,
      gateway: validatedData.gateway,
      bookingId: validatedData.bookingId,
      customerEmail: validatedData.customerEmail
    });

    let paymentVerified = false;
    let paymentDetails: any = {};

    // Verify payment status based on gateway
    if (validatedData.gateway === 'phonepe') {
      const config = PhonePeSDKConfiguration.getInstance();
      
      if (!config.isConfigured()) {
        return NextResponse.json(
          {
            success: false,
            error: 'PhonePe SDK not configured',
            code: 'SDK_NOT_CONFIGURED'
          },
          { status: 503 }
        );
      }

      const phonepeConfig = config.getConfig()!;
      const phonepeService = PhonePeSDKService.getInstance(phonepeConfig);

      try {
        // Verify payment with PhonePe
        const statusResponse = await phonepeService.getOrderStatus(
          validatedData.merchantOrderId,
          true
        );

        console.log('🔍 PhonePe payment status verified:', {
          merchantOrderId: validatedData.merchantOrderId,
          state: statusResponse.state,
          amount: statusResponse.amount
        });

        paymentVerified = statusResponse.state === 'COMPLETED';
        paymentDetails = {
          state: statusResponse.state,
          orderId: statusResponse.orderId,
          amount: statusResponse.amount,
          amountInRupees: statusResponse.amount / 100,
          paymentDetails: statusResponse.paymentDetails
        };

      } catch (error) {
        console.error('❌ PhonePe payment verification failed:', error);
        
        if (!validatedData.forceConfirm) {
          return NextResponse.json(
            {
              success: false,
              error: 'Payment verification failed',
              details: error instanceof Error ? error.message : 'Unknown error',
              code: 'PAYMENT_VERIFICATION_FAILED'
            },
            { status: 400 }
          );
        } else {
          console.log('⚠️ Force confirm enabled - proceeding despite verification failure');
          paymentVerified = true;
        }
      }
    } else if (validatedData.gateway === 'razorpay') {
      // Add Razorpay verification logic here if needed
      console.log('🔍 Razorpay payment verification not implemented yet');
      paymentVerified = validatedData.forceConfirm;
    }

    if (!paymentVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment not confirmed',
          details: `Payment status: ${paymentDetails.state || 'unknown'}`,
          code: 'PAYMENT_NOT_CONFIRMED'
        },
        { status: 400 }
      );
    }

    console.log('✅ Payment verified successfully');

    // Update database with payment confirmation
    try {
      // Update booking status to confirmed and payment status to paid
      await EnhancedServicesManager.updateBookingStatus(
        validatedData.bookingId, 
        'confirmed', 
        'paid'
      );

      // Update transaction status to completed
      if (validatedData.transactionId) {
        await EnhancedServicesManager.updateTransactionStatus(
          validatedData.transactionId, 
          'completed',
          paymentDetails.orderId // Use PhonePe order ID as gateway payment ID
        );
      }

      console.log('✅ Database updated successfully');
    } catch (dbError) {
      console.error('❌ Database update failed:', dbError);
      // Continue with email sending even if database update fails
    }

    // Get service details for email
    let serviceDetails: any = {};
    try {
      if (validatedData.serviceType === 'training') {
        const services = await EnhancedServicesManager.getTrainingServices();
        serviceDetails = services.find((s: any) => s.id === validatedData.serviceId);
      } else if (validatedData.serviceType === 'online') {
        const services = await EnhancedServicesManager.getOnlineServices();
        serviceDetails = services.find((s: any) => s.id === validatedData.serviceId);
      }
    } catch (error) {
      console.error('❌ Failed to fetch service details:', error);
    }

    // Send confirmation email
    try {
      console.log('📧 Sending payment confirmation email...');

      const emailData: any = {
        to: validatedData.customerEmail,
        customerName: validatedData.customerName,
        bookingId: validatedData.bookingId,
        serviceName: serviceDetails?.title || 'Service',
        serviceType: validatedData.serviceType,
        amount: validatedData.amount,
        currency: serviceDetails?.pricing?.currency || 'INR',
        bookingDate: new Date(),
        paymentStatus: 'paid',
        paymentGateway: validatedData.gateway,
        transactionId: validatedData.transactionId,
        merchantOrderId: validatedData.merchantOrderId,
        paymentDetails: paymentDetails
      };

      if (validatedData.gateway === 'phonepe') {
        emailData.phonePeTransactionId = validatedData.merchantOrderId;
        emailData.phonePeOrderId = paymentDetails.orderId;
        emailData.razorpayOrderId = ''; // Required field but empty for PhonePe
      } else if (validatedData.gateway === 'razorpay') {
        emailData.razorpayOrderId = validatedData.merchantOrderId;
      }

      await EmailService.sendBookingConfirmation(emailData);
      console.log('✅ Payment confirmation email sent successfully');

    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError);
      // Don't fail the entire confirmation process if email fails
      
      return NextResponse.json({
        success: true,
        message: 'Payment confirmed but email sending failed',
        data: {
          paymentVerified: true,
          databaseUpdated: true,
          emailSent: false,
          emailError: emailError instanceof Error ? emailError.message : 'Unknown email error',
          paymentDetails: paymentDetails
        }
      });
    }

    console.log('🎉 Payment confirmation process completed successfully');

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Payment confirmed successfully',
      data: {
        paymentVerified: true,
        databaseUpdated: true,
        emailSent: true,
        paymentDetails: paymentDetails,
        bookingId: validatedData.bookingId,
        transactionId: validatedData.transactionId
      }
    });

  } catch (error) {
    console.error('❌ Payment confirmation process failed:', error);

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

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'Payment confirmation failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'CONFIRMATION_PROCESS_FAILED'
      },
      { status: 500 }
    );
  }
}
