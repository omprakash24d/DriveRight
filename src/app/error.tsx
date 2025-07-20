
'use client';

import { ErrorDisplay } from '@/components/ErrorDisplay';
import { Footer } from '@/components/Footer';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <>
    <ErrorDisplay
      title="A Pothole on the Road!"
      description="It seems we've hit a small bump. Our team has been notified to smooth things over. Please try refreshing the page, or let's navigate you back home."
      buttonText="Try again"
      buttonHref="/"
      onReset={reset} />
      <Footer />
      </>
  );
}
