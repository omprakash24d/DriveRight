"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowRight, CheckCircle, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PaymentData {
  bookingId: string;
  transactionId: string;
  merchantTransactionId: string;
  serviceTitle: string;
  amount: number;
}

export default function PhonePeCallbackPage() {
  const [paymentStatus, setPaymentStatus] = useState<
    "loading" | "success" | "failed"
  >("loading");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        // Get stored payment data
        const storedData = localStorage.getItem("phonepe_payment_data");
        if (storedData) {
          const data: PaymentData = JSON.parse(storedData);
          setPaymentData(data);

          // Get URL parameters from PhonePe callback
          const urlParams = new URLSearchParams(window.location.search);
          const merchantTransactionId =
            urlParams.get("merchantTransactionId") ||
            data.merchantTransactionId;
          const transactionId = urlParams.get("transactionId");
          const responseCode = urlParams.get("code");

          if (responseCode === "PAYMENT_SUCCESS") {
            // Verify payment with backend
            const verifyResponse = await fetch("/api/payment/phonepe/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                merchantTransactionId,
                transactionId: transactionId || data.transactionId,
                bookingId: data.bookingId,
                amount: data.amount,
                checksum: urlParams.get("checksum") || "",
              }),
            });

            const verifyResult = await verifyResponse.json();

            if (verifyResult.success) {
              setPaymentStatus("success");
              toast({
                title: "Payment Successful!",
                description: `Your booking for ${data.serviceTitle} has been confirmed.`,
              });

              // Clean up stored data
              localStorage.removeItem("phonepe_payment_data");
            } else {
              setPaymentStatus("failed");
              setError(verifyResult.error || "Payment verification failed");
            }
          } else {
            setPaymentStatus("failed");
            setError("Payment was not successful");
          }
        } else {
          setPaymentStatus("failed");
          setError("Payment data not found");
        }
      } catch (error) {
        console.error("Payment callback error:", error);
        setPaymentStatus("failed");
        setError("An error occurred while processing your payment");
      }
    };

    handlePaymentCallback();
  }, []);

  const handleContinue = () => {
    if (paymentStatus === "success") {
      router.push("/services?success=true");
    } else {
      router.push("/services");
    }
  };

  const handleRetryPayment = () => {
    router.push("/services");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {paymentStatus === "loading" && (
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            )}
            {paymentStatus === "success" && (
              <CheckCircle className="w-16 h-16 text-green-600" />
            )}
            {paymentStatus === "failed" && (
              <XCircle className="w-16 h-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-xl">
            {paymentStatus === "loading" && "Processing Payment..."}
            {paymentStatus === "success" && "Payment Successful!"}
            {paymentStatus === "failed" && "Payment Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {paymentStatus === "loading" && (
            <p className="text-gray-600">
              Please wait while we confirm your payment with PhonePe.
            </p>
          )}

          {paymentStatus === "success" && paymentData && (
            <div className="space-y-3">
              <p className="text-gray-600">
                Your booking has been confirmed successfully!
              </p>
              <div className="bg-green-50 p-3 rounded-lg text-sm">
                <div>
                  <strong>Service:</strong> {paymentData.serviceTitle}
                </div>
                <div>
                  <strong>Amount:</strong> ₹{paymentData.amount}
                </div>
                <div>
                  <strong>Booking ID:</strong>{" "}
                  {paymentData.bookingId.substring(0, 8)}...
                </div>
              </div>
              <p className="text-xs text-gray-500">
                You will receive a confirmation email shortly.
              </p>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="space-y-3">
              <p className="text-gray-600">
                {error ||
                  "Your payment could not be processed. Please try again."}
              </p>
              {paymentData && (
                <div className="bg-red-50 p-3 rounded-lg text-sm">
                  <div>
                    <strong>Service:</strong> {paymentData.serviceTitle}
                  </div>
                  <div>
                    <strong>Amount:</strong> ₹{paymentData.amount}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 space-y-2">
            {paymentStatus === "success" && (
              <Button onClick={handleContinue} className="w-full">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {paymentStatus === "failed" && (
              <div className="space-y-2">
                <Button onClick={handleRetryPayment} className="w-full">
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={handleContinue}
                  className="w-full"
                >
                  Back to Services
                </Button>
              </div>
            )}

            {paymentStatus === "loading" && (
              <Button disabled className="w-full">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
