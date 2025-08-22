"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookingFormData, ValidationErrors } from "./types";

interface BookingFormProps {
  bookingForm: BookingFormData;
  validationErrors: ValidationErrors;
  isTraining: boolean;
  onInputChange: (field: keyof BookingFormData, value: string) => void;
  onFieldValidation: (field: keyof BookingFormData, value: string) => void;
}

export function BookingForm({
  bookingForm,
  validationErrors,
  isTraining,
  onInputChange,
  onFieldValidation,
}: BookingFormProps) {
  const inputClassName = (field: keyof ValidationErrors) =>
    `mt-1 px-4 py-2.5 rounded-lg border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
      validationErrors[field]
        ? "border-red-300 bg-red-50/50"
        : "border-gray-200 hover:border-gray-300"
    }`;

  return (
    <div className="space-y-4">
      {/* Full Name */}
      <div>
        <Label
          htmlFor="customerName"
          className="text-sm font-medium text-gray-700 mb-1.5 block"
        >
          Full Name *
        </Label>
        <Input
          id="customerName"
          value={bookingForm.customerName}
          onChange={(e) => onInputChange("customerName", e.target.value)}
          onBlur={(e) => onFieldValidation("customerName", e.target.value)}
          placeholder="Enter your full name"
          className={inputClassName("customerName")}
          aria-describedby={
            validationErrors.customerName ? "customerName-error" : undefined
          }
          aria-invalid={!!validationErrors.customerName}
          required
        />
        {validationErrors.customerName && (
          <p
            id="customerName-error"
            className="text-red-600 text-sm mt-1"
            role="alert"
          >
            {validationErrors.customerName}
          </p>
        )}
      </div>

      {/* Email and Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label
            htmlFor="customerEmail"
            className="text-sm font-medium text-gray-700 mb-1.5 block"
          >
            Email Address *
          </Label>
          <Input
            id="customerEmail"
            type="email"
            value={bookingForm.customerEmail}
            onChange={(e) => onInputChange("customerEmail", e.target.value)}
            onBlur={(e) => onFieldValidation("customerEmail", e.target.value)}
            placeholder="your@email.com"
            className={inputClassName("customerEmail")}
            aria-describedby={
              validationErrors.customerEmail ? "customerEmail-error" : undefined
            }
            aria-invalid={!!validationErrors.customerEmail}
            required
          />
          {validationErrors.customerEmail && (
            <p
              id="customerEmail-error"
              className="text-red-600 text-sm mt-1"
              role="alert"
            >
              {validationErrors.customerEmail}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="customerPhone"
            className="text-sm font-medium text-gray-700 mb-1.5 block"
          >
            Phone Number *
          </Label>
          <Input
            id="customerPhone"
            type="tel"
            value={bookingForm.customerPhone}
            onChange={(e) => onInputChange("customerPhone", e.target.value)}
            onBlur={(e) => onFieldValidation("customerPhone", e.target.value)}
            placeholder="+91 9876543210"
            className={inputClassName("customerPhone")}
            aria-describedby={
              validationErrors.customerPhone ? "customerPhone-error" : undefined
            }
            aria-invalid={!!validationErrors.customerPhone}
            required
          />
          {validationErrors.customerPhone && (
            <p
              id="customerPhone-error"
              className="text-red-600 text-sm mt-1"
              role="alert"
            >
              {validationErrors.customerPhone}
            </p>
          )}
        </div>
      </div>

      {/* Scheduled Date for Training Services */}
      {isTraining && (
        <div>
          <Label
            htmlFor="scheduledDate"
            className="text-sm font-medium text-gray-700 mb-1.5 block"
          >
            Preferred Date *
          </Label>
          <Input
            id="scheduledDate"
            type="date"
            value={bookingForm.scheduledDate}
            onChange={(e) => onInputChange("scheduledDate", e.target.value)}
            onBlur={(e) => onFieldValidation("scheduledDate", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className={inputClassName("scheduledDate")}
            aria-describedby={
              validationErrors.scheduledDate ? "scheduledDate-error" : undefined
            }
            aria-invalid={!!validationErrors.scheduledDate}
            required
          />
          {validationErrors.scheduledDate && (
            <p
              id="scheduledDate-error"
              className="text-red-600 text-sm mt-1"
              role="alert"
            >
              {validationErrors.scheduledDate}
            </p>
          )}
        </div>
      )}

      {/* Address */}
      <div>
        <Label
          htmlFor="customerAddress"
          className="text-sm font-medium text-gray-700 mb-1.5 block"
        >
          Address (Optional)
        </Label>
        <Textarea
          id="customerAddress"
          value={bookingForm.customerAddress}
          onChange={(e) => onInputChange("customerAddress", e.target.value)}
          onBlur={(e) => onFieldValidation("customerAddress", e.target.value)}
          placeholder="Enter your full address"
          rows={3}
          className={`${inputClassName("customerAddress")} resize-none`}
          aria-describedby={
            validationErrors.customerAddress
              ? "customerAddress-error"
              : undefined
          }
          aria-invalid={!!validationErrors.customerAddress}
        />
        {validationErrors.customerAddress && (
          <p
            id="customerAddress-error"
            className="text-red-600 text-sm mt-1"
            role="alert"
          >
            {validationErrors.customerAddress}
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <Label
          htmlFor="notes"
          className="text-sm font-medium text-gray-700 mb-1.5 block"
        >
          Additional Notes (Optional)
        </Label>
        <Textarea
          id="notes"
          value={bookingForm.notes}
          onChange={(e) => onInputChange("notes", e.target.value)}
          onBlur={(e) => onFieldValidation("notes", e.target.value)}
          placeholder="Any special requirements or notes"
          rows={3}
          className={`${inputClassName("notes")} resize-none`}
          aria-describedby={validationErrors.notes ? "notes-error" : undefined}
          aria-invalid={!!validationErrors.notes}
        />
        {validationErrors.notes && (
          <p
            id="notes-error"
            className="text-red-600 text-sm mt-1"
            role="alert"
          >
            {validationErrors.notes}
          </p>
        )}
      </div>
    </div>
  );
}
