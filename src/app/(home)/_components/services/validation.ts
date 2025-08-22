import { z } from "zod";

// Enhanced form validation schema
export const bookingFormSchema = z.object({
  customerName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  customerEmail: z
    .string()
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters"),
  customerPhone: z
    .string()
    .regex(/^(\+91|91)?[6-9]\d{9}$/, "Please enter a valid Indian phone number")
    .transform((phone) => phone.replace(/^(\+91|91)/, "")), // Normalize phone number
  customerAddress: z
    .string()
    .max(200, "Address must be less than 200 characters")
    .optional(),
  scheduledDate: z.string().optional(),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

export type BookingFormType = z.infer<typeof bookingFormSchema>;
