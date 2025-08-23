"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import React, { useEffect, useRef, useState } from "react";
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
  // local state for phone input to avoid odd double-key behaviour
  const [localPhone, setLocalPhone] = useState<string>(() => {
    const v = bookingForm.customerPhone || "";
    const digits = v.replace(/\D/g, "").slice(-10);
    return digits ? digits.replace(/(\d{5})(\d{0,5})/, "$1 $2").trim() : "";
  });
  const composingRef = useRef(false);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  // sync when outer bookingForm changes (but avoid stomping while user composes)
  useEffect(() => {
    const v = bookingForm.customerPhone || "";
    const digits = v.replace(/\D/g, "").slice(-10);
    const formatted = digits ? formatGrouped(digits) : "";

    // don't stomp user input while they're actively focused in the phone field
    const isFocused = phoneInputRef.current === document.activeElement;
    if (!composingRef.current && !isFocused && formatted !== localPhone) {
      setLocalPhone(formatted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingForm.customerPhone]);

  const digitsFrom = (s: string) => (s || "").replace(/\D/g, "");

  const formatGrouped = (digits: string) =>
    digits ? digits.replace(/(\d{5})(\d{0,5})/, "$1 $2").trim() : "";

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (composingRef.current) return;
    const raw = e.target.value || "";
    const digits = digitsFrom(raw).slice(0, 10);

    const grouped = formatGrouped(digits);
    setLocalPhone(grouped);
    // avoid echo from parent while user types: only notify parent when we have a full 10-digit number
    if (digits.length === 10) {
      const formattedForParent = `+91 ${digits}`;
      onInputChange("customerPhone", formattedForParent);
    }
  };

  const handleCompositionStart = () => {
    composingRef.current = true;
  };
  const handleCompositionEnd = (
    e: React.CompositionEvent<HTMLInputElement>
  ) => {
    composingRef.current = false;
    // force applying composed value
    const target = e.target as HTMLInputElement;
    const ev = { target } as React.ChangeEvent<HTMLInputElement>;
    handlePhoneChange(ev);
  };

  const handleBeforeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const ie = e.nativeEvent as InputEvent;
    const data = (ie && (ie as any).data) || null;

    // allow deletions / non-insert inputTypes
    if (!data) return;
    // deny non-digit input
    if (!/^[0-9]+$/.test(data)) {
      e.preventDefault();
      return;
    }
    // prevent adding more than 10 digits
    const digits = digitsFrom(localPhone);
    if (digits.length >= 10) {
      e.preventDefault();
    }
  };

  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const digits = digitsFrom(localPhone).slice(0, 10);
    const formattedForParent = digits ? `+91 ${digits}` : "";

    onFieldValidation("customerPhone", formattedForParent);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const raw = e.clipboardData.getData("text");
    const pasted = raw.replace(/\D/g, "").slice(0, 10);
    const grouped = formatGrouped(pasted);
    setLocalPhone(grouped);
    const formattedForParent = pasted ? `+91 ${pasted}` : "";
    onInputChange("customerPhone", formattedForParent);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
      "Tab",
    ];
    if (allowedKeys.includes(e.key)) return;
    // allow shortcuts like ctrl/cmd+c/v
    if (e.ctrlKey || e.metaKey) return;
    // allow only digits
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    } else {
      // if already 10 digits, prevent adding more
      const digits = digitsFrom(localPhone);

      if (digits.length >= 10) {
        e.preventDefault();
      }
    }
  };

  return (
    <div className="space-y-4 ">
      {/* Personal Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="md:col-span-2">
          <Label htmlFor="customerName" className="text-sm font-medium">
            Full Name *
          </Label>
          <Input
            id="customerName"
            value={bookingForm.customerName}
            onChange={(e) => onInputChange("customerName", e.target.value)}
            onBlur={(e) => onFieldValidation("customerName", e.target.value)}
            placeholder="Enter your full name"
            className={
              (validationErrors.customerName ? "border-red-500" : "") +
              " dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            }
          />
          {validationErrors.customerName && (
            <p className="text-red-500 text-xs mt-1">
              {validationErrors.customerName}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="customerEmail" className="text-sm font-medium">
            Email *
          </Label>
          <Input
            id="customerEmail"
            type="email"
            value={bookingForm.customerEmail}
            onChange={(e) => onInputChange("customerEmail", e.target.value)}
            onBlur={(e) => onFieldValidation("customerEmail", e.target.value)}
            placeholder="your@email.com"
            className={
              (validationErrors.customerEmail ? "border-red-500" : "") +
              " dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            }
          />
          {validationErrors.customerEmail && (
            <p className="text-red-500 text-xs mt-1">
              {validationErrors.customerEmail}
            </p>
          )}
        </div>

        {/* Phone (fixed +91 prefix, 10 digit) */}
        <div>
          <Label htmlFor="customerPhone" className="text-sm font-medium">
            Phone *
          </Label>

          {/* input group with static prefix */}
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
              +91
            </span>
            <input
              id="customerPhone"
              ref={phoneInputRef}
              inputMode="numeric"
              pattern="[0-9]*"
              value={localPhone}
              onChange={handlePhoneChange}
              onBlur={(e) => {
                handlePhoneBlur(e);
              }}
              onBeforeInput={handleBeforeInput}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              placeholder="98765 43210"
              aria-invalid={
                !!validationErrors.customerPhone ||
                (digitsFrom(localPhone).length > 0 &&
                  digitsFrom(localPhone).length !== 10)
              }
              className={`block w-full min-w-0 rounded-r-md border px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 dark:bg-gray-800 dark:text-gray-200 ${
                validationErrors.customerPhone
                  ? "border-red-500 dark:border-red-600"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />
          </div>

          {/* live validation message (shows while typing) or server-side validation if present */}
          {validationErrors.customerPhone ? (
            <p className="text-red-500 text-xs mt-1">
              {validationErrors.customerPhone}
            </p>
          ) : digitsFrom(localPhone).length > 0 &&
            digitsFrom(localPhone).length !== 10 ? (
            <p className="text-yellow-500 text-xs mt-1">
              Enter a 10 digit mobile number ({digitsFrom(localPhone).length}
              /10)
            </p>
          ) : null}
        </div>

        {/* Training Date */}
        {isTraining && (
          <div className="md:col-span-2">
            <Label htmlFor="scheduledDate" className="text-sm font-medium">
              Preferred Date *
            </Label>
            <Input
              id="scheduledDate"
              type="date"
              value={bookingForm.scheduledDate}
              onChange={(e) => onInputChange("scheduledDate", e.target.value)}
              onBlur={(e) => onFieldValidation("scheduledDate", e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className={
                (validationErrors.scheduledDate ? "border-red-500" : "") +
                " dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              }
            />
            {validationErrors.scheduledDate && (
              <p className="text-red-500 text-xs mt-1">
                {validationErrors.scheduledDate}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Optional Information */}
      <div className="space-y-4 pt-2">
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Additional Information{" "}
            <span className="text-gray-400">(Optional)</span>
          </h4>

          {/* Address */}
          <div className="mb-4">
            <Label htmlFor="customerAddress" className="text-sm font-medium">
              Address
            </Label>
            <Textarea
              id="customerAddress"
              value={bookingForm.customerAddress}
              onChange={(e) => onInputChange("customerAddress", e.target.value)}
              onBlur={(e) =>
                onFieldValidation("customerAddress", e.target.value)
              }
              placeholder="Enter your address"
              rows={2}
              className={
                (validationErrors.customerAddress ? "border-red-500" : "") +
                " dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              }
            />
            {validationErrors.customerAddress && (
              <p className="text-red-500 text-xs mt-1">
                {validationErrors.customerAddress}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              value={bookingForm.notes}
              onChange={(e) => onInputChange("notes", e.target.value)}
              onBlur={(e) => onFieldValidation("notes", e.target.value)}
              placeholder="Any special requirements or notes..."
              rows={2}
              className={
                (validationErrors.notes ? "border-red-500" : "") +
                " dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              }
            />
            {validationErrors.notes && (
              <p className="text-red-500 text-xs mt-1">
                {validationErrors.notes}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
