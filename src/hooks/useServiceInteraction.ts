// Custom hook for managing service interactions
"use client";

import type { BookingFormData } from "@/components/forms/BookingDialog";
import { toast } from "@/hooks/use-toast";
import { useCallback, useState } from "react";

export interface ServiceInteractionState {
  selectedService: any | null;
  showBookingDialog: boolean;
  bookingType: "training" | "online";
  loading: boolean;
}

export function useServiceInteraction() {
  const [state, setState] = useState<ServiceInteractionState>({
    selectedService: null,
    showBookingDialog: false,
    bookingType: "training",
    loading: false,
  });

  // Handle service booking
  const handleServiceBook = useCallback((serviceId: string, services: any[], type: "training" | "online") => {
    const service = services.find(s => s.id === serviceId);
    if (!service) {
      toast({
        title: "Service not found",
        description: "The selected service could not be found.",
        variant: "destructive",
      });
      return;
    }

    setState(prev => ({
      ...prev,
      selectedService: service,
      showBookingDialog: true,
      bookingType: type,
    }));
  }, []);

  // Handle learn more action
  const handleServiceLearnMore = useCallback((serviceId: string) => {
    // Navigate to service details or show more info
    // This can be customized based on your routing needs
    window.location.href = `/services/${serviceId}`;
  }, []);

  // Close booking dialog
  const closeBookingDialog = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedService: null,
      showBookingDialog: false,
    }));
  }, []);

  // Submit booking form
  const submitBooking = useCallback(async (formData: BookingFormData): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      // Submit booking data to your API
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          submittedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit booking request');
      }

      const result = await response.json();
      
      toast({
        title: "Booking Request Submitted!",
        description: "We'll contact you soon to confirm your booking.",
      });

      // Close dialog and reset state
      closeBookingDialog();
      
    } catch (error: any) {
      console.error('Booking submission error:', error);
      
      toast({
        title: "Booking Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      
      throw error; // Re-throw so dialog can handle it
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [closeBookingDialog]);

  // Handle payment flow (for paid services)
  const initiatePayment = useCallback(async (serviceId: string, amount: number) => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      // Create payment order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId,
          amount,
          currency: 'INR',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      const { orderId, amount: orderAmount, currency } = await response.json();

      // Initialize Razorpay payment
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderAmount,
        currency,
        order_id: orderId,
        name: 'DriveRight Driving School',
        description: `Payment for service: ${serviceId}`,
        handler: async (response: any) => {
          // Verify payment
          const verifyResponse = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });

          if (verifyResponse.ok) {
            toast({
              title: "Payment Successful!",
              description: "Your booking has been confirmed.",
            });
          } else {
            throw new Error('Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#3B82F6',
        },
      };

      // Load Razorpay script and open payment modal
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);

    } catch (error: any) {
      console.error('Payment initiation error:', error);
      
      toast({
        title: "Payment Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  return {
    ...state,
    handleServiceBook,
    handleServiceLearnMore,
    closeBookingDialog,
    submitBooking,
    initiatePayment,
  };
}

export default useServiceInteraction;
