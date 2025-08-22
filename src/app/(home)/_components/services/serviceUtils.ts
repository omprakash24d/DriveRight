import { BadgeCheck, Bike, Car, Download, FileCheck2, HelpCircle, Printer, Truck } from "lucide-react";
import type { ElementType } from "react";
import { AnyService } from "./types";

// Local type guard to avoid module import issues
function isTrainingService(service: AnyService): boolean {
  return 'instructorRequired' in service && 'duration' in service;
}

export const iconMap: { [key: string]: ElementType } = {
  Car,
  Truck,
  Bike,
  FileCheck2,
  Printer,
  Download,
  BadgeCheck,
  HelpCircle, // Fallback icon
};

// Dynamic icon selection with improved error handling and type safety
export const getServiceIcon = (service: AnyService, isTraining: boolean): ElementType => {
  try {
    if (!service || !service.title) {
      return HelpCircle;
    }

    const title = service.title.toLowerCase();
    const icon = service.icon?.toLowerCase() || '';

    // First try to match by explicit icon field
    if (icon) {
      if (icon.includes('car')) return Car;
      if (icon.includes('bike') || icon.includes('motorcycle')) return Bike;
      if (icon.includes('truck')) return Truck;
      if (icon.includes('download')) return Download;
      if (icon.includes('print')) return Printer;
      if (icon.includes('badge') || icon.includes('check')) return BadgeCheck;
    }

    // Fallback to title-based matching
    if (isTraining || isTrainingService(service)) {
      if (title.includes("bike") || title.includes("motorcycle") || title.includes("mcwg")) {
        return Bike;
      }
      if (title.includes("truck") || title.includes("heavy") || title.includes("hmv")) {
        return Truck;
      }
      return Car; // Default for training services
    } else {
      if (title.includes("print") || title.includes("certificate")) {
        return Printer;
      }
      if (title.includes("download")) {
        return Download;
      }
      if (title.includes("verify") || title.includes("validation")) {
        return BadgeCheck;
      }
      return FileCheck2; // Default for online services
    }
  } catch (error) {
    return HelpCircle;
  }
};

// Enhanced gradient colors with service type awareness
export const getGradientColors = (isTraining: boolean, index: number = 0, service?: AnyService) => {
  try {
    // Use service category if available for more accurate colors
    if (service?.category) {
      const category = service.category.toLowerCase();
      const categoryGradients: { [key: string]: string } = {
        lmv: "from-blue-500 to-blue-600",
        mcwg: "from-orange-500 to-red-600", 
        hmv: "from-emerald-500 to-teal-600",
        download: "from-cyan-500 to-blue-600",
        verification: "from-violet-500 to-purple-600",
        document: "from-amber-500 to-orange-600",
      };
      
      if (categoryGradients[category]) {
        return categoryGradients[category];
      }
    }

    // Fallback to index-based gradients
    if (isTraining) {
      const gradients = [
        "from-blue-500 to-blue-600", // LMV
        "from-orange-500 to-red-600", // HMV
        "from-emerald-500 to-teal-600", // MCWG
        "from-indigo-500 to-purple-600", // Refresher
        "from-green-500 to-emerald-600",
      ];
      return gradients[index % gradients.length];
    } else {
      const gradients = [
        "from-cyan-500 to-blue-600", // DL Printout
        "from-emerald-500 to-green-600", // License Download (Free)
        "from-violet-500 to-purple-600", // Certificate Verification
        "from-amber-500 to-orange-600",
        "from-rose-500 to-pink-600",
      ];
      return gradients[index % gradients.length];
    }
  } catch (error) {
    return "from-gray-500 to-gray-600"; // Safe fallback
  }
};
