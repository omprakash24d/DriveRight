"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { AnyService } from "../types";

interface BookingFooterProps {
  isFormValid: boolean;
  loading: boolean;
  finalPrice: string;
  onCancel: () => void;
  onBook: () => void;
  serviceAriaLabel: string;
  selectedPaymentGateway: string;

  // Service summary props (moved from ServiceSummary)
  service: AnyService;
  isTraining: boolean;
  serviceInfo: { displayName: string; description?: string };
  discountInfo: { hasDiscount: boolean; savings: number };
  basePrice: string;
  savingsAmount: string;
}

export default function BookingFooter({
  isFormValid,
  loading,
  finalPrice,
  onCancel,
  onBook,
  serviceAriaLabel,
  selectedPaymentGateway,

  service,
  isTraining,
  serviceInfo,
  discountInfo,
  basePrice,
  savingsAmount,
}: BookingFooterProps) {
  return (
    <div className="border-t bg-gradient-to-r from-white to-gray-50/40 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-4">
      {/* Compact service summary inside footer */}
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {serviceInfo.displayName}
            </h4>
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
              {isTraining ? "Training" : "Service"}
            </span>
          </div>
          {serviceInfo.description && (
            <p className="text-xs text-muted-foreground truncate mt-1">
              {serviceInfo.description}
            </p>
          )}
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {finalPrice}
          </div>
          {discountInfo.hasDiscount && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span className="line-through mr-2">{basePrice}</span>
              <span className="text-green-600">You save {savingsAmount}</span>
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="flex gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>

        <Button
          onClick={onBook}
          disabled={loading || !isFormValid}
          className="flex-1"
          aria-label={serviceAriaLabel}
        >
          {loading ? "Processing..." : `Pay ${finalPrice}`}
        </Button>
      </DialogFooter>

      <p className="text-xs text-gray-500 text-center mt-2">
        🔒 Secured by{" "}
        {selectedPaymentGateway === "phonepe" ? "PhonePe" : "Razorpay"}
      </p>
    </div>
  );
}
