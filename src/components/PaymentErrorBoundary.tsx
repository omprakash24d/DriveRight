"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw } from "lucide-react";
import React, { ErrorInfo, ReactNode } from "react";

interface PaymentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface PaymentErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class PaymentErrorBoundary extends React.Component<
  PaymentErrorBoundaryProps,
  PaymentErrorBoundaryState
> {
  constructor(props: PaymentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PaymentErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Payment Error Boundary caught an error:", error, errorInfo);

    // Log error to monitoring service
    if (typeof window !== "undefined") {
      // Client-side error logging
      window.dispatchEvent(
        new CustomEvent("payment-error", {
          detail: { error, errorInfo },
        })
      );
    }

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">Payment Unavailable</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              We&apos;re experiencing technical difficulties with the payment
              system. Please try again or contact support.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-left text-xs bg-gray-100 p-2 rounded">
                <summary className="cursor-pointer font-semibold">
                  Error Details
                </summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error.message}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={() => (window.location.href = "/contact")}
                variant="default"
              >
                Contact Support
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              Error ID: {Date.now().toString(36).toUpperCase()}
            </p>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function usePaymentErrorHandler() {
  const handlePaymentError = (error: Error, context?: Record<string, any>) => {
    console.error("Payment error:", error, context);

    // Log to monitoring service
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("payment-error", {
          detail: { error, context },
        })
      );
    }
  };

  return { handlePaymentError };
}
