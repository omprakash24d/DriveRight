"use client";

import React, { useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Image from "next/image";
import { SiteSettings } from "@/services/settingsService";

interface GalleryImage {
  src: string;
  alt: string;
  hint: string;
}

const galleryImages: GalleryImage[] = [
  { src: "/images/1.jpeg", alt: "Student practicing in a car", hint: "driving practice" },
  { src: "/images/2.jpeg", alt: "Instructor teaching a student", hint: "driving instructor" },
  { src: "/images/3.jpeg", alt: "Modern classroom for theory lessons", hint: "driving classroom" },
  { src: "/images/4.jpeg", alt: "A student receiving their license", hint: "driving license" },
  { src: "/images/5.jpeg", alt: "Our fleet of modern training cars", hint: "training car" },
  { src: "/images/6.jpeg", alt: "Close-up of a steering wheel during a driving lesson", hint: "steering wheel" },
  { src: "/images/7.jpeg", alt: "Student confidently parallel parking a training car", hint: "parallel parking" },
  { src: "/images/8.jpeg", alt: "View of the road from inside a training vehicle", hint: "road view" },
  { src: "/images/9.jpeg", alt: "Instructor providing feedback to a student driver", hint: "driving feedback" },
];

interface GallerySectionProps {
  settings: SiteSettings;
}

export function GallerySection({ settings }: GallerySectionProps) {
  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  return (
    <section id="gallery" className="w-full py-20 md:py-24 bg-secondary/50" role="region" aria-labelledby="gallery-title">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 id="gallery-title" className="text-3xl md:text-4xl font-bold tracking-tight">
            {settings.galleryTitle}
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            {settings.gallerySubtitle}
          </p>
        </div>
        <Carousel
          plugins={[plugin.current]}
          opts={{
            align: "start",
            loop: true,
          }}
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {galleryImages.map((image, index) => (
              <CarouselItem key={index} className="basis-full sm:basis-1/2 lg:basis-1/3">
                <div className="p-1">
                  <Card className="overflow-hidden">
                    <CardContent className="p-0 flex items-center justify-center aspect-video relative">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform hover:scale-105"
                        data-ai-hint={image.hint}
                        loading="lazy"
                      />
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious aria-label="Previous image" />
          <CarouselNext aria-label="Next image" />
        </Carousel>
      </div>
    </section>
  );
}
