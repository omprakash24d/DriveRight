
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleCheck, ArrowRight, Car, Truck, Bike, FileCheck2, Printer, Download, BadgeCheck } from "lucide-react";
import type { ElementType } from "react";
import Link from "next/link";
import { SiteSettings } from "@/services/settingsService";
import type { TrainingService, OnlineService } from "@/services/quickServicesService";

interface QuickServicesProps {
  settings: SiteSettings;
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
  BadgeCheck
};

function ServiceCard({ service, type }: { service: TrainingService | OnlineService, type: 'training' | 'online' }) {
  const IconComponent = iconMap[service.icon] || Car;
  const cardId = `service-title-${service.id}`;
  const isTraining = type === 'training';
  const trainingService = isTraining ? service as TrainingService : null;

  return (
    <li className="h-full">
      <Card className="w-full flex flex-col h-full group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2" aria-labelledby={cardId}>
        <CardHeader className="items-center text-center">
          <div className="p-4 bg-primary/10 rounded-full group-hover:scale-110 transition-transform duration-300">
            <IconComponent className="h-10 w-10 text-primary" />
          </div>
          <CardTitle id={cardId} className="pt-2">{service.title}</CardTitle>
          <CardDescription className="text-base !mt-2 px-4">{service.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          {isTraining && trainingService && (
            <ul className="space-y-3 text-muted-foreground">
              {trainingService.services.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CircleCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full min-h-[44px]">
            <Link href={isTraining ? (service as TrainingService).ctaHref : (service as OnlineService).href}>
              {service.ctaText} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </li>
  );
}


export function QuickServices({ settings, trainingServices, onlineServices }: QuickServicesProps) {
  return (
    <section id="services" className="w-full py-20 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {settings.quickServicesTitle}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            {settings.quickServicesSubtitle}
          </p>
        </div>

        {trainingServices.length > 0 && (
          <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {trainingServices.map((service) => (
              <ServiceCard key={service.id} service={service} type="training" />
            ))}
          </ul>
        )}
        
        {/* Online Services */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
              {settings.onlineToolsTitle}
            </h3>
            <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              {settings.onlineToolsSubtitle}
            </p>
          </div>
          {onlineServices.length > 0 && (
            <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch justify-center">
              {onlineServices.map((service) => (
                 <li key={service.id} className="h-full">
                    <Card className="w-full flex flex-col h-full group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2" aria-labelledby={`online-service-${service.id}`}>
                      <CardHeader className="items-center">
                        <div className="p-4 bg-primary/10 rounded-full group-hover:scale-110 transition-transform duration-300">
                           {React.createElement(iconMap[service.icon] || FileCheck2, { className: "h-8 w-8 text-primary" })}
                        </div>
                        <CardTitle id={`online-service-${service.id}`} className="pt-2">{service.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                        <p className="text-muted-foreground px-4">{service.description}</p>
                      </CardContent>
                      <CardFooter>
                        <Button asChild className="w-full min-h-[44px]">
                          <Link href={service.href}>{service.ctaText} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                      </CardFooter>
                    </Card>
                 </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
