import { BookingFormData, ValidationErrors } from "./types";

// Enhanced form validation with live feedback
export const validateForm = (data: BookingFormData, isTraining: boolean): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate customer name
  if (!data.customerName?.trim()) {
    errors.customerName = "Full name is required";
  } else if (data.customerName.trim().length < 2) {
    errors.customerName = "Name must be at least 2 characters";
  } else if (!/^[a-zA-Z\s]+$/.test(data.customerName)) {
    errors.customerName = "Name can only contain letters and spaces";
  }

  // Validate email
  if (!data.customerEmail?.trim()) {
    errors.customerEmail = "Email address is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail)) {
    errors.customerEmail = "Please enter a valid email address";
  }

  // Validate phone
  if (!data.customerPhone?.trim()) {
    errors.customerPhone = "Phone number is required";
  } else if (!/^(\+91|91)?[6-9]\d{9}$/.test(data.customerPhone.replace(/\s/g, ""))) {
    errors.customerPhone = "Please enter a valid Indian phone number";
  }

  // Validate scheduled date for training services
  if (isTraining && !data.scheduledDate) {
    errors.scheduledDate = "Please select a preferred date";
  }

  // Validate address length
  if (data.customerAddress && data.customerAddress.length > 200) {
    errors.customerAddress = "Address must be less than 200 characters";
  }

  // Validate notes length
  if (data.notes && data.notes.length > 500) {
    errors.notes = "Notes must be less than 500 characters";
  }

  return errors;
};

// Validate individual field
export const validateField = (
  field: keyof BookingFormData,
  value: string,
  isTraining: boolean = false
): string | undefined => {
  const fieldData = { [field]: value } as Partial<BookingFormData>;
  const errors = validateForm({ ...fieldData } as BookingFormData, isTraining);
  return errors[field];
};
