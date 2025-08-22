// Refactored QuickServices component using modular architecture
"use client";

import { BookingDialog } from "@/components/forms/BookingDialog";
import {
  PaymentErrorBoundary,
  usePaymentErrorHandler,
} from "@/components/PaymentErrorBoundary";
import { ServiceSection } from "@/components/shared/ServiceSection";
import { useServiceInteraction } from "@/hooks/useServiceInteraction";
import {
  EnhancedOnlineService,
  EnhancedTrainingService,
} from "@/services/enhancedServicesService";
import { SiteSettings } from "@/services/settingsService";
import { Car, FileCheck2 } from "lucide-react";

export interface QuickServicesProps {
  settings: SiteSettings;
  trainingServices: EnhancedTrainingService[];
  onlineServices: EnhancedOnlineService[];
}

export function QuickServices({
  settings,
  trainingServices,
  onlineServices,
}: QuickServicesProps) {
  const {
    selectedService,
    showBookingDialog,
    bookingType,
    loading,
    handleServiceBook,
    handleServiceLearnMore,
    closeBookingDialog,
    submitBooking,
  } = useServiceInteraction();

  const { handlePaymentError } = usePaymentErrorHandler();

  // Handle service booking
  const onTrainingServiceBook = (serviceId: string) => {
    handleServiceBook(serviceId, trainingServices, "training");
  };

  const onOnlineServiceBook = (serviceId: string) => {
    handleServiceBook(serviceId, onlineServices, "online");
  };

  // Handle learn more actions
  const onTrainingServiceLearnMore = (serviceId: string) => {
    handleServiceLearnMore(serviceId);
  };

  const onOnlineServiceLearnMore = (serviceId: string) => {
    handleServiceLearnMore(serviceId);
  };

  return (
    <PaymentErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <section className="relative py-16 sm:py-20 lg:py-24 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-emerald-600/5" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.1),transparent_50%)]" />

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6 leading-tight">
                Our Quick Services
              </h1>

              <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Professional driving training and convenient online services at{" "}
                {settings?.schoolName || "DriveRight Driving School"}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {trainingServices?.length || 0}+
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Training Programs
                  </div>
                </div>

                <div className="hidden sm:block w-px h-12 bg-gray-300 dark:bg-gray-600" />

                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {onlineServices?.length || 0}+
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Online Services
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Content */}
        <section className="relative py-16 sm:py-20 lg:py-24">
          <div className="container mx-auto px-4 md:px-6">
            {/* Driving Services Section */}
            <ServiceSection
              title="Our Driving Services"
              subtitle="Professional Training Programs"
              description="From novice drivers to seasoned professionals, we have a course tailored for your needs. Get trained by certified instructors with our comprehensive MCWG, LMV, and HMV programs."
              icon={Car}
              iconGradient="bg-gradient-to-br from-blue-500 to-purple-600"
              services={trainingServices || []}
              type="training"
              onServiceBook={onTrainingServiceBook}
              onServiceLearnMore={onTrainingServiceLearnMore}
              loading={!trainingServices}
            />

            {/* Online Tools Section */}
            <ServiceSection
              title="Online Tools & Services"
              subtitle="Convenient Digital Solutions"
              description="Access our comprehensive online services for license verification, document downloads, and more. Get what you need from the comfort of your home."
              icon={FileCheck2}
              iconGradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              services={onlineServices || []}
              type="online"
              onServiceBook={onOnlineServiceBook}
              onServiceLearnMore={onOnlineServiceLearnMore}
              loading={!onlineServices}
            />
          </div>
        </section>

        {/* Booking Dialog */}
        {selectedService && (
          <BookingDialog
            isOpen={showBookingDialog}
            onClose={closeBookingDialog}
            service={selectedService}
            type={bookingType}
            onSubmit={submitBooking}
          />
        )}
      </div>
    </PaymentErrorBoundary>
  );
}

export default QuickServices;
