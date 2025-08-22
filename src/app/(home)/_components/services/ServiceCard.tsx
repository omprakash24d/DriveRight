"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useState } from "react";
import { ServiceCardProps } from "./types";

export const ServiceCard = React.memo(function ServiceCard({
  service,
  type,
  index = 0,
}: ServiceCardProps) {
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  return (
    <Card className="group relative bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700 overflow-hidden max-w-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
              🚗
            </div>

            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {service.title || "Service Title"}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">
                {service.description ||
                  service.shortDescription ||
                  "Service Description"}
              </CardDescription>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-600/50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                ₹
                {(service.pricing as any)?.finalPrice ||
                  (service.pricing as any)?.basePrice ||
                  0}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                INR
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardFooter className="pt-0">
        <Button
          onClick={() => setShowBookingDialog(true)}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-md text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2"
        >
          Book Now →
        </Button>
      </CardFooter>
    </Card>
  );
});
