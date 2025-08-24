"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WhyChooseUsPoint } from "@/services/settingsService";
import { SiteSettings } from "@/services/settingsService";
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
    <section
      id="why-us"
      className="w-full py-16 md:py-24 bg-gradient-to-b from-background to-muted/20"
      role="region"
      aria-labelledby="why-us-title"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <h2
            id="why-us-title"
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
          >
            {settings.whyChooseUsTitle}
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-primary/50 mx-auto mt-4 mb-4 rounded-full" />
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
            {settings.whyChooseUsSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {whyChooseUsPoints.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] || UserCheck;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-2"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "fadeInUp 0.6s ease-out both",
                }}
              >
                {/* Subtle background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Animated border */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg"
                  style={{ padding: "1px" }}
                >
                  <div className="w-full h-full bg-card rounded-lg" />
                </div>

                <CardHeader className="relative text-center pb-4">
                  <div className="relative mx-auto w-fit">
                    {/* Animated background circle */}
                    <div className="absolute inset-0 bg-primary/10 rounded-full scale-100 group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-primary/5 rounded-full scale-100 group-hover:scale-125 transition-transform duration-500" />

                    {/* Icon container */}
                    <div className="relative p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full group-hover:from-primary/15 group-hover:to-primary/10 transition-colors duration-300">
                      <IconComponent
                        className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <CardTitle className="mt-6 text-xl font-semibold group-hover:text-primary transition-colors duration-300 leading-tight">
                    {feature.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="relative pt-0 pb-6">
                  <p className="text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
