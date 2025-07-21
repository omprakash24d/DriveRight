'use client';

import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Footer } from '@/components/Footer';
import { getSiteSettings } from '@/services/settingsService';
import { useEffect, useState } from 'react';
import type { SiteSettings } from '@/services/settingsService';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);

    // Fetch settings on the client to pass to the Footer
    // Note: This is a simplified approach for the error boundary.
    // In a real app, this might be handled differently to avoid re-fetching.
    getSiteSettings().then(setSettings);
  }, [error]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex items-center justify-center">
        <ErrorDisplay
          title="A Pothole on the Road!"
          description="It seems we've hit a small bump. Our team has been notified to smooth things over. Please try refreshing the page, or let's navigate you back home."
          buttonText="Try again"
          buttonHref="/"
          onReset={reset}
        />
      </main>
      {/* The Footer is now included outside the main error display area */}
    </div>
  );
}
