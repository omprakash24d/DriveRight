"use client";

import { AnyService } from "../types";

interface ServiceSummaryProps {
  service: AnyService;
  isTraining: boolean;
  serviceInfo: { displayName: string; description: string };
  discountInfo: { hasDiscount: boolean; savings: number };
  finalPrice: string;
  basePrice: string;
  savingsAmount: string;
}

export default function ServiceSummary({
  service,
  isTraining,
  serviceInfo,
  discountInfo,
  finalPrice,
  basePrice,
  savingsAmount,
}: ServiceSummaryProps) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800 dark:to-gray-700/80 border border-gray-200 dark:border-gray-600 rounded-2xl p-5 shadow-sm animate-in slide-in-from-bottom-4 duration-500">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100/30 to-transparent dark:from-blue-900/20 rounded-full transform translate-x-8 -translate-y-8"></div>

      <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h4 className="font-bold text-lg text-gray-900 dark:text-white">
              {serviceInfo.displayName}
            </h4>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-md">
              {isTraining ? "Training" : "Service"}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {serviceInfo.description}
          </p>
        </div>

        <div className="text-center sm:text-right">
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {finalPrice}
            </p>
            {discountInfo.hasDiscount && (
              <div className="space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  {basePrice}
                </p>
                <div className="flex items-center justify-center sm:justify-end gap-1">
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    💰 You save {savingsAmount}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
