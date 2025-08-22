import { usePaymentErrorHandler } from '@/components/PaymentErrorBoundary';
import { toast } from '@/hooks/use-toast';
import { useCallback, useState } from 'react';
import { createBookingOrder, initializePayment } from './paymentService';
import { AnyService, BookingFormData } from './types';

interface UsePaymentProcessingOptions {
  service: AnyService;
  type: 'training' | 'online';
  onSuccess?: () => void;
  onClose?: () => void;
}

export function usePaymentProcessing({ 
  service, 
  type, 
  onSuccess, 
  onClose 
}: UsePaymentProcessingOptions) {
  const [loading, setLoading] = useState(false);
  const { handlePaymentError } = usePaymentErrorHandler();

  const processPayment = useCallback(async (bookingForm: BookingFormData) => {
    setLoading(true);

    try {
      const result = await createBookingOrder(service.id, type, bookingForm);

      if (result.success) {
        onClose?.();

        // Initialize Razorpay payment
        initializePayment(
          result.data.paymentConfig,
          (response: any) => {
            toast({
              title: "Payment Successful!",
              description: `Booking confirmed for ${service.title}. Payment ID: ${response.razorpay_payment_id}`,
            });

            onSuccess?.();
          },
          (response: any) => {
            // Use enhanced service pricing structure
            const finalPrice = (service.pricing as any)?.finalPrice || 
                             (service.pricing as any)?.discountPrice || 
                             service.pricing?.basePrice || 0;

            handlePaymentError(new Error(response.error.description), {
              serviceId: service.id,
              bookingId: result.data.bookingId,
              amount: finalPrice,
            });

            toast({
              title: "Payment Failed",
              description:
                response.error.description || "Payment could not be processed.",
              variant: "destructive",
            });
          }
        );
      } else {
        toast({
          title: "Booking Failed",
          description:
            result.error || "Failed to create booking. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [service, type, onSuccess, onClose, handlePaymentError]);

  return {
    loading,
    processPayment,
  };
}
