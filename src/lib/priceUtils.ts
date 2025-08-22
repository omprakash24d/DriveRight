/**
 * Utility functions for handling course prices consistently across the project
 */

export interface PriceInfo {
  isFree: boolean;
  displayPrice: string;
  numericPrice: number;
  formattedPrice: string;
}

/**
 * Determines if a course price should be considered free
 * Missing, empty, null, undefined, "N/A", or "free" (case-insensitive) are all considered free
 */
export function isCourseFreePredicate(price?: string | number | null): boolean {
  if (!price && price !== 0) return true; // null, undefined, empty string
  
  const priceStr = String(price).trim().toLowerCase();
  
  // Check for explicit free indicators
  if (priceStr === "free" || priceStr === "n/a" || priceStr === "") return true;
  
  // If it doesn't start with a digit, consider it free
  if (!/^\d/.test(priceStr)) return true;
  
  // If numeric value is 0, consider it free
  const numericValue = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
  return numericValue === 0;
}

/**
 * Gets comprehensive price information for a course
 */
export function getPriceInfo(price?: string | number | null): PriceInfo {
  const isFree = isCourseFreePredicate(price);
  
  if (isFree) {
    return {
      isFree: true,
      displayPrice: "Free",
      numericPrice: 0,
      formattedPrice: "Free"
    };
  }
  
  const priceStr = String(price).trim();
  const numericPrice = parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 0;
  
  return {
    isFree: false,
    displayPrice: `₹${numericPrice}`,
    numericPrice,
    formattedPrice: `₹${numericPrice}`
  };
}

/**
 * Normalizes price data to ensure consistency
 * Converts missing/invalid prices to "Free"
 */
export function normalizePrice(price?: string | number | null): string {
  const priceInfo = getPriceInfo(price);
  return priceInfo.isFree ? "Free" : String(priceInfo.numericPrice);
}
