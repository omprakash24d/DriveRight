
"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { generateAvatarColor } from "@/lib/utils";
import type { Testimonial } from "@/services/testimonialsService";
import { Quote, User } from "lucide-react";

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  if (!testimonials || testimonials.length === 0) {
    return null;
  }
  
  const testimonialCards = useMemo(() => {
    return testimonials.map((testimonial) => (
      <CarouselItem key={testimonial.id} className="basis-full md:basis-1/2 lg:basis-1/3">
        <div className="p-1 h-full">
          <Card className="flex flex-col h-full text-left">
            <CardContent className="flex-grow p-6">
              <Quote className="h-8 w-8 text-primary/50 mb-4" />
              <p className="text-muted-foreground">{testimonial.quote}</p>
            </CardContent>
            <CardFooter className="pt-6 flex items-center gap-4 border-t mt-auto">
                <Avatar>
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint="person portrait" loading="lazy" />
                  <AvatarFallback style={{ backgroundColor: generateAvatarColor(testimonial.name) }}>
                      <User className="h-5 w-5 text-primary" />
                  </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.course}</p>
                </div>
            </CardFooter>
          </Card>
        </div>
      </CarouselItem>
    ));
  }, [testimonials]);
  
  return (
    <section id="testimonials" className="w-full py-20 md:py-24 bg-secondary/50" role="region" aria-labelledby="testimonials-title">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 id="testimonials-title" className="text-3xl md:text-4xl font-bold tracking-tight">
            What Our Students Say
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Hear from those who have successfully navigated the road to their license with us.
          </p>
        </div>
        <Carousel
          opts={{
            align: "start",
            loop: testimonials.length > 2,
          }}
          className="w-full max-w-4xl mx-auto"
        >
          <CarouselContent>
            {testimonialCards}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}
