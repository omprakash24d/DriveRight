import { toast } from '@/hooks/use-toast';
import { useCallback, useState } from 'react';
import { validateForm } from './formValidation';
import { BookingFormData, ValidationErrors } from './types';

interface UseBookingFormOptions {
  isTraining: boolean;
  onSuccess?: () => void;
}

export function useBookingForm({ isTraining, onSuccess }: UseBookingFormOptions) {
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    scheduledDate: "",
    notes: "",
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setBookingForm({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      scheduledDate: "",
      notes: "",
    });
    setValidationErrors({});
  }, []);

  // Handle input changes with error clearing
  const handleInputChange = useCallback((field: keyof BookingFormData, value: string) => {
    setBookingForm((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }, [validationErrors]);

  // Handle field validation on blur
  const handleFieldValidation = useCallback((
    field: keyof BookingFormData,
    value: string
  ) => {
    const fieldData = { ...bookingForm, [field]: value };
    const errors = validateForm(fieldData, isTraining);

    setValidationErrors((prev) => ({
      ...prev,
      [field]: errors[field],
    }));
  }, [bookingForm, isTraining]);

  // Validate entire form
  const validateBookingForm = useCallback(() => {
    const errors = validateForm(bookingForm, isTraining);
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before proceeding.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  }, [bookingForm, isTraining]);

  return {
    bookingForm,
    validationErrors,
    handleInputChange,
    handleFieldValidation,
    validateBookingForm,
    resetForm,
  };
}
