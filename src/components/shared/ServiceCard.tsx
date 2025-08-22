// Reusable service card component extracted from QuickServices
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  BadgeCheck,
  Clock,
  IndianRupee,
  Percent,
} from "lucide-react";
import type { ElementType } from "react";

// Icon mapping for services
const iconMap: { [key: string]: ElementType } = {
  Car: require("lucide-react").Car,
  Bike: require("lucide-react").Bike,
  Truck: require("lucide-react").Truck,
  FileCheck2: require("lucide-react").FileCheck2,
  Download: require("lucide-react").Download,
  Printer: require("lucide-react").Printer,
  ShoppingCart: require("lucide-react").ShoppingCart,
};

export interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    description: string;
    price?: string;
    icon?: string;
    features?: string[];
    isPopular?: boolean;
    discount?: number;
    originalPrice?: string;
  };
  type: "training" | "online";
  index: number;
  onBookNow?: (serviceId: string) => void;
  onLearnMore?: (serviceId: string) => void;
}

export function ServiceCard({
  service,
  type,
  index,
  onBookNow,
  onLearnMore,
}: ServiceCardProps) {
  // Dynamic icon selection
  const getServiceIcon = (): ElementType => {
    if (service.icon && iconMap[service.icon]) {
      return iconMap[service.icon];
    }

    // Fallback icons based on type
    if (type === "training") {
      return require("lucide-react").Car;
    }
    return require("lucide-react").FileCheck2;
  };

  const IconComponent = getServiceIcon();
  const isTraining = type === "training";
  const hasDiscount = service.discount && service.discount > 0;

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 transform hover:-translate-y-2">
      {/* Popular Badge */}
      {service.isPopular && (
        <div className="absolute top-4 right-4 z-10">
          <Badge
            variant="secondary"
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg animate-pulse"
          >
            <BadgeCheck className="h-3 w-3 mr-1" />
            Popular
          </Badge>
        </div>
      )}

      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute top-4 left-4 z-10">
          <Badge
            variant="destructive"
            className="bg-gradient-to-r from-green-500 to-emerald-600 border-0 shadow-lg"
          >
            <Percent className="h-3 w-3 mr-1" />
            {service.discount}% OFF
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4 relative">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 transform group-hover:scale-110 transition-all duration-500 shadow-lg">
            <IconComponent className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>

          <CardTitle className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {service.title}
          </CardTitle>

          <CardDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            {service.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-4">
        {/* Features List */}
        {service.features && service.features.length > 0 && (
          <div className="mb-4">
            <ul className="space-y-2 text-sm">
              {service.features.slice(0, 3).map((feature, idx) => (
                <li
                  key={idx}
                  className="flex items-center text-gray-600 dark:text-gray-400"
                >
                  <div className="w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mr-3 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pricing Section */}
        {service.price && (
          <div className="flex items-center justify-center mb-4">
            <div className="text-center">
              {hasDiscount && service.originalPrice && (
                <div className="text-sm text-gray-500 line-through mb-1">
                  <IndianRupee className="h-3 w-3 inline mr-1" />
                  {service.originalPrice}
                </div>
              )}
              <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {service.price === "Free" ? (
                  "Free"
                ) : (
                  <>
                    <IndianRupee className="h-5 w-5 inline mr-1" />
                    {service.price}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-6 pt-4 pb-6">
        <div className="w-full space-y-3">
          {/* Primary Action Button */}
          <Button
            onClick={() => onBookNow?.(service.id)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            size="lg"
          >
            {isTraining ? "Enroll Now" : "Get Service"}
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>

          {/* Secondary Action Button */}
          {onLearnMore && (
            <Button
              onClick={() => onLearnMore(service.id)}
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800 transition-all duration-300"
            >
              <Clock className="mr-2 h-4 w-4" />
              Learn More
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default ServiceCard;
