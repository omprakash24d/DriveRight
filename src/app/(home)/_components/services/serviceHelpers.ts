import { EnhancedOnlineService, EnhancedTrainingService } from '@/services/enhancedServicesService';
import { AnyService } from './types';

// Type guards for service types
export function isTrainingService(service: AnyService): service is EnhancedTrainingService {
  return 'instructorRequired' in service && 'duration' in service;
}

export function isOnlineService(service: AnyService): service is EnhancedOnlineService {
  return 'processingTime' in service && 'deliveryMethod' in service;
}

/**
 * Formats price in Indian locale with proper currency symbol
 */
export function formatPrice(amount: number | undefined, currency = 'INR'): string {
  if (!amount || amount <= 0) return 'Free';
  
  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Checks if a service has a valid discount (works with enhanced service pricing)
 */
export function hasValidDiscount(pricing: any): boolean {
  if (!pricing) return false;
  
  // Handle enhanced service pricing structure
  if (pricing.isDiscounted && pricing.discountValidUntil) {
    return new Date(pricing.discountValidUntil) > new Date();
  }
  
  // Handle legacy pricing structure
  return !!(
    pricing?.discountPercentage &&
    pricing?.discountValidUntil &&
    pricing.discountValidUntil > new Date() &&
    pricing.basePrice &&
    pricing.finalPrice &&
    pricing.basePrice > pricing.finalPrice
  );
}

/**
 * Calculates discount savings amount
 */
export function calculateDiscountSavings(pricing: any): number {
  if (!hasValidDiscount(pricing)) return 0;
  
  // Handle enhanced service pricing structure
  if (pricing.isDiscounted && pricing.basePrice && pricing.discountPrice) {
    return pricing.basePrice - pricing.discountPrice;
  }
  
  // Handle legacy pricing structure
  if (pricing.basePrice && pricing.finalPrice) {
    return pricing.basePrice - pricing.finalPrice;
  }
  
  return 0;
}

/**
 * Gets the final price to display
 */
export function getFinalPrice(pricing: any): number {
  if (!pricing) return 0;
  
  // Handle enhanced service pricing structure
  if (pricing.isDiscounted && pricing.discountPrice) {
    return pricing.discountPrice;
  }
  
  // Handle legacy pricing structure
  if (pricing.finalPrice) {
    return pricing.finalPrice;
  }
  
  return pricing.basePrice || 0;
}

/**
 * Gets discount percentage for display
 */
export function getDiscountPercentage(pricing: any): number {
  if (!hasValidDiscount(pricing)) return 0;
  
  return pricing.discountPercentage || 0;
}

/**
 * Validates service pricing structure (enhanced or legacy)
 */
export function isValidServicePricing(pricing: any): boolean {
  if (!pricing) return false;
  
  // Check enhanced pricing structure
  if (pricing.basePrice && typeof pricing.basePrice === 'number') {
    return pricing.basePrice >= 0 && pricing.currency && pricing.currency.length > 0;
  }
  
  return false;
}

/**
 * Gets service display name with proper fallbacks
 */
export function getServiceDisplayName(service: AnyService): string {
  return service.title || service.id || 'Unknown Service';
}

/**
 * Gets service description with proper fallbacks
 */
export function getServiceDescription(service: AnyService): string {
  return service.shortDescription || service.description || 'No description available';
}

/**
 * Validates if service is bookable
 */
export function isServiceBookable(service: AnyService): boolean {
  return !!(
    service &&
    service.isActive &&
    isValidServicePricing(service.pricing) &&
    getFinalPrice(service.pricing) > 0
  );
}

/**
 * Gets formatted duration with proper fallback (handles both service types)
 */
export function getFormattedDuration(service: AnyService): string {
  if (isTrainingService(service) && service.duration) {
    if (typeof service.duration === 'object' && service.duration.value && service.duration.unit) {
      return `${service.duration.value} ${service.duration.unit}`;
    }
    return service.duration.toString();
  }
  
  if (isOnlineService(service) && service.processingTime) {
    return `${service.processingTime.value} ${service.processingTime.unit}`;
  }
  
  return 'Duration not specified';
}

/**
 * Creates accessible ARIA label for service card
 */
export function createServiceAriaLabel(service: AnyService): string {
  const price = formatPrice(getFinalPrice(service.pricing));
  const duration = getFormattedDuration(service);
  
  return `${getServiceDisplayName(service)}, ${price}, ${duration}. Click to book this service.`;
}

/**
 * Validates booking form completeness
 */
export function isBookingFormValid(
  formData: any,
  validationErrors: any,
  isTraining: boolean
): boolean {
  const hasRequiredFields = !!(
    formData.customerName?.trim() &&
    formData.customerEmail?.trim() &&
    formData.customerPhone?.trim()
  );
  
  const hasScheduleForTraining = !isTraining || !!formData.scheduledDate?.trim();
  
  const hasNoErrors = !Object.values(validationErrors).some(error => !!error);
  
  return hasRequiredFields && hasScheduleForTraining && hasNoErrors;
}
