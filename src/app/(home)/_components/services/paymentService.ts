import { toast } from "@/hooks/use-toast";
import { BookingFormData, PaymentOptions } from "./types";

export const createBookingOrder = async (
  serviceId: string,
  serviceType: 'training' | 'online',
  bookingForm: BookingFormData
) => {
  const response = await fetch("/api/services/payment/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serviceId,
      serviceType,
      customerInfo: {
        name: bookingForm.customerName,
        email: bookingForm.customerEmail,
        phone: bookingForm.customerPhone,
        address: bookingForm.customerAddress,
      },
      scheduledDate: bookingForm.scheduledDate,
      notes: bookingForm.notes,
      metadata: {
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        source: "quick-services",
      },
    }),
  });

  return response.json();
};

export const initializePayment = (
  paymentConfig: PaymentOptions,
  onSuccess: (response: any) => void,
  onError: (error: any) => void
) => {
  const options = {
    ...paymentConfig,
    handler: onSuccess,
    modal: {
      ondismiss: () => {
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the payment process.",
          variant: "destructive",
        });
      },
    },
  };

  const razorpay = new (window as any).Razorpay(options);
  
  razorpay.on("payment.failed", (response: any) => {
    onError(response);
  });

  razorpay.open();
};
