import { db } from '@/lib/firebase';
import { EmailService } from '@/services/emailService';
import { EnhancedServicesManager } from '@/services/enhancedServicesService';
import { collection, doc, getDoc, getDocs, limit, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const mockConfirmSchema = z.object({
  merchantTransactionId: z.string().min(1, 'Transaction ID is required'),
  bookingId: z.string().min(1, 'Booking ID is required'),
  status: z.enum(['success', 'failed'])
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = mockConfirmSchema.parse(body);

    const { merchantTransactionId, bookingId, status } = validatedData;

    console.log('🎯 PhonePe Mock Confirmation:', {
      merchantTransactionId,
      bookingId,
      status
    });

    // Get the transaction document using merchantTransactionId
    const transactionsRef = collection(db, 'transactions');
    const transactionQuery = await getDocs(
      query(
        transactionsRef,
        where('merchantTransactionId', '==', merchantTransactionId),
        limit(1)
      )
    );

    if (transactionQuery.docs.length === 0) {
      console.error('❌ Transaction not found for merchantTransactionId:', merchantTransactionId);
      return NextResponse.json(
        {
          success: false,
          error: 'Transaction not found'
        },
        { status: 404 }
      );
    }

    const transactionDoc = transactionQuery.docs[0];
    const transactionData = transactionDoc.data();
    const transactionId = transactionDoc.id;

    console.log('📄 Found transaction:', {
      transactionId,
      transactionData: {
        amount: transactionData.amount,
        serviceId: transactionData.serviceId,
        serviceType: transactionData.serviceType
      }
    });

    const currentTime = Timestamp.fromDate(new Date());

    if (status === 'success') {
      // Update transaction as successful
      await updateDoc(doc(db, 'transactions', transactionId), {
        status: 'success',
        updatedAt: currentTime,
        paymentGateway: 'phonepe',
        metadata: {
          ...transactionData.metadata,
          mockPayment: true,
          phonePeTransactionId: `mock_${merchantTransactionId}`,
          merchantTransactionId: merchantTransactionId,
          paymentAmount: transactionData.amount * 100, // Store in paise for consistency
          paymentState: 'COMPLETED',
          responseCode: 'SUCCESS',
          paymentInstrument: { type: 'UPI', utr: `mock_utr_${Date.now()}` },
          verificationDate: new Date(),
          mockConfirmedAt: new Date()
        }
      });

      // Update booking record
      await updateDoc(doc(db, 'serviceBookings', bookingId), {
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentDetails: {
          transactionId,
          paymentMethod: 'phonepe',
          paidAmount: transactionData.amount,
          paymentDate: new Date(),
          phonePeTransactionId: `mock_${merchantTransactionId}`,
          merchantTransactionId: merchantTransactionId,
          paymentInstrument: 'UPI',
          mockPayment: true
        },
        updatedAt: currentTime
      });

      console.log('✅ Updated transaction and booking records');

      // Get booking details for confirmation email
      const bookingDoc = await getDoc(doc(db, 'serviceBookings', bookingId));
      let emailSent = false;
      
      if (bookingDoc.exists()) {
        const bookingData = bookingDoc.data();
        
        console.log('📧 Sending confirmation email to:', bookingData.customerInfo.email);
        
        // Send payment confirmation email
        try {
          await EmailService.sendPaymentConfirmation({
            to: bookingData.customerInfo.email,
            customerName: bookingData.customerInfo.name,
            bookingId,
            transactionId,
            serviceName: transactionData.serviceTitle || transactionData.serviceId,
            serviceType: transactionData.serviceType,
            amount: transactionData.amount,
            currency: 'INR',
            paymentDate: new Date(),
            paymentMethod: 'PhonePe (Mock)',
            razorpayPaymentId: `mock_${merchantTransactionId}` // Use mock transaction ID
          });
          emailSent = true;
          console.log('✅ Confirmation email sent successfully');
        } catch (emailError) {
          console.error('❌ Failed to send payment confirmation email:', emailError);
          emailSent = false;
        }
      }

      // Record audit log
      try {
        await EnhancedServicesManager.recordTransaction({
          bookingId,
          serviceId: transactionData.serviceId,
          serviceType: transactionData.serviceType,
          customerId: transactionData.customerId,
          transactionType: 'payment',
          amount: transactionData.amount,
          currency: 'INR' as const,
          status: 'success',
          paymentGateway: 'razorpay' as const, // Use compatible gateway type
          gatewayTransactionId: `mock_${merchantTransactionId}`,
          gatewayOrderId: merchantTransactionId,
          gatewayPaymentId: `mock_${merchantTransactionId}`,
          metadata: {
            customerIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            additionalInfo: {
              mockPayment: true,
              paymentInstrument: { type: 'UPI', utr: `mock_utr_${Date.now()}` },
              responseCode: 'SUCCESS',
              verificationDate: new Date(),
              mockConfirmedAt: new Date(),
              actualGateway: 'phonepe'
            }
          }
        });
        console.log('✅ Audit log recorded successfully');
      } catch (auditError) {
        console.error('❌ Failed to record audit log:', auditError);
      }

      return NextResponse.json({
        success: true,
        message: 'Mock payment confirmed successfully',
        data: {
          bookingId,
          transactionId,
          phonePeTransactionId: `mock_${merchantTransactionId}`,
          merchantTransactionId,
          amount: transactionData.amount,
          currency: 'INR',
          paymentMethod: 'phonepe',
          status: 'success',
          mockPayment: true,
          emailSent
        }
      });

    } else {
      // Update transaction as failed
      await updateDoc(doc(db, 'transactions', transactionId), {
        status: 'failed',
        updatedAt: currentTime,
        metadata: {
          ...transactionData.metadata,
          mockPayment: true,
          failureReason: 'User simulated failure',
          phonePeTransactionId: `mock_failed_${merchantTransactionId}`,
          merchantTransactionId: merchantTransactionId,
          paymentState: 'FAILED',
          responseCode: 'FAILURE',
          mockFailedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Mock payment marked as failed',
        data: {
          bookingId,
          transactionId,
          merchantTransactionId,
          status: 'failed',
          mockPayment: true
        }
      });
    }

  } catch (error) {
    console.error('❌ PhonePe mock confirmation error:', error);
    
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
        error: 'Mock payment confirmation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
