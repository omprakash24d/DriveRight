"use client";

import { useCallback, useMemo, useState } from 'react';
import {
  calculateDiscountSavings,
  createServiceAriaLabel,
  formatPrice,
  getFinalPrice,
  getServiceDescription,
  getServiceDisplayName,
  hasValidDiscount,
} from '../serviceHelpers';
import { getServiceIcon } from '../serviceUtils';

export function useBookingDialog(service: any, isTraining: boolean, bookingForm: any, validationErrors: any) {
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState('phonepe');

  const IconComponent = useMemo(() => getServiceIcon(service, isTraining), [service, isTraining]);

  const discountInfo = useMemo(() => ({
    hasDiscount: hasValidDiscount(service.pricing),
    savings: calculateDiscountSavings(service.pricing),
  }), [service.pricing]);

  const serviceInfo = useMemo(() => ({
    displayName: getServiceDisplayName(service),
    description: getServiceDescription(service),
    ariaLabel: createServiceAriaLabel(service),
  }), [service]);

  const finalPrice = formatPrice(getFinalPrice(service.pricing));
  const basePrice = formatPrice(service.pricing?.basePrice);
  const savingsAmount = formatPrice(discountInfo.savings);
  const finalPriceNumber = getFinalPrice(service.pricing);

  const isFormValid = useMemo(() => {
    // basic validation helper should be provided from helpers
    return true as boolean;
  }, []);

  const handlePaymentGatewayChange = useCallback((gateway: any) => {
    setSelectedPaymentGateway(gateway);
  }, []);

  const handleCancel = useCallback((onOpenChange: any) => {
    onOpenChange(false);
  }, []);

  return {
    selectedPaymentGateway,
    setSelectedPaymentGateway,
    IconComponent,
    discountInfo,
    serviceInfo,
    finalPrice,
    basePrice,
    savingsAmount,
    finalPriceNumber,
    isFormValid,
    handlePaymentGatewayChange,
    handleCancel,
  };
}
