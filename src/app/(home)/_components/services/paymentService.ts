import { toast } from "@/hooks/use-toast";
import { PaymentGateway } from "@/types/payment";
import { BookingFormData } from "./types";

export const createBookingOrder = async (
  serviceId: string,
  serviceType: 'training' | 'online',
  bookingForm: BookingFormData,
  paymentGateway: PaymentGateway = 'phonepe' // PhonePe as default
) => {
  const response = await fetch("/api/services/payment/create-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serviceId,
      serviceType,
      paymentGateway, // Include payment gateway selection
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
  paymentResponse: any,
  onSuccess: (response: any) => void,
  onError: (error: any) => void
) => {
  const { gateway, paymentConfig, paymentUrl } = paymentResponse;

  if (gateway === 'phonepe') {
    // Handle PhonePe redirect payment
    if (paymentUrl) {
      // For PhonePe, we redirect to their payment page
      window.location.href = paymentUrl;
    } else {
      onError({ error: { description: 'PhonePe payment URL not available' } });
    }
  } else if (gateway === 'razorpay') {
    // Handle Razorpay modal payment (existing logic)
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
  } else {
    onError({ error: { description: 'Unsupported payment gateway' } });
  }
};
