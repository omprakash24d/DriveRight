"use client";

import { AnyService } from "../types";

interface BookingHeaderProps {
  IconComponent?: any;
  service: AnyService;
  isTraining: boolean;
  serviceInfo: { displayName: string; description: string; ariaLabel: string };
  discountInfo: { hasDiscount: boolean; savings: number };
  savingsAmount: string;
  finalPrice: string;
}

export default function BookingHeader({
  IconComponent,
  serviceInfo,
}: BookingHeaderProps) {
  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="px-2 py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/90 dark:bg-gray-800 rounded-md flex items-center justify-center border border-gray-100 dark:border-gray-600">
            {IconComponent ? (
              <IconComponent
                className="h-5 w-5 text-blue-600 dark:text-blue-400"
                aria-hidden="true"
              />
            ) : (
              <div
                className="h-5 w-5 bg-gradient-to-br from-blue-400 to-blue-600 rounded"
                aria-hidden="true"
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2
              className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white "
              aria-label={`Book ${serviceInfo.displayName}`}
            >
              Book {serviceInfo.displayName}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate hidden sm:block">
              Fill details below
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
