// src/components/form/ConsentCheckbox.tsx - GDPR compliant consent component
"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { compliance } from "@/lib/compliance";
import { useState } from "react";

interface ConsentCheckboxProps {
  consentType:
    | "data_processing"
    | "marketing"
    | "cookies"
    | "third_party_sharing";
  userId?: string;
  required?: boolean;
  label: string;
  description: string;
  privacyPolicyUrl?: string;
  onChange: (granted: boolean) => void;
  value?: boolean;
}

export function ConsentCheckbox({
  consentType,
  userId,
  required = false,
  label,
  description,
  privacyPolicyUrl = "/privacy-policy",
  onChange,
  value = false,
}: ConsentCheckboxProps) {
  const [isChecked, setIsChecked] = useState(value);
  const [showDetails, setShowDetails] = useState(false);

  const handleChange = async (checked: boolean) => {
    setIsChecked(checked);
    onChange(checked);

    // Record consent if user ID is available
    if (userId) {
      try {
        await compliance.recordConsent({
          userId,
          consentType,
          granted: checked,
          ipAddress: undefined, // Would be filled server-side
          userAgent: navigator.userAgent,
        });
      } catch (error) {
        console.error("Failed to record consent:", error);
      }
    }
  };

  const getConsentDetails = () => {
    switch (consentType) {
      case "data_processing":
        return {
          title: "Data Processing Consent",
          details: `
            We process your personal data to:
            • Provide driving education services
            • Manage your enrollment and certificates
            • Communicate about your courses
            • Ensure regulatory compliance
            
            Legal basis: Contract performance and legitimate interests
            Retention period: 7 years (as required by law)
            
            You have the right to:
            • Access your data
            • Correct inaccurate data
            • Delete your data (where legally permitted)
            • Port your data to another service
          `,
          withdrawal:
            "You can withdraw consent at any time, but this may affect our ability to provide services.",
        };

      case "marketing":
        return {
          title: "Marketing Communications",
          details: `
            We would like to send you:
            • Course updates and new offerings
            • Driving safety tips and news
            • Special promotions and discounts
            
            Legal basis: Consent
            You will only receive marketing if you opt-in
          `,
          withdrawal:
            "You can unsubscribe at any time using the link in our emails.",
        };

      case "third_party_sharing":
        return {
          title: "Third Party Data Sharing",
          details: `
            We may share limited data with:
            • Department of Motor Vehicles (for licensing)
            • Insurance providers (if requested)
            • Payment processors (for transactions)
            
            We never sell your personal data.
          `,
          withdrawal:
            "Some sharing is required by law and cannot be opted out of.",
        };

      default:
        return {
          title: "Data Consent",
          details: "Standard data processing consent",
          withdrawal: "You can manage your consent preferences at any time.",
        };
    }
  };

  const consentDetails = getConsentDetails();

  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-2">
        <Checkbox
          id={`consent-${consentType}`}
          checked={isChecked}
          onCheckedChange={handleChange}
          required={required}
          className="mt-1"
        />
        <div className="flex-1 space-y-1">
          <Label
            htmlFor={`consent-${consentType}`}
            className="text-sm leading-tight cursor-pointer"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="ml-6 space-x-2">
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogTrigger asChild>
            <Button variant="link" size="sm" className="p-0 h-auto text-xs">
              View details
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{consentDetails.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm">
                <pre className="whitespace-pre-wrap font-sans">
                  {consentDetails.details}
                </pre>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-2">
                  Withdrawal of Consent
                </h4>
                <p className="text-xs text-muted-foreground">
                  {consentDetails.withdrawal}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="link" size="sm" className="p-0 h-auto text-xs" asChild>
          <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>
        </Button>
      </div>
    </div>
  );
}
