"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";
import { useCallback, useMemo } from "react";
import { BookingForm } from "./BookingForm";
import {
  calculateDiscountSavings,
  createServiceAriaLabel,
  formatPrice,
  getFinalPrice,
  getServiceDescription,
  getServiceDisplayName,
  hasValidDiscount,
  isBookingFormValid,
} from "./serviceHelpers";
import { getServiceIcon } from "./serviceUtils";
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
  onBooking: () => void;
  gradientColors: string;
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
  gradientColors,
}: BookingDialogProps) {
  // Memoized computations for performance
  const IconComponent = useMemo(
    () => getServiceIcon(service, isTraining),
    [service, isTraining]
  );

  const discountInfo = useMemo(
    () => ({
      hasDiscount: hasValidDiscount(service.pricing),
      savings: calculateDiscountSavings(service.pricing),
    }),
    [service.pricing]
  );

  const serviceInfo = useMemo(
    () => ({
      displayName: getServiceDisplayName(service),
      description: getServiceDescription(service),
      ariaLabel: createServiceAriaLabel(service),
    }),
    [service]
  );

  const finalPrice = formatPrice(getFinalPrice(service.pricing));
  const basePrice = formatPrice(service.pricing?.basePrice);
  const savingsAmount = formatPrice(discountInfo.savings);

  const isFormValid = useMemo(
    () => isBookingFormValid(bookingForm, validationErrors, isTraining),
    [bookingForm, validationErrors, isTraining]
  );

  // Memoized callbacks to prevent unnecessary re-renders
  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleBooking = useCallback(() => {
    if (isFormValid && !loading) {
      onBooking();
    }
  }, [isFormValid, loading, onBooking]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-xl border shadow-xl bg-white dark:bg-gray-800 dark:border-gray-700"
        aria-describedby="booking-dialog-description"
      >
        <DialogHeader className="text-center pb-4">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4">
            {IconComponent ? (
              <IconComponent
                className="h-6 w-6 text-gray-700 dark:text-gray-300"
                aria-hidden="true"
              />
            ) : (
              <div
                className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded"
                aria-hidden="true"
              />
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Book {serviceInfo.displayName}
          </DialogTitle>
          <DialogDescription
            id="booking-dialog-description"
            className="text-gray-600 dark:text-gray-300 text-base"
          >
            Complete your booking for {serviceInfo.displayName}
          </DialogDescription>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-center gap-1">
            <span aria-hidden="true">🔒</span>
            <span>Secure payment powered by Razorpay</span>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Service Summary */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                  {serviceInfo.displayName}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {serviceInfo.description}
                </p>
              </div>
              <div className="text-center sm:text-right">
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {finalPrice}
                </p>
                {discountInfo.hasDiscount && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="line-through">{basePrice}</span>
                    <span className="text-green-600 dark:text-green-400 ml-1 font-medium">
                      Save {savingsAmount}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <BookingForm
            bookingForm={bookingForm}
            validationErrors={validationErrors}
            isTraining={isTraining}
            onInputChange={onInputChange}
            onFieldValidation={onFieldValidation}
          />
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto order-2 sm:order-1 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleBooking}
            disabled={loading || !isFormValid}
            className={`w-full sm:w-auto order-1 sm:order-2 min-h-[44px] bg-gradient-to-r ${gradientColors} hover:shadow-lg text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-describedby="payment-info"
            aria-label={serviceInfo.ariaLabel}
          >
            {loading ? (
              <>
                <div
                  className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"
                  aria-hidden="true"
                ></div>
                <span>Processing...</span>
                <span className="sr-only">
                  Please wait while we process your booking
                </span>
              </>
            ) : (
              <>
                <span>Pay {finalPrice} & Book Now</span>
                <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </>
            )}
          </Button>
        </DialogFooter>
        <p
          id="payment-info"
          className="text-xs text-gray-500 dark:text-gray-400 text-center -mt-2"
        >
          Secure payment powered by Razorpay
        </p>
      </DialogContent>
    </Dialog>
  );
}
