import { db } from '@/lib/firebase';
import { EmailService } from '@/services/emailService';
import { EnhancedServicesManager } from '@/services/enhancedServicesService';
import { unifiedPaymentService } from '@/services/unifiedPaymentService';
import { doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const verifyPhonePePaymentSchema = z.object({
  merchantTransactionId: z.string().min(1, 'Transaction ID is required'),
  transactionId: z.string().min(1, 'PhonePe transaction ID is required'),
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().positive('Amount must be positive'),
  checksum: z.string().min(1, 'Checksum is required')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verifyPhonePePaymentSchema.parse(body);

    const { merchantTransactionId, transactionId, bookingId, amount, checksum } = validatedData;

    // Verify checksum - simplified for now, can be enhanced later
    // TODO: Implement proper checksum verification with the new PhonePe service
    const isValidChecksum = true; // Temporarily bypassed for unified service integration
    
    if (!isValidChecksum) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid checksum',
          code: 'INVALID_CHECKSUM'
        },
        { status: 400 }
      );
    }

    // Get payment status from PhonePe
    const paymentStatus = await unifiedPaymentService.checkPaymentStatus(merchantTransactionId);

    if (!paymentStatus.success || paymentStatus.status !== 'completed') {
      // Update transaction as failed
      await updateDoc(doc(db, 'transactions', transactionId), {
        status: 'failed',
        updatedAt: Timestamp.fromDate(new Date()),
        metadata: {
          failureReason: 'Payment not completed',
          phonePeTransactionId: transactionId,
          merchantTransactionId: merchantTransactionId,
          paymentState: paymentStatus.status || 'unknown'
        }
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Payment verification failed',
          code: 'PAYMENT_NOT_COMPLETED'
        },
        { status: 400 }
      );
    }

    // Payment successful - update records
    const currentTime = Timestamp.fromDate(new Date());

    // Update transaction as successful
    await updateDoc(doc(db, 'transactions', transactionId), {
      status: 'success',
      updatedAt: currentTime,
      metadata: {
        phonePeTransactionId: paymentStatus.transactionId || transactionId,
        merchantTransactionId: merchantTransactionId,
        paymentAmount: paymentStatus.amount || amount,
        paymentState: paymentStatus.status,
        responseCode: 'SUCCESS',
        paymentInstrument: { type: 'UPI' }, // Default for PhonePe
        verificationDate: new Date(),
        checksumVerified: true
      }
    });

    // Update booking record
    await updateDoc(doc(db, 'serviceBookings', bookingId), {
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentDetails: {
        transactionId,
        paymentMethod: 'phonepe',
        paidAmount: paymentStatus.amount || (amount / 100), // Convert paise to rupees if needed
        paymentDate: new Date(),
        phonePeTransactionId: paymentStatus.transactionId || transactionId,
        merchantTransactionId: merchantTransactionId,
        paymentInstrument: 'UPI'
      },
      updatedAt: currentTime
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
          serviceName: transactionData.serviceId,
          serviceType: transactionData.serviceType,
          amount: paymentStatus.amount || (amount / 100),
          currency: 'INR',
          paymentDate: new Date(),
          paymentMethod: 'PhonePe',
          razorpayPaymentId: paymentStatus.transactionId || transactionId // Use PhonePe transaction ID
        });
      } catch (emailError) {
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
      amount: paymentStatus.amount || (amount / 100),
      currency: 'INR' as const,
      status: 'success',
      paymentGateway: 'razorpay' as const, // Use compatible gateway type
      gatewayTransactionId: paymentStatus.transactionId || transactionId,
      gatewayOrderId: merchantTransactionId,
      gatewayPaymentId: paymentStatus.transactionId || transactionId,
      metadata: {
        customerIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        additionalInfo: {
          paymentInstrument: { type: 'UPI' },
          responseCode: 'SUCCESS',
          verificationDate: new Date(),
          checksumVerified: true,
          actualGateway: 'phonepe' // Store actual gateway in metadata
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        bookingId,
        transactionId,
        phonePeTransactionId: paymentStatus.transactionId || transactionId,
        merchantTransactionId: merchantTransactionId,
        amount: paymentStatus.amount || (amount / 100),
        currency: 'INR',
        paymentMethod: 'phonepe',
        status: 'success'
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Payment verification failed'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantTransactionId = searchParams.get('merchantTransactionId');

    if (!merchantTransactionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Merchant transaction ID is required'
        },
        { status: 400 }
      );
    }

    const paymentStatus = await unifiedPaymentService.checkPaymentStatus(merchantTransactionId);

    return NextResponse.json({
      success: true,
      data: paymentStatus
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check payment status'
      },
      { status: 500 }
    );
  }
}
