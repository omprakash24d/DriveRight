import { db } from '@/lib/firebase';
import { EmailService } from '@/services/emailService';
import { EnhancedServicesManager } from '@/services/enhancedServicesService';
import crypto from 'crypto';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { z } from 'zod';

// Payment verification schema
const verifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_signature: z.string().min(1, 'Payment signature is required'),
  bookingId: z.string().min(1, 'Booking ID is required'),
  transactionId: z.string().min(1, 'Transaction ID is required')
});

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = verifyPaymentSchema.parse(body);

    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId, transactionId } = validatedData;

    // Verify payment signature
    const body_string = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body_string)
      .digest("hex");

    const isSignatureValid = generated_signature === razorpay_signature;

    if (!isSignatureValid) {
      // Update transaction as failed
      await updateDoc(doc(db, 'transactions', transactionId), {
        status: 'failed',
        updatedAt: Timestamp.fromDate(new Date()),
        metadata: {
          failureReason: 'Invalid payment signature',
          razorpayPaymentId: razorpay_payment_id,
          razorpayOrderId: razorpay_order_id
        }
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Payment verification failed',
          code: 'INVALID_SIGNATURE'
        },
        { status: 400 }
      );
    }

    // Fetch payment details from Razorpay
    let paymentDetails;
    try {
      paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (razorpayError) {
      console.error('Error fetching payment details from Razorpay:', razorpayError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to verify payment with gateway',
          code: 'GATEWAY_ERROR'
        },
        { status: 500 }
      );
    }

    // Check if payment was successful
    if (paymentDetails.status !== 'captured') {
      // Update transaction as failed
      await updateDoc(doc(db, 'transactions', transactionId), {
        status: 'failed',
        updatedAt: Timestamp.fromDate(new Date()),
        gatewayPaymentId: razorpay_payment_id,
        metadata: {
          failureReason: `Payment status: ${paymentDetails.status}`,
          paymentDetails: {
            status: paymentDetails.status,
            method: paymentDetails.method,
            amount: paymentDetails.amount,
            currency: paymentDetails.currency
          }
        }
      });

      // Get booking details for failure email
      const bookingDoc = await getDoc(doc(db, 'serviceBookings', bookingId));
      if (bookingDoc.exists()) {
        const bookingData = bookingDoc.data();
        
        // Send payment failure email
        try {
          await EmailService.sendPaymentFailure({
            to: bookingData.customerInfo.email,
            customerName: bookingData.customerInfo.name,
            bookingId,
            serviceName: 'Service', // You might want to fetch actual service name
            failureReason: `Payment ${paymentDetails.status}`,
            retryLink: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/retry?bookingId=${bookingId}`
          });
        } catch (emailError) {
          console.error('Failed to send payment failure email:', emailError);
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Payment was not successful',
          code: 'PAYMENT_NOT_CAPTURED',
          paymentStatus: paymentDetails.status
        },
        { status: 400 }
      );
    }

    // Payment successful - update records
    try {
      // Update transaction record
      await updateDoc(doc(db, 'transactions', transactionId), {
        status: 'success',
        gatewayPaymentId: razorpay_payment_id,
        updatedAt: Timestamp.fromDate(new Date()),
        metadata: {
          paymentDetails: {
            status: paymentDetails.status,
            method: paymentDetails.method,
            amount: paymentDetails.amount,
            currency: paymentDetails.currency,
            bank: paymentDetails.bank,
            wallet: paymentDetails.wallet,
            vpa: paymentDetails.vpa,
            email: paymentDetails.email,
            contact: paymentDetails.contact,
            fee: paymentDetails.fee,
            tax: paymentDetails.tax,
            international: paymentDetails.international,
            captured: paymentDetails.captured,
            created_at: paymentDetails.created_at
          }
        }
      });

      // Update booking record
      await updateDoc(doc(db, 'serviceBookings', bookingId), {
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentDetails: {
          transactionId,
          paymentMethod: paymentDetails.method || 'razorpay',
          paidAmount: typeof paymentDetails.amount === 'number' ? paymentDetails.amount / 100 : 0, // Convert paise to rupees
          paymentDate: new Date((paymentDetails.created_at || 0) * 1000),
          gatewayOrderId: razorpay_order_id,
          gatewayPaymentId: razorpay_payment_id
        },
        updatedAt: Timestamp.fromDate(new Date())
      });

      // Get booking details for confirmation email
      const bookingDoc = await getDoc(doc(db, 'serviceBookings', bookingId));
      const transactionDoc = await getDoc(doc(db, 'transactions', transactionId));
      
      if (bookingDoc.exists() && transactionDoc.exists()) {
        const bookingData = bookingDoc.data();
        const transactionData = transactionDoc.data();
        
        // Send payment confirmation email
        try {
          await EmailService.sendPaymentConfirmation({
            to: bookingData.customerInfo.email,
            customerName: bookingData.customerInfo.name,
            bookingId,
            transactionId,
            serviceName: transactionData.serviceId, // You might want to fetch actual service name
            serviceType: transactionData.serviceType,
            amount: typeof paymentDetails.amount === 'number' ? paymentDetails.amount / 100 : 0,
            currency: paymentDetails.currency?.toUpperCase() || 'INR',
            paymentDate: new Date(paymentDetails.created_at * 1000),
            paymentMethod: paymentDetails.method || 'Razorpay',
            razorpayPaymentId: razorpay_payment_id
          });
        } catch (emailError) {
          console.error('Failed to send payment confirmation email:', emailError);
          // Don't fail the verification if email fails
        }
      }

      // Record audit log
      await EnhancedServicesManager.recordTransaction({
        bookingId,
        serviceId: transactionDoc.exists() ? transactionDoc.data().serviceId : 'unknown',
        serviceType: transactionDoc.exists() ? transactionDoc.data().serviceType : 'training',
        customerId: transactionDoc.exists() ? transactionDoc.data().customerId : 'unknown',
        transactionType: 'payment',
        amount: typeof paymentDetails.amount === 'number' ? paymentDetails.amount / 100 : 0,
        currency: paymentDetails.currency?.toUpperCase() as 'INR' | 'USD' || 'INR',
        status: 'success',
        paymentGateway: 'razorpay',
        gatewayTransactionId: razorpay_payment_id,
        gatewayOrderId: razorpay_order_id,
        gatewayPaymentId: razorpay_payment_id,
        metadata: {
          customerIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          additionalInfo: {
            paymentMethod: paymentDetails.method,
            paymentDate: new Date((paymentDetails.created_at || 0) * 1000),
            verificationDate: new Date(),
            signatureVerified: true
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          bookingId,
          transactionId,
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          amount: typeof paymentDetails.amount === 'number' ? paymentDetails.amount / 100 : 0,
          currency: paymentDetails.currency.toUpperCase(),
          method: paymentDetails.method,
          status: 'success',
          paidAt: new Date(paymentDetails.created_at * 1000)
        }
      });

    } catch (dbError) {
      console.error('Error updating payment records:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Payment verified but failed to update records',
          code: 'DATABASE_ERROR'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error verifying payment:', error);

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

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify payment',
        message: error instanceof Error ? error.message : 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const orderId = searchParams.get('orderId');

    if (!paymentId && !orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment ID or Order ID is required',
          code: 'MISSING_PARAMETER'
        },
        { status: 400 }
      );
    }

    let razorpayDetails = null;

    if (paymentId) {
      try {
        razorpayDetails = await razorpay.payments.fetch(paymentId);
      } catch (razorpayError) {
        console.error('Error fetching payment from Razorpay:', razorpayError);
      }
    } else if (orderId) {
      try {
        razorpayDetails = await razorpay.orders.fetch(orderId);
      } catch (razorpayError) {
        console.error('Error fetching order from Razorpay:', razorpayError);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId,
        orderId,
        razorpayDetails,
        status: razorpayDetails?.status || 'unknown',
        amount: razorpayDetails?.amount && typeof razorpayDetails.amount === 'number' ? razorpayDetails.amount / 100 : 0,
        currency: razorpayDetails?.currency?.toUpperCase() || 'INR'
      }
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check payment status',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
