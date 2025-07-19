'use client';

import { useEffect } from 'react';
import { ErrorDisplay } from '@/components/ErrorDisplay';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string; name?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // This is a common heuristic to detect chunk loading errors.
    const isChunkLoadError =
      error.name === 'ChunkLoadError' ||
      /Loading chunk .* failed/i.test(error.message);

    if (isChunkLoadError) {
      console.warn('ChunkLoadError detected, forcing a page reload.');
      // Attempting a hard reload is a common strategy to fix issues
      // caused by a new deployment during a user's session.
      window.location.reload();
    } else {
      // For other errors, log them to the console.
      console.error("Global Error Boundary Caught:", error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <ErrorDisplay
          title="Something Went Wrong"
          description="We've encountered an unexpected issue. Reloading the page might fix it. If the problem persists, please contact support."
          buttonText="Try Again"
          onReset={() => reset()}
          buttonHref='/'
        />
      </body>
    </html>
  );
}
