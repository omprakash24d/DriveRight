"use client";
import { Button } from "@/components/ui/button";
import { SiteSettings } from "@/services/settingsService";
import { Book, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

interface HeroSectionProps {
  settings: SiteSettings;
}

const HeroSectionComponent = ({ settings }: HeroSectionProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="relative w-full h-[40svh] min-h-[500px] max-h-[800px] flex items-center justify-center overflow-hidden"
      role="banner"
      aria-labelledby="hero-title"
    >
      {/* Background Image */}
      <Image
        src="/images/2.jpeg"
        alt="Professional driving instructor teaching a student in a car"
        fill={true}
        sizes="100vw"
        className="object-cover object-center"
        priority
        onLoad={() => setIsLoaded(true)}
      />

      {/* Simple Gradient Overlay */}
      <div className="absolute inset-0 bg-black/50 z-10" />

      {/* Main Content */}
      <div className="relative z-20 w-full max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-6 sm:space-y-8">
          {/* Main Heading */}
          <h1
            id="hero-title"
            className={`text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1] transition-all duration-700 ease-out ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}
          >
            {settings.homepageHeroTitle}
          </h1>

          {/* Subtitle */}
          <p
            className={`text-sm xs:text-base sm:text-lg md:text-xl text-gray-100 max-w-2xl mx-auto leading-relaxed transition-all duration-700 ease-out ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{
              textShadow: "0 1px 10px rgba(0,0,0,0.8)",
              transitionDelay: "200ms",
            }}
          >
            {settings.homepageHeroSubtitle}
          </p>

          {/* CTA Buttons - Stacked Vertically */}
          <div
            className={`flex  gap-3 sm:gap-4 justify-center items-center max-w-xs mx-auto transition-all duration-700 ease-out ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "400ms" }}
          >
            <Button
              asChild
              size="lg"
              className="group bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold w-full"
            >
              <Link
                href="/enroll"
                className="flex items-center justify-center gap-2"
              >
                <Book className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                <span>Enroll Now</span>
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/40 hover:border-white/60 transition-all duration-300 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold w-full"
            >
              <Link
                href="/courses"
                className="flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                <span>View Courses</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom fade for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 bg-gradient-to-t from-background to-transparent z-15" />
    </section>
  );
};

export const HeroSection = React.memo(HeroSectionComponent);
