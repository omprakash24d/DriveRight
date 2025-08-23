"use client";

import PaymentGatewaySelection from "@/components/PaymentGatewaySelection";
import { PaymentGateway } from "@/types/payment";
import { X } from "lucide-react";
import React from "react";
import ReactDOM from "react-dom";
import { BookingForm } from "./BookingForm";
import BookingFooter from "./booking/BookingFooter";
import BookingHeader from "./booking/BookingHeader";
import { useBookingDialog } from "./booking/useBookingDialog";
import { AnyService, BookingFormData, ValidationErrors } from "./types";

interface BookingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  service: AnyService;
  isTraining: boolean;
  bookingForm: BookingFormData;
  validationErrors: ValidationErrors;
  loading: boolean;
  onInputChange: (field: keyof BookingFormData, value: string) => void;
  onFieldValidation: (field: keyof BookingFormData, value: string) => void;
  onBooking: (paymentGateway: PaymentGateway) => void;
}

export function BookingDialog({
  isOpen,
  onOpenChange,
  service,
  isTraining,
  bookingForm,
  validationErrors,
  loading,
  onInputChange,
  onFieldValidation,
  onBooking,
}: BookingDialogProps) {
  const {
    selectedPaymentGateway,
    IconComponent,
    discountInfo,
    serviceInfo,
    finalPrice,
    basePrice,
    savingsAmount,
    isFormValid,
    handlePaymentGatewayChange,
    handleCancel,
  } = useBookingDialog(
    service,
    isTraining,
    bookingForm,
    validationErrors as any
  );

  const handleBooking = () => {
    if (isFormValid && !loading) {
      onBooking(selectedPaymentGateway as PaymentGateway);
    }
  };

  // Prevent background scrolling and interaction when dialog is open.
  // Also add ESC handler and simple focus trap. Dynamically load inert polyfill if needed.
  React.useEffect(() => {
    const root = document.getElementById("__next") || document.body;
    let previousOverflow = document.body.style.overflow;
    let prevActive: Element | null = null;
    let cleanupKeydown: (() => void) | undefined;

    async function enableDialogAccessibility() {
      // Lock scroll
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      // Ensure inert support (polyfill if missing)
      const supportsInert = "inert" in HTMLElement.prototype;
      if (!supportsInert) {
        try {
          // dynamic import so polyfill is only loaded when needed
          // @ts-ignore - module has no types but is safe to load at runtime
          await import("wicg-inert");
        } catch (err) {
          // ignore - accessibility will still attempt aria-hidden
          console.warn("Failed to load inert polyfill:", err);
        }
      }

      const modalEl = document.getElementById("booking-dialog-root");

      // Mark background children inert/aria-hidden (except the modal)
      Array.from(root.children).forEach((child) => {
        if (child instanceof HTMLElement) {
          if (!modalEl || !child.contains(modalEl)) {
            child.setAttribute("aria-hidden", "true");
            // @ts-ignore - inert may not exist in TS DOM lib
            try {
              child.inert = true;
            } catch (e) {
              /* ignore */
            }
          }
        }
      });

      // Save previously focused element and move focus into the modal
      prevActive = document.activeElement as Element | null;
      if (modalEl instanceof HTMLElement) {
        const focusableSelectors = [
          "a[href]",
          "area[href]",
          "input:not([disabled])",
          "select:not([disabled])",
          "textarea:not([disabled])",
          "button:not([disabled])",
          '[tabindex]:not([tabindex="-1"])',
        ].join(",");

        const focusable = Array.from(
          modalEl.querySelectorAll<HTMLElement>(focusableSelectors)
        ).filter(
          (el) =>
            el.offsetParent !== null || el.getAttribute("tabindex") === "0"
        );

        if (focusable.length) {
          focusable[0].focus();
        } else {
          // fallback to modal container
          modalEl.tabIndex = -1;
          modalEl.focus();
        }

        // Keydown handler for ESC and Tab trapping
        const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onOpenChange(false);
            return;
          }

          if (e.key === "Tab") {
            const focusableNow = Array.from(
              modalEl.querySelectorAll<HTMLElement>(focusableSelectors)
            ).filter(
              (el) =>
                !(el as HTMLElement).hasAttribute("disabled") &&
                (el.offsetParent !== null ||
                  el.getAttribute("tabindex") === "0")
            );
            if (focusableNow.length === 0) {
              e.preventDefault();
              return;
            }

            const currentIndex = focusableNow.indexOf(
              document.activeElement as HTMLElement
            );
            if (e.shiftKey) {
              if (currentIndex <= 0) {
                focusableNow[focusableNow.length - 1].focus();
                e.preventDefault();
              }
            } else {
              if (currentIndex === focusableNow.length - 1) {
                focusableNow[0].focus();
                e.preventDefault();
              }
            }
          }
        };

        document.addEventListener("keydown", onKeyDown);
        cleanupKeydown = () =>
          document.removeEventListener("keydown", onKeyDown);
      }
    }

    if (isOpen) {
      enableDialogAccessibility();
    }

    return () => {
      // Restore scroll
      document.body.style.overflow = previousOverflow;

      // Restore background children
      Array.from(root.children).forEach((child) => {
        if (child instanceof HTMLElement) {
          child.removeAttribute("aria-hidden");
          // @ts-ignore
          try {
            child.inert = false;
          } catch (e) {
            /* ignore */
          }
        }
      });

      // Restore focus
      if (prevActive instanceof HTMLElement) {
        try {
          (prevActive as HTMLElement).focus({ preventScroll: true });
        } catch (e) {
          (prevActive as HTMLElement).focus();
        }
      }

      if (cleanupKeydown) cleanupKeydown();
    };
  }, [isOpen, onOpenChange]);

  if (!isOpen) return null;

  const modal = (
    <div
      id="booking-dialog-root"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 pointer-events-auto"
      data-testid="booking-dialog-root"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-all duration-300 pointer-events-auto"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Dialog Content */}
      <div className="relative z-[100000] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl h-[90vh] sm:h-[85vh] flex flex-col transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
        {/* Fixed Header - Sticky */}
        <div className="flex-shrink-0 relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 sticky top-0 z-10 rounded-t-xl">
          {BookingHeader ? (
            <BookingHeader
              IconComponent={IconComponent}
              service={service}
              isTraining={isTraining}
              serviceInfo={serviceInfo}
              discountInfo={discountInfo}
              savingsAmount={savingsAmount}
              finalPrice={finalPrice}
            />
          ) : (
            <div className="p-4 text-sm text-red-600">
              BookingHeader not available
            </div>
          )}

          {/* Close Button */}
          {!loading && (
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-600 shadow-lg hover:shadow-xl hover:bg-white dark:hover:bg-gray-700 flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 z-20 group"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-200 transition-colors" />
            </button>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
          <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
            {/* Service summary moved into footer for a more minimal layout */}

            {/* Booking Form */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </span>
                  Your Details
                </h3>
                {isFormValid && (
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full border border-green-200 dark:border-green-800 font-medium">
                    ✓ Complete
                  </span>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-sm">
                {typeof BookingForm !== "undefined" ? (
                  <BookingForm
                    bookingForm={bookingForm}
                    validationErrors={validationErrors}
                    isTraining={isTraining}
                    onInputChange={onInputChange}
                    onFieldValidation={onFieldValidation}
                  />
                ) : (
                  <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    BookingForm not available
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3 pb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </span>
                Payment Method
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-sm">
                {PaymentGatewaySelection ? (
                  <PaymentGatewaySelection
                    selectedGateway={selectedPaymentGateway as PaymentGateway}
                    onGatewayChange={handlePaymentGatewayChange}
                  />
                ) : (
                  <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    PaymentGatewaySelection not available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer - Sticky */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 sm:p-4 md:p-6 sticky bottom-0 rounded-b-xl">
          {BookingFooter ? (
            <BookingFooter
              isFormValid={isFormValid}
              loading={loading}
              finalPrice={finalPrice}
              onCancel={() => handleCancel(onOpenChange)}
              onBook={handleBooking}
              serviceAriaLabel={serviceInfo.ariaLabel}
              selectedPaymentGateway={selectedPaymentGateway}
              service={service}
              isTraining={isTraining}
              serviceInfo={serviceInfo}
              discountInfo={discountInfo}
              basePrice={basePrice}
              savingsAmount={savingsAmount}
            />
          ) : (
            <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              BookingFooter not available
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}
