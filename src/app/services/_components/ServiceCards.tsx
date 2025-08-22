"use client";

import {
  ServiceCard,
  ServiceGrid,
  ServiceSection,
} from "@/components/ui/service-card";
import type {
  OnlineService,
  TrainingService,
} from "@/services/quickServicesService";
import {
  BadgeCheck,
  Bike,
  Car,
  Download,
  FileCheck2,
  Printer,
  Truck,
} from "lucide-react";
import type { ElementType } from "react";

interface ServiceCardsProps {
  trainingServices: TrainingService[];
  onlineServices: OnlineService[];
}

const iconMap: { [key: string]: ElementType } = {
  Car,
  Truck,
  Bike,
  FileCheck2,
  Printer,
  Download,
  BadgeCheck,
};

export function ServiceCards({
  trainingServices,
  onlineServices,
}: ServiceCardsProps) {
  const getIcon = (iconName: string): ElementType => {
    return iconMap[iconName] || Car;
  };

  return (
    <>
      {/* Training Services Section */}
      <ServiceSection
        id="training-services"
        title="Our Driving Services"
        description="From novice drivers to seasoned professionals, we have a course tailored for your needs."
      >
        <ServiceGrid columns={3}>
          {trainingServices.map((service) => (
            <ServiceCard
              key={service.id}
              id={service.id}
              title={service.title}
              description={service.description}
              icon={getIcon(service.icon)}
              features={service.services}
              ctaText={service.ctaText}
              ctaHref={service.ctaHref}
              variant="elevated"
            />
          ))}
        </ServiceGrid>
      </ServiceSection>

      {/* Online Tools Section */}
      <ServiceSection
        id="online-tools"
        title="Online Tools & Resources"
        description="Access our digital services for results, downloads, and verification."
        className="bg-secondary/20"
      >
        <ServiceGrid columns={4}>
          {onlineServices.map((service) => (
            <ServiceCard
              key={service.id}
              id={service.id}
              title={service.title}
              description={service.description}
              icon={getIcon(service.icon)}
              ctaText={service.ctaText}
              ctaHref={service.href}
              variant="minimal"
            />
          ))}
        </ServiceGrid>
      </ServiceSection>
    </>
  );
}
