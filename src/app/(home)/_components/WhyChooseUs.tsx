
"use client";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiteSettings } from "@/services/settingsService";
import type { WhyChooseUsPoint } from "@/services/settingsService";
import { Award, Car, Clock, UserCheck } from "lucide-react";
import type { ElementType } from "react";

interface WhyChooseUsProps {
  settings: SiteSettings;
  whyChooseUsPoints: WhyChooseUsPoint[];
}

const iconMap: { [key: string]: ElementType } = {
  UserCheck,
  Car,
  Clock,
  Award,
};

export function WhyChooseUs({ settings, whyChooseUsPoints }: WhyChooseUsProps) {
  return (
    <section id="why-us" className="w-full py-20 md:py-24 bg-background" role="region" aria-labelledby="why-us-title">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 id="why-us-title" className="text-3xl md:text-4xl font-bold tracking-tight">
            {settings.whyChooseUsTitle}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            {settings.whyChooseUsSubtitle}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {whyChooseUsPoints.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] || UserCheck;
            return (
              <Card
                key={index}
                className="text-center bg-card hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
              >
                <CardHeader className="items-center">
                  <div className="p-4 bg-primary/10 rounded-full group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="mt-4">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
