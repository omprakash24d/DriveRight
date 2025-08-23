"use client";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PAYMENT_GATEWAYS, PaymentGateway } from "@/types/payment";
import { CreditCard, Smartphone } from "lucide-react";
import { useEffect } from "react";

interface PaymentGatewaySelectionProps {
  selectedGateway: PaymentGateway;
  onGatewayChange: (gateway: PaymentGateway) => void;
  className?: string;
}

export default function PaymentGatewaySelection({
  selectedGateway,
  onGatewayChange,
  className = "",
}: PaymentGatewaySelectionProps) {
  const enabledGateways = PAYMENT_GATEWAYS.filter(
    (gateway) => gateway.enabled
  ).sort((a, b) =>
    a.gateway === "phonepe"
      ? -1
      : b.gateway === "phonepe"
      ? 1
      : a.priority - b.priority
  );

  // Ensure PhonePe is selected by default when no valid selection provided
  useEffect(() => {
    const hasSelected = enabledGateways.some(
      (g) => g.gateway === selectedGateway
    );

    const phonepeAvailable = enabledGateways.some(
      (g) => g.gateway === "phonepe"
    );

    if (!hasSelected && phonepeAvailable) {
      // Try to respect stored user preference first
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("dr:paymentGateway")
          : null;
      if (stored && enabledGateways.some((g) => g.gateway === stored)) {
        onGatewayChange(stored as PaymentGateway);
      } else {
        onGatewayChange("phonepe" as PaymentGateway);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledGateways]);

  // Persist selection to localStorage when it changes
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && selectedGateway) {
        localStorage.setItem("dr:paymentGateway", selectedGateway);
      }
    } catch (e) {
      /* ignore storage errors */
    }
  }, [selectedGateway]);

  return (
    <div className={className}>
      <Select
        value={selectedGateway}
        onValueChange={(val) => onGatewayChange(val as PaymentGateway)}
      >
        <SelectTrigger className="h-11 px-3 ">
          <SelectValue placeholder="Select payment" />
          {/* Tooltip explaining recommendation */}
          {selectedGateway === "phonepe" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-2 inline-flex items-center">
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    PhonePe usually offers instant, secure payments —
                    recommended for faster checkout.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </SelectTrigger>

        <SelectContent>
          {enabledGateways.map((gateway) => {
            const isPhonePe = gateway.gateway === "phonepe";
            return (
              <SelectItem key={gateway.gateway} value={gateway.gateway}>
                <div className="dark:border-gray-600, dark:bg-gray-800, dark:text-gray-200 flex items-center gap-2 w-full">
                  {isPhonePe ? (
                    <Smartphone className="h-4 w-4 text-purple-600" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="flex-1">{gateway.name}</span>
                  {/* recommended badge is shown in the trigger with tooltip; omit here to avoid duplication */}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
