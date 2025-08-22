// Reusable booking dialog component
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  bookingFormSchema,
  formatValidationErrors,
  sanitizeFormData,
  type ValidationErrors,
} from "@/lib/validators/common";
import {
  CalendarDays,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  User,
} from "lucide-react";
import { useState } from "react";

export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  serviceId: string;
  serviceTitle: string;
  preferredDate: string;
}

export interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    title: string;
    description: string;
    price?: string;
  };
  type: "training" | "online";
  onSubmit?: (data: BookingFormData) => Promise<void>;
}

export function BookingDialog({
  isOpen,
  onClose,
  service,
  type,
  onSubmit,
}: BookingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
    serviceId: service.id,
    serviceTitle: service.title,
    preferredDate: "",
  });

  const handleInputChange = (field: keyof BookingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setValidationErrors({});

    try {
      // Sanitize form data
      const sanitizedData = sanitizeFormData(formData);

      // Validate form data
      const validationData = {
        name: sanitizedData.name,
        email: sanitizedData.email,
        phone: sanitizedData.phone,
        message: sanitizedData.message,
        serviceType: type,
      };

      bookingFormSchema.parse(validationData);

      // Submit form
      if (onSubmit) {
        await onSubmit(sanitizedData);
        toast({
          title: "Booking Request Submitted!",
          description: "We'll contact you soon to confirm your booking.",
        });
        onClose();
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
          serviceId: service.id,
          serviceTitle: service.title,
          preferredDate: "",
        });
      }
    } catch (error: any) {
      console.error("Booking submission error:", error);

      if (error.errors) {
        // Zod validation errors
        setValidationErrors(formatValidationErrors(error));
      } else {
        toast({
          title: "Booking Failed",
          description: error.message || "Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const isTraining = type === "training";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isTraining ? "Enroll in Course" : "Request Service"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Book your <strong>{service.title}</strong> and we&apos;ll get back
            to you within 24 hours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label
              htmlFor="name"
              className="flex items-center text-sm font-medium"
            >
              <User className="h-4 w-4 mr-2 text-blue-500" />
              Full Name *
            </Label>
            <Input
              id="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={validationErrors.name ? "border-red-500" : ""}
            />
            {validationErrors.name && (
              <p className="text-sm text-red-500">{validationErrors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="flex items-center text-sm font-medium"
            >
              <Mail className="h-4 w-4 mr-2 text-blue-500" />
              Email Address *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={validationErrors.email ? "border-red-500" : ""}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-500">{validationErrors.email}</p>
            )}
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <Label
              htmlFor="phone"
              className="flex items-center text-sm font-medium"
            >
              <Phone className="h-4 w-4 mr-2 text-blue-500" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              placeholder="Enter 10-digit phone number"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className={validationErrors.phone ? "border-red-500" : ""}
            />
            {validationErrors.phone && (
              <p className="text-sm text-red-500">{validationErrors.phone}</p>
            )}
          </div>

          {/* Preferred Date (for training services) */}
          {isTraining && (
            <div className="space-y-2">
              <Label
                htmlFor="preferredDate"
                className="flex items-center text-sm font-medium"
              >
                <CalendarDays className="h-4 w-4 mr-2 text-blue-500" />
                Preferred Start Date
              </Label>
              <Input
                id="preferredDate"
                type="date"
                value={formData.preferredDate}
                onChange={(e) =>
                  handleInputChange("preferredDate", e.target.value)
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          )}

          {/* Message Field */}
          <div className="space-y-2">
            <Label
              htmlFor="message"
              className="flex items-center text-sm font-medium"
            >
              <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
              Additional Message
            </Label>
            <Textarea
              id="message"
              placeholder={`Tell us more about your ${
                isTraining ? "training" : "service"
              } requirements...`}
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              rows={3}
              className={validationErrors.message ? "border-red-500" : ""}
            />
            {validationErrors.message && (
              <p className="text-sm text-red-500">{validationErrors.message}</p>
            )}
          </div>

          {/* Service Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              {service.title}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
              {service.description}
            </p>
            {service.price && (
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                Price: {service.price}
              </p>
            )}
          </div>
        </form>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              `Submit ${isTraining ? "Enrollment" : "Request"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BookingDialog;
