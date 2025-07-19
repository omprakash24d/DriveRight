
import * as z from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const contactFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }).trim(),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }).trim(),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }).max(15000, {
    message: "Message must not be longer than 15000 characters."
  }).trim(),
  attachment: z.any()
    .optional()
    .refine(
      (files) => !files || files.length === 0 || files[0]?.size <= MAX_FILE_SIZE,
      `Max file size is 10MB.`
    ),
  honeypot: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
