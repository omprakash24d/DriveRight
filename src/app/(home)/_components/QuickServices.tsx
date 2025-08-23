"use client";

import {
  EnhancedOnlineService,
  EnhancedTrainingService,
} from "@/services/enhancedServicesService";
import { SiteSettings } from "@/services/settingsService";
import { SectionHeader } from "./services/SectionHeader";
import { ServiceCard } from "./services/ServiceCard";

interface QuickServicesProps {
  settings: SiteSettings;
  trainingServices: EnhancedTrainingService[];
  onlineServices: EnhancedOnlineService[];
}

export function QuickServices({
  settings,
  trainingServices,
  onlineServices,
}: QuickServicesProps) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100/30 to-purple-100/20 dark:from-blue-900/20 dark:to-purple-900/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-100/30 to-blue-100/20 dark:from-green-900/20 dark:to-blue-900/10 rounded-full blur-3xl"></div>
      </div>

      <section
        id="services"
        className="relative w-full py-12 sm:py-16 md:py-20 lg:py-24"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Driving Services Section */}
          {trainingServices && trainingServices.length > 0 ? (
            <div className="mb-16 sm:mb-20 lg:mb-24">
              <SectionHeader
                title="Our Driving Services"
                subtitle={
                  settings.quickServicesSubtitle ||
                  "Master the art of driving with our professional training programs designed for every skill level"
                }
                iconType="training"
              />

              {/* Service Cards Grid */}
              <div className="flex flex-wrap justify-center sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 ">
                {trainingServices.map((service, index) => (
                  <div
                    key={service.id}
                    className="opacity-100 transform transition-all duration-500 "
                    style={{
                      animationDelay: `${index * 150}ms`,
                    }}
                  >
                    <ServiceCard
                      service={service}
                      type="training"
                      index={index}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-16 sm:mb-20 lg:mb-24">
              <SectionHeader
                title="Our Driving Services"
                subtitle="Loading services..."
                iconType="training"
              />
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300">
                  No training services available at the moment.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Data: {JSON.stringify(trainingServices)}
                </p>
              </div>
            </div>
          )}

          {/* Online Tools Section */}
          {onlineServices && onlineServices.length > 0 ? (
            <div>
              <SectionHeader
                title="Online Tools & Resources"
                subtitle={
                  settings.onlineToolsSubtitle ||
                  "Access our digital services and manage your driving journey with ease"
                }
                iconType="online"
              />

              {/* Online Service Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">

                {onlineServices.map((service, index) => (
                  <div
                    key={service.id}
                    className="opacity-100 transform transition-all duration-500 group"
                    style={{
                      animationDelay: `${index * 150}ms`,
                    }}
                  >
                    <ServiceCard
                      service={service}
                      type="online"
                      index={index}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <SectionHeader
                title="Online Tools & Resources"
                subtitle="Loading services..."
                iconType="online"
              />
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300">
                  No online services available at the moment.
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Data: {JSON.stringify(onlineServices)}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
