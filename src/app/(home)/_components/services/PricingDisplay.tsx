"use client";

import { IndianRupee, Percent } from "lucide-react";

// Local helper functions to avoid module import issues
function formatPrice(amount: number | undefined, currency = "INR"): string {
  if (!amount || amount <= 0) return "Free";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function hasValidDiscount(pricing: any): boolean {
  return pricing?.discount && pricing.discount.amount > 0;
}

function calculateDiscountSavings(pricing: any): number {
  if (!hasValidDiscount(pricing)) return 0;
  return pricing.discount.amount;
}

function getDiscountPercentage(pricing: any): number {
  if (!hasValidDiscount(pricing) || !pricing.basePrice) return 0;
  return Math.round((pricing.discount.amount / pricing.basePrice) * 100);
}

function getFinalPrice(pricing: any): number {
  if (!pricing?.finalPrice && !pricing?.basePrice) return 0;
  return pricing.finalPrice || pricing.basePrice;
}

interface PricingDisplayProps {
  pricing: any; // Enhanced pricing structure support
}

export function PricingDisplay({ pricing }: PricingDisplayProps) {
  const isDiscounted = hasValidDiscount(pricing);
  const finalPrice = getFinalPrice(pricing);
  const discountPercentage = getDiscountPercentage(pricing);
  const savings = calculateDiscountSavings(pricing);

  return (
    <div className="space-y-3">
      {/* Discount Badge */}
      {isDiscounted && discountPercentage > 0 && (
        <div className="flex justify-center">
          <div className="inline-flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm">
            <Percent className="h-3 w-3 mr-1" />
            {discountPercentage}% OFF
          </div>
        </div>
      )}

      {/* Main Price Display */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-center space-x-2">
          <IndianRupee className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {formatPrice(finalPrice).replace("₹", "")}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {pricing?.currency || "INR"}
          </span>
        </div>

        {/* Discount Details */}
        {isDiscounted && (
          <div className="text-center mt-2 space-y-1">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <span className="line-through">
                {formatPrice(pricing?.basePrice)}
              </span>
            </div>
            <div className="text-sm font-medium text-green-600 dark:text-green-400">
              You Save {formatPrice(savings)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
