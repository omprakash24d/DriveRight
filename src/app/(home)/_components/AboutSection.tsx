import { SiteSettings } from "@/services/settingsService";
import { Award, TrendingUp, Users } from "lucide-react";
import Image from "next/image";
import type { ElementType } from "react";

interface AboutSectionProps {
  settings: SiteSettings;
}

const iconMap: { [key: string]: ElementType } = {
  TrendingUp,
  Users,
  Award,
};

export function AboutSection({ settings }: AboutSectionProps) {
  const {
    homepageAboutTitle,
    homepageAboutText1,
    homepageAboutText2,
    homepageStats,
  } = settings;

  return (
    <section
      id="about"
      className="w-full py-20 md:py-24 bg-background"
      aria-labelledby="about-title"
    >
      <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <Image
            src="/images/3.jpeg"
            alt={`${settings.schoolName} driving school building exterior`}
            data-ai-hint="school building"
            width={600}
            height={400}
            className="rounded-lg shadow-xl object-cover w-full h-auto"
          />
        </div>
        <div className="order-first md:order-last">
          <h2
            id="about-title"
            className="text-3xl md:text-4xl font-bold tracking-tight mb-4"
          >
            {homepageAboutTitle}
          </h2>
          <div className="space-y-4 text-muted-foreground mb-8">
            <p>{homepageAboutText1}</p>
            <p>{homepageAboutText2}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t">
            {homepageStats.map((stat, index) => {
              const IconComponent = iconMap[stat.icon] || TrendingUp;
              return (
                <div
                  key={index}
                  className="text-center"
                  role="figure"
                  aria-labelledby={`stat-label-${index}`}
                >
                  <div className="flex justify-center mb-2" aria-hidden="true">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-primary">
                    {stat.value}
                  </p>
                  <p
                    id={`stat-label-${index}`}
                    className="text-sm text-muted-foreground"
                  >
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
