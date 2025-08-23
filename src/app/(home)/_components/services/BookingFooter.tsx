"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Shield,
} from "lucide-react";

interface BookingFooterProps {
  isFormValid: boolean;
  loading: boolean;
  finalPrice: string;
  onCancel: () => void;
  onBook: () => void;
  serviceAriaLabel: string;
  selectedPaymentGateway: string;
}

export default function BookingFooter({
  isFormValid,
  loading,
  finalPrice,
  onCancel,
  onBook,
  serviceAriaLabel,
  selectedPaymentGateway,
}: BookingFooterProps) {
  const progressPercentage = isFormValid ? 100 : 60;
  const isReady = isFormValid && !loading;

  return (
    <div className="relative overflow-hidden">
      {/* Enhanced background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-100/80 via-gray-50/60 to-transparent dark:from-gray-800/80 dark:via-gray-700/60 dark:to-transparent"></div>

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-200/30 to-transparent rounded-full transform -translate-x-16 translate-y-16"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-green-200/30 to-transparent rounded-full transform translate-x-12 translate-y-12"></div>
      </div>

      <div className="relative px-6 py-6 border-t border-gray-200/70 dark:border-gray-600/70 backdrop-blur-sm">
        {/* Enhanced progress section */}
        <div className="mb-6">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-white/50 dark:border-gray-600/50 shadow-lg">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                    isFormValid
                      ? "bg-green-500 animate-pulse"
                      : "bg-blue-500 animate-pulse"
                  }`}
                ></div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Booking Progress
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900 dark:text-white">
                  {progressPercentage}%
                </span>
                {isFormValid && (
                  <CheckCircle2 className="h-4 w-4 text-green-500 animate-bounce" />
                )}
              </div>
            </div>

            {/* Enhanced progress bar */}
            <div className="relative">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className={`h-3 rounded-full transition-all duration-1000 ease-out relative ${
                    isFormValid
                      ? "bg-gradient-to-r from-green-500 via-emerald-500 to-green-600"
                      : "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700"
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                >
                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>

              {/* Progress markers */}
              <div className="absolute top-0 left-0 w-full h-3 flex items-center">
                <div className="absolute left-[60%] w-1 h-5 bg-white dark:bg-gray-300 rounded-full shadow-sm transform -translate-y-1"></div>
                <div className="absolute right-0 w-1 h-5 bg-white dark:bg-gray-300 rounded-full shadow-sm transform -translate-y-1"></div>
              </div>
            </div>

            {/* Progress steps */}
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span className="font-medium">Details</span>
              <span
                className={`font-medium ${
                  progressPercentage >= 60
                    ? "text-blue-600 dark:text-blue-400"
                    : ""
                }`}
              >
                Payment
              </span>
              <span
                className={`font-medium ${
                  isFormValid ? "text-green-600 dark:text-green-400" : ""
                }`}
              >
                Complete
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced action buttons */}
        <DialogFooter className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="w-full sm:w-auto order-2 sm:order-1 h-12 rounded-2xl hover:bg-white/60 dark:hover:bg-gray-700/60 transition-all duration-300 font-semibold border border-gray-200/50 dark:border-gray-600/50 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-lg backdrop-blur-sm"
          >
            <span>Cancel</span>
          </Button>

          <Button
            onClick={onBook}
            disabled={loading || !isFormValid}
            className={`group relative w-full sm:w-auto order-1 sm:order-2 h-12 font-bold py-3 px-8 rounded-2xl transition-all duration-300 transform overflow-hidden ${
              isReady
                ? "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white shadow-xl hover:shadow-2xl hover:scale-105 focus:scale-105 ring-2 ring-blue-500/20 hover:ring-blue-500/40"
                : "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed shadow-sm"
            }`}
            aria-describedby="payment-info"
            aria-label={serviceAriaLabel}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-6 w-6 border-3 border-white/30 border-t-white mr-3"></div>
                  <div className="absolute inset-0 animate-ping rounded-full h-6 w-6 border border-white/20 mr-3"></div>
                </div>
                <span className="text-base">Processing...</span>
                <span className="sr-only">
                  Please wait while we process your booking
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {!isReady && <Clock className="h-5 w-5 mr-2 opacity-60" />}
                <span className="text-base">
                  {isReady
                    ? `Pay ${finalPrice} & Book Now`
                    : "Complete Form to Continue"}
                </span>
                <ArrowRight
                  className={`h-5 w-5 ml-2 transition-all duration-300 ${
                    isReady
                      ? "group-hover:translate-x-1 group-hover:scale-110"
                      : "opacity-60"
                  }`}
                  aria-hidden="true"
                />
              </div>
            )}

            {/* Enhanced shimmer effect for ready state */}
            {isReady && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1500 ease-out"></div>
            )}

            {/* Subtle glow effect */}
            {isReady && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
          </Button>
        </DialogFooter>

        {/* Enhanced security and trust indicators */}
        <div className="mt-6 space-y-3">
          {/* Primary security row */}
          <div className="flex items-center justify-center">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/50 dark:border-gray-600/50 shadow-lg">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Shield className="h-4 w-4" />
                  <span className="font-semibold">256-bit SSL</span>
                </div>

                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>

                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <CreditCard className="h-4 w-4" />
                  <span className="font-semibold">PCI Compliant</span>
                </div>

                <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>

                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-semibold">Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment provider info */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">
                Powered by{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  {selectedPaymentGateway === "phonepe"
                    ? "PhonePe"
                    : "Razorpay"}
                </span>
              </span>
            </div>

            <p
              id="payment-info"
              className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto"
            >
              Your payment information is encrypted and secure. We never store
              your card details.
            </p>
          </div>
        </div>
      </div>

      {/* Add shimmer keyframes to your global CSS */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}
