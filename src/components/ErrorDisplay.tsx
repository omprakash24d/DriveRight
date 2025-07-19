'use client';

import { Button } from '@/components/ui/button';
import { TrafficCone } from 'lucide-react';
import Link from 'next/link';

interface ErrorDisplayProps {
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  onReset?: () => void;
}

export function ErrorDisplay({ title, description, buttonText, buttonHref, onReset }: ErrorDisplayProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-4 bg-background dark:bg-gray-900/50 overflow-hidden">
      <div className="relative mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <TrafficCone className="relative z-10 h-24 w-24 text-primary animate-wobble" />
      </div>
      
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        {title}
      </h1>

      <p className="mt-4 max-w-md text-lg text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
        {description}
      </p>

      <div className="mt-10 flex items-center justify-center gap-x-4 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
        {onReset ? (
          <Button onClick={onReset} size="lg">
            {buttonText}
          </Button>
        ) : (
          <Button asChild size="lg">
            <Link href={buttonHref}>{buttonText}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
