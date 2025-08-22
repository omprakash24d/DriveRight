"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import type { ElementType, ReactNode } from "react";

interface ServiceCardProps {
  id: string;
  title: string;
  description: string;
  icon?: ElementType;
  features?: string[];
  price?: string;
  ctaText: string;
  ctaHref: string;
  variant?: "default" | "elevated" | "minimal";
  className?: string;
  badges?: string[];
  children?: ReactNode;
  hideDefaultCta?: boolean;
}

export function ServiceCard({
  id,
  title,
  description,
  icon: Icon,
  features = [],
  price,
  ctaText,
  ctaHref,
  variant = "default",
  className,
  badges = [],
  children,
  hideDefaultCta = false,
}: ServiceCardProps) {
  const cardClasses = {
    default: "card-minimal",
    elevated: "card-elevated",
    minimal: "border-0 shadow-none bg-transparent",
  };

  return (
    <Card
      className={cn(
        cardClasses[variant],
        "hover:scale-105 transition-all duration-300 group",
        className
      )}
      aria-labelledby={`service-title-${id}`}
    >
      <CardContent className="p-5 lg:p-6 text-center h-full flex flex-col">
        {/* Icon */}
        {Icon && (
          <div className="w-12 h-12 lg:w-14 lg:h-14 mx-auto mb-4 lg:mb-5 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Icon className="h-6 w-6 lg:h-7 lg:w-7 text-primary" />
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {badges.map((badge, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3
          id={`service-title-${id}`}
          className="text-lg lg:text-xl font-semibold text-foreground mb-3 lg:mb-3"
        >
          {title}
        </h3>

        {/* Price */}
        {price && (
          <div className="mb-3">
            <span className="text-xl lg:text-2xl font-bold text-primary">
              {price}
            </span>
          </div>
        )}

        {/* Description */}
        <p className="text-muted-foreground text-sm lg:text-base mb-4 leading-relaxed flex-grow">
          {description}
        </p>

        {/* Features */}
        {features.length > 0 && (
          <div className="mb-4 lg:mb-5 space-y-2">
            {features.slice(0, 4).map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center text-sm text-muted-foreground text-left"
              >
                <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}

        {/* Custom Children */}
        {children}

        {/* CTA Button */}
        {!hideDefaultCta && (
          <Button
            asChild
            className="w-full mt-auto"
            variant={variant === "elevated" ? "default" : "secondary"}
          >
            <Link href={ctaHref} className="flex items-center justify-center">
              {ctaText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface ServiceGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function ServiceGrid({
  children,
  columns = 3,
  className,
}: ServiceGridProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div
      className={cn(
        "grid gap-6 lg:gap-8 items-stretch",
        gridClasses[columns],
        className
      )}
    >
      {children}
    </div>
  );
}

interface ServiceSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function ServiceSection({
  title,
  description,
  children,
  className,
  id,
}: ServiceSectionProps) {
  return (
    <section
      id={id}
      className={cn("section-padding bg-background", className)}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className="container mx-auto container-padding">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2
            id={id ? `${id}-title` : undefined}
            className="heading-xl mb-6 text-foreground"
          >
            {title}
          </h2>
          {description && (
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {description}
            </p>
          )}
        </div>

        {/* Section Content */}
        {children}
      </div>
    </section>
  );
}
