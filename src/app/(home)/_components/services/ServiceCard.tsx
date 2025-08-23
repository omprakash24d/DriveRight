"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentGateway } from "@/types/payment";
import React, { useState } from "react";
import { BookingDialog } from "./BookingDialog";
import { ServiceCardProps } from "./types";
import { useBookingForm } from "./useBookingForm";
import { usePaymentProcessing } from "./usePaymentProcessing";

export const ServiceCard = React.memo(function ServiceCard({
  service,
  type,
}: ServiceCardProps) {
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isTraining = type === "training";

  const {
    bookingForm,
    validationErrors,
    handleInputChange,
    handleFieldValidation,
    resetForm,
  } = useBookingForm({ isTraining });

  const { loading: paymentLoading, processPayment } = usePaymentProcessing({
    service,
    type,
    onSuccess: () => {
      setShowBookingDialog(false);
      resetForm();
    },
    onClose: () => setShowBookingDialog(false),
  });

  const handleBooking = (paymentGateway: PaymentGateway) => {
    processPayment(bookingForm, paymentGateway);
  };

  // Handle service data errors gracefully
  if (!service || !service.title) {
    return (
      <Card className="relative bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm h-full flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-gray-400 dark:text-gray-600 mb-2">⚠️</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Service unavailable
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card
        className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 h-full  focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 flex flex-wrap justify-center"
        role="article"
        aria-labelledby={`service-title-${service.id}`}
        aria-describedby={`service-description-${service.id}`}
      >

        <CardHeader className="relative z-10 text-center pb-4 ">
          
          <CardTitle
            id={`service-title-${service.id}`}
            className="text-xl sm:text-2xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent"
          >
            {service.title || "Service Title"}
          </CardTitle>

          <CardDescription
            id={`service-description-${service.id}`}
            className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3"
          >
            {service.description ||
              service.shortDescription ||
              "Service Description"}
          </CardDescription>

          {/* Enhanced Pricing */}
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600">
            {(() => {
              const pricing = service.pricing as any;
              const basePrice = pricing?.basePrice || 0;
              const finalPrice = pricing?.finalPrice || basePrice;
              const hasDiscount = finalPrice < basePrice;
              const discountPercentage = hasDiscount
                ? Math.round(((basePrice - finalPrice) / basePrice) * 100)
                : 0;

              return (
                <div className="text-center">
                  {hasDiscount && (
                    <div className="mb-2">
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                        🎉 {discountPercentage}% OFF
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3">
                    {hasDiscount && (
                      <span className="text-lg text-gray-400 line-through">
                        ₹{basePrice.toLocaleString()}
                      </span>
                    )}
                    <div className="flex items-center">
                      <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {finalPrice === 0
                          ? "Free"
                          : `₹${finalPrice.toLocaleString()}`}
                      </span>
                      {finalPrice > 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                          INR
                        </span>
                      )}
                    </div>
                  </div>

                  {isTraining && finalPrice > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Per session • Includes certification
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
        </CardHeader>

        {/* Features Section */}
        <div className="px-6 pb-4 flex-1">
          {service.features && service.features.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                ✨ What&apos;s Included:
              </h4>
              <ul className="space-y-2 text-sm">
                {service.features
                  .slice(0, 3)
                  .map((feature: string, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-center text-gray-600 dark:text-gray-400"
                    >
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {/* Enhanced CTA Button */}
        <CardFooter className="px-6 pt-4 pb-6 mt-auto">
          <div className="w-full space-y-3">
            <Button
              onClick={() => setShowBookingDialog(true)}
              disabled={paymentLoading}
              className="group w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] focus:scale-[1.02] text-base font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              size="lg"
              aria-describedby={`service-title-${service.id}`}
            >
              {paymentLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processing...
                </div>
              ) : (
                <>
                  {(() => {
                    const pricing = service.pricing as any;
                    const finalPrice =
                      pricing?.finalPrice || pricing?.basePrice || 0;
                    const hasDiscount =
                      (pricing?.finalPrice || 0) < (pricing?.basePrice || 0);

                    if (finalPrice === 0) {
                      return (
                        <>
                          <span>Get Free Access</span>
                          <div className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300">
                            →
                          </div>
                        </>
                      );
                    }

                    return (
                      <>
                        <span>
                          {hasDiscount
                            ? `Book Now - ₹${finalPrice.toLocaleString()}`
                            : `₹${finalPrice.toLocaleString()} - Book Now`}
                        </span>
                        <div className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300">
                          →
                        </div>
                      </>
                    );
                  })()}
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <BookingDialog
        isOpen={showBookingDialog}
        onOpenChange={setShowBookingDialog}
        service={service}
        isTraining={isTraining}
        bookingForm={bookingForm}
        validationErrors={validationErrors}
        loading={paymentLoading}
        onInputChange={handleInputChange}
        onFieldValidation={handleFieldValidation}
        onBooking={handleBooking}
      />
    </>
  );
});
