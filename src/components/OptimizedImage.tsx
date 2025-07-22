// components/OptimizedImage.tsx - Enhanced image component with SEO and performance optimizations

import { cn } from "@/lib/utils";
import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface OptimizedImageProps extends Omit<ImageProps, "alt"> {
  alt: string; // Make alt required
  fallbackSrc?: string;
  aspectRatio?: "square" | "video" | "portrait" | "landscape";
  loading?: "lazy" | "eager";
  priority?: boolean;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = "/images/placeholder.jpg",
  aspectRatio,
  loading = "lazy",
  priority = false,
  className,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const aspectRatioClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        aspectRatio && aspectRatioClasses[aspectRatio],
        className
      )}
    >
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}

      <Image
        src={hasError ? fallbackSrc : imageSrc}
        alt={alt}
        loading={priority ? "eager" : loading}
        priority={priority}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setImageSrc(fallbackSrc);
          setIsLoading(false);
        }}
        className={cn(
          "object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        quality={85}
        {...props}
      />
    </div>
  );
}

// Specific optimized components for common use cases
export function HeroImage({
  src,
  alt,
  className,
  ...props
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      priority={true}
      sizes="100vw"
      quality={90}
      className={className}
      {...props}
    />
  );
}

export function GalleryImage({
  src,
  alt,
  className,
  ...props
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      aspectRatio="landscape"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className={className}
      {...props}
    />
  );
}

export function AvatarImage({
  src,
  alt,
  size = 64,
  className,
  ...props
}: OptimizedImageProps & { size?: number }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      aspectRatio="square"
      sizes={`${size}px`}
      className={cn("rounded-full", className)}
      {...props}
    />
  );
}
