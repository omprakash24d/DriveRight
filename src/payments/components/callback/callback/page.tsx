"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Home,
  Loader2,
  XCircle,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface PaymentData {
  bookingId: string;
  transactionId: string;
  merchantTransactionId: string;
  serviceTitle: string;
  amount: number;
}

interface PaymentStatus {
  success: boolean;
  state: string;
  merchantOrderId: string;
  orderId?: string;
  amount?: number;
  amountInRupees?: number;
  paymentDetails?: any[];
  error?: string;
  timestamp?: string;
}

export default function PhonePeCallbackPage() {
  const [paymentStatus, setPaymentStatus] = useState<
    "loading" | "success" | "failed" | "pending"
  >("loading");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [sdkPaymentStatus, setSdkPaymentStatus] =
    useState<PaymentStatus | null>(null);
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get parameters from URL (PhonePe SDK callback)
  const status = searchParams.get("status"); // success, failure, cancel
  const merchantOrderId = searchParams.get("merchantOrderId");

  useEffect(() => {
    const handlePaymentCallback = async () => {
      try {
        // Check if this is a new SDK callback or legacy callback
        if (merchantOrderId) {
          // New PhonePe SDK callback - always verify with API regardless of status
          console.log(
            "🔍 Verifying PhonePe SDK payment with merchantOrderId:",
            merchantOrderId
          );
          await handleSDKCallback();
        } else if (status) {
          // URL has status parameter but no merchantOrderId - this might be a malformed SDK callback
          // Let's check if we have stored payment data and try to verify
          const storedData = localStorage.getItem("pending_booking_data");
          if (storedData) {
            const bookingData = JSON.parse(storedData);
            if (bookingData.merchantOrderId) {
              console.log(
                "🔄 Found stored merchantOrderId, verifying payment..."
              );
              // Try to verify using stored merchantOrderId
              await handleSDKCallbackWithStoredData(
                bookingData.merchantOrderId
              );
            } else {
              console.log(
                "⚠️ No merchantOrderId available, falling back to legacy callback"
              );
              await handleLegacyCallback();
            }
          } else {
            console.log(
              "❌ No stored booking data found for status-only callback"
            );
            setPaymentStatus("failed");
            setError("Payment verification failed - missing transaction data");
          }
        } else {
          // Legacy callback handling
          console.log("🔄 Handling legacy callback");
          await handleLegacyCallback();
        }
      } catch (error) {
        console.error("Payment callback error:", error);
        setPaymentStatus("failed");
        setError("An error occurred while processing your payment");
      }
    };

    const handlePaymentConfirmation = async (paymentData: PaymentStatus) => {
      try {
        console.log("🔔 Confirming payment...");

        // Get stored booking data from localStorage
        const storedBookingData = localStorage.getItem("pending_booking_data");
        if (!storedBookingData) {
          console.error("❌ No stored booking data found");
          return;
        }

        const bookingData = JSON.parse(storedBookingData);

        const confirmationRequest = {
          merchantOrderId: paymentData.merchantOrderId,
          gateway: "phonepe",
          bookingId: bookingData.bookingId,
          transactionId: bookingData.transactionId,
          serviceId: bookingData.serviceId,
          serviceType: bookingData.serviceType,
          customerEmail: bookingData.customerEmail,
          customerName: bookingData.customerName,
          amount:
            paymentData.amountInRupees ||
            (paymentData.amount ? paymentData.amount / 100 : 0),
          forceConfirm: false,
        };

        const response = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(confirmationRequest),
        });

        const result = await response.json();

        if (result.success) {
          console.log("✅ Payment confirmation successful");
          toast({
            title: "Confirmation Email Sent!",
            description:
              "You will receive a booking confirmation email shortly.",
          });

          // Clean up stored data
          localStorage.removeItem("pending_booking_data");
        } else {
          console.error("❌ Payment confirmation failed:", result);
          toast({
            title: "Email Not Sent",
            description:
              "Payment successful but confirmation email failed. Please contact support.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("❌ Payment confirmation API call failed:", error);
        toast({
          title: "Email Error",
          description:
            "Payment successful but unable to send confirmation email.",
          variant: "destructive",
        });
      }
    };

    const handleSDKCallback = async () => {
      try {
        console.log("🔍 Verifying PhonePe payment...");

        // Call the order status API to get the latest payment status
        const response = await fetch("/api/payments/phonepe/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            merchantOrderId,
            includeAllDetails: true,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSdkPaymentStatus(data);

          // Map PhonePe states to our status
          if (data.state === "COMPLETED") {
            setPaymentStatus("success");

            // Call payment confirmation API
            await handlePaymentConfirmation(data);

            toast({
              title: "Payment Successful!",
              description: "Your payment has been processed successfully.",
            });
          } else if (data.state === "FAILED") {
            setPaymentStatus("failed");
            setError("Payment failed");
          } else if (data.state === "PENDING") {
            setPaymentStatus("pending");
          } else {
            setPaymentStatus("failed");
            setError("Unknown payment status");
          }

          console.log("✅ Payment verified:", data.state);
        } else {
          throw new Error(data.error || "Failed to verify payment status");
        }
      } catch (err) {
        console.error("❌ Payment verification failed:", err);
        setPaymentStatus("failed");
        setError(
          err instanceof Error ? err.message : "Failed to verify payment status"
        );
      }
    };

    const handleSDKCallbackWithStoredData = async (
      storedMerchantOrderId: string
    ) => {
      try {
        console.log("🔍 Verifying PhonePe payment with stored data...");

        // Call the order status API to get the latest payment status
        const response = await fetch("/api/payments/phonepe/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            merchantOrderId: storedMerchantOrderId,
            includeAllDetails: true,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSdkPaymentStatus(data);

          // Map PhonePe states to our status
          if (data.state === "COMPLETED") {
            setPaymentStatus("success");

            // Call payment confirmation API
            await handlePaymentConfirmation(data);

            toast({
              title: "Payment Successful!",
              description: "Your payment has been processed successfully.",
            });
          } else if (data.state === "FAILED") {
            setPaymentStatus("failed");
            setError("Payment failed");
          } else if (data.state === "PENDING") {
            setPaymentStatus("pending");
          } else {
            setPaymentStatus("failed");
            setError("Unknown payment status");
          }

          console.log("✅ Payment verified:", data.state);
        } else {
          throw new Error(data.error || "Failed to verify payment status");
        }
      } catch (err) {
        console.error("❌ Payment verification failed:", err);
        setPaymentStatus("failed");
        setError(
          err instanceof Error ? err.message : "Failed to verify payment status"
        );
      }
    };

    const handleLegacyCallback = async () => {
      // Get stored payment data (legacy)
      const storedData = localStorage.getItem("phonepe_payment_data");
      if (storedData) {
        const data: PaymentData = JSON.parse(storedData);
        setPaymentData(data);

        // Get URL parameters from PhonePe callback
        const urlParams = new URLSearchParams(window.location.search);
        const merchantTransactionId =
          urlParams.get("merchantTransactionId") || data.merchantTransactionId;
        const transactionId = urlParams.get("transactionId");
        const responseCode = urlParams.get("code");

        if (responseCode === "PAYMENT_SUCCESS") {
          // Verify payment with backend (legacy)
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
    };

    handlePaymentCallback();
  }, [merchantOrderId, status]);

  const getStatusIcon = () => {
    if (paymentStatus === "loading")
      return <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />;
    if (paymentStatus === "success")
      return <CheckCircle className="w-16 h-16 text-green-600" />;
    if (paymentStatus === "pending")
      return <AlertCircle className="w-16 h-16 text-yellow-600" />;
    return <XCircle className="w-16 h-16 text-red-600" />;
  };

  const getStatusTitle = () => {
    if (paymentStatus === "loading") return "Processing Payment...";
    if (paymentStatus === "success") return "Payment Successful!";
    if (paymentStatus === "pending") return "Payment Pending";
    return "Payment Failed";
  };

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

  const handleReturnHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">{getStatusIcon()}</div>
          <CardTitle className="text-xl">{getStatusTitle()}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {paymentStatus === "loading" && (
            <p className="text-gray-600">
              Please wait while we confirm your payment with PhonePe.
            </p>
          )}

          {paymentStatus === "success" && (
            <div className="space-y-3">
              {sdkPaymentStatus ? (
                <div>
                  <p className="text-gray-600">
                    Your payment has been processed successfully!
                  </p>
                  <div className="bg-green-50 p-3 rounded-lg text-sm mt-3">
                    <div>
                      <strong>Order ID:</strong>{" "}
                      {sdkPaymentStatus.merchantOrderId}
                    </div>
                    {sdkPaymentStatus.orderId && (
                      <div>
                        <strong>PhonePe Order ID:</strong>{" "}
                        {sdkPaymentStatus.orderId}
                      </div>
                    )}
                    {sdkPaymentStatus.amountInRupees && (
                      <div>
                        <strong>Amount:</strong> ₹
                        {sdkPaymentStatus.amountInRupees.toFixed(2)}
                      </div>
                    )}
                    <div>
                      <strong>Status:</strong> {sdkPaymentStatus.state}
                    </div>
                  </div>
                </div>
              ) : paymentData ? (
                <div>
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
                </div>
              ) : (
                <p className="text-gray-600">
                  Your payment has been processed successfully!
                </p>
              )}
              <p className="text-xs text-gray-500">
                You will receive a confirmation email shortly.
              </p>
            </div>
          )}

          {paymentStatus === "pending" && sdkPaymentStatus && (
            <div className="space-y-3">
              <p className="text-gray-600">
                Your payment is being processed. You will be notified once the
                transaction is complete.
              </p>
              <div className="bg-yellow-50 p-3 rounded-lg text-sm">
                <div>
                  <strong>Order ID:</strong> {sdkPaymentStatus.merchantOrderId}
                </div>
                {sdkPaymentStatus.orderId && (
                  <div>
                    <strong>PhonePe Order ID:</strong>{" "}
                    {sdkPaymentStatus.orderId}
                  </div>
                )}
                {sdkPaymentStatus.amountInRupees && (
                  <div>
                    <strong>Amount:</strong> ₹
                    {sdkPaymentStatus.amountInRupees.toFixed(2)}
                  </div>
                )}
                <div>
                  <strong>Status:</strong> {sdkPaymentStatus.state}
                </div>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  If your payment status doesn&apos;t update within 10 minutes,
                  please contact our support team.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {paymentStatus === "failed" && (
            <div className="space-y-3">
              <p className="text-gray-600">
                {error ||
                  "Your payment could not be processed. Please try again."}
              </p>
              {sdkPaymentStatus ? (
                <div className="bg-red-50 p-3 rounded-lg text-sm">
                  <div>
                    <strong>Order ID:</strong>{" "}
                    {sdkPaymentStatus.merchantOrderId}
                  </div>
                  {sdkPaymentStatus.orderId && (
                    <div>
                      <strong>PhonePe Order ID:</strong>{" "}
                      {sdkPaymentStatus.orderId}
                    </div>
                  )}
                  <div>
                    <strong>Status:</strong> {sdkPaymentStatus.state}
                  </div>
                </div>
              ) : (
                paymentData && (
                  <div className="bg-red-50 p-3 rounded-lg text-sm">
                    <div>
                      <strong>Service:</strong> {paymentData.serviceTitle}
                    </div>
                    <div>
                      <strong>Amount:</strong> ₹{paymentData.amount}
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <div className="pt-4 space-y-2">
            {paymentStatus === "success" && (
              <Button onClick={handleContinue} className="w-full">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {paymentStatus === "pending" && (
              <Button
                onClick={handleReturnHome}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Return to Home
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

      <div className="absolute bottom-4 text-center text-sm text-gray-500 w-full">
        <p>Payment processed securely by PhonePe</p>
        <p className="mt-1">Having issues? Contact our support team</p>
      </div>
    </div>
  );
}
