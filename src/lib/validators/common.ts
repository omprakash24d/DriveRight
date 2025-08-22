// Common validation schemas and utilities
import { z } from 'zod';

// Phone number validation for Indian numbers
export const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(10, "Phone number must be exactly 10 digits")
  .regex(/^[6-9]\d{9}$/, "Please enter a valid Indian phone number");

// Email validation
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

// Name validation
export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters")
  .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces");

// Amount validation
export const amountSchema = z
  .number()
  .min(0, "Amount must be positive")
  .max(999999, "Amount too large");

// License number validation
export const licenseNumberSchema = z
  .string()
  .min(10, "License number must be at least 10 characters")
  .max(20, "License number must be less than 20 characters")
  .regex(/^[A-Z0-9]+$/, "License number can only contain uppercase letters and numbers");

// Common booking form schema
export const bookingFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  message: z.string().max(500, "Message must be less than 500 characters").optional(),
  serviceType: z.string().min(1, "Service type is required"),
  preferredDate: z.string().optional(),
  amount: amountSchema.optional(),
});

// License inquiry schema
export const licenseInquirySchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  licenseNumber: licenseNumberSchema,
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  message: z.string().max(500, "Message must be less than 500 characters").optional(),
});

// Common validation error types
export interface ValidationErrors {
  [key: string]: string | undefined;
}

// Validation error formatter
export function formatValidationErrors(error: z.ZodError): ValidationErrors {
  const errors: ValidationErrors = {};
  error.errors.forEach((err) => {
    if (err.path.length > 0) {
      errors[err.path[0]] = err.message;
    }
  });
  return errors;
}

// Form data sanitizer
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
  const sanitized = { ...data } as Record<string, any>;
  
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];
    if (typeof value === 'string') {
      // Trim whitespace and normalize
      sanitized[key] = value.trim();
    }
  });
  
  return sanitized as T;
}

// Common form field validation
export function validateField(value: string, schema: z.ZodString): string | null {
  try {
    schema.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || "Invalid value";
    }
    return "Validation error";
  }
}
