
import { Button } from "@/components/ui/button";
import { SiteSettings } from "@/services/settingsService";
import Image from "next/image";
import Link from "next/link";
import React from "react";

interface HeroSectionProps {
  settings: SiteSettings;
}

const HeroSectionComponent = ({ settings }: HeroSectionProps) => {
  return (
    <section 
      className="relative w-full h-[70vh] flex items-center justify-center text-center text-white"
      role="banner"
      aria-labelledby="hero-title"
    >
      <Image
        src="/images/2.jpeg"
        alt="Professional driving instructor teaching a student in a car, representing comprehensive driving school services"
        fill={true}
        sizes="100vw"
        className="z-0 object-cover"
        data-ai-hint="driving lesson"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20 z-10" />
      <div className="relative z-20 max-w-4xl mx-auto px-4 md:px-6">
        <h1 id="hero-title" className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 drop-shadow-lg">
          {settings.homepageHeroTitle}
        </h1>
        <p className="text-lg md:text-xl text-gray-200 mb-8 drop-shadow-md">
          {settings.homepageHeroSubtitle}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button asChild size="lg" className="min-h-[44px]">
            <Link href="/enroll">Enroll Now</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-transparent backdrop-blur-sm hover:bg-white/10 text-white border-white transition-colors min-h-[44px]">
            <Link href="/courses">View Courses</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export const HeroSection = React.memo(HeroSectionComponent);
