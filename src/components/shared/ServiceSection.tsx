// Reusable service section component
"use client";

import { ServiceCard } from "@/components/shared/ServiceCard";
import type { ElementType } from "react";

export interface ServiceSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon: ElementType;
  iconGradient: string;
  services: Array<{
    id: string;
    title: string;
    description: string;
    price?: string;
    icon?: string;
    features?: string[];
    isPopular?: boolean;
    discount?: number;
    originalPrice?: string;
  }>;
  type: "training" | "online";
  onServiceBook?: (serviceId: string) => void;
  onServiceLearnMore?: (serviceId: string) => void;
  loading?: boolean;
}

export function ServiceSection({
  title,
  subtitle,
  description,
  icon: IconComponent,
  iconGradient,
  services,
  type,
  onServiceBook,
  onServiceLearnMore,
  loading = false,
}: ServiceSectionProps) {
  if (loading) {
    return (
      <div className="mb-16 sm:mb-20 lg:mb-24">
        <div className="text-center mb-12 sm:mb-16">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 ${iconGradient} rounded-2xl mb-6 animate-pulse`}
          />
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse mb-4" />
          {subtitle && (
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
          )}
          {description && (
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!services || services.length === 0) {
    return (
      <div className="mb-16 sm:mb-20 lg:mb-24">
        <div className="text-center mb-12 sm:mb-16">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 ${iconGradient} rounded-2xl mb-6 transform hover:scale-110 transition-all duration-300 shadow-lg`}
          >
            <IconComponent className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
            {title}
          </h2>
          {subtitle && (
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
              {subtitle}
            </h3>
          )}
          {description && (
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No {type === "training" ? "training services" : "online services"}{" "}
            available at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-16 sm:mb-20 lg:mb-24">
      {/* Section Header */}
      <div className="text-center mb-12 sm:mb-16">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 ${iconGradient} rounded-2xl mb-6 transform hover:scale-110 transition-all duration-300 shadow-lg`}
        >
          <IconComponent className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-4">
          {title}
        </h2>

        {subtitle && (
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            {subtitle}
          </h3>
        )}

        {description && (
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {services.map((service, index) => (
          <div
            key={service.id}
            className="group relative"
            style={{
              animationDelay: `${index * 150}ms`,
            }}
          >
            <ServiceCard
              service={service}
              type={type}
              index={index}
              onBookNow={onServiceBook}
              onLearnMore={onServiceLearnMore}
            />
          </div>
        ))}
      </div>

      {/* Call to Action */}
      {services.length > 0 && (
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Can&apos;t find what you&apos;re looking for?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-200"
          >
            Contact us for custom requirements
            <svg
              className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}

export default ServiceSection;
