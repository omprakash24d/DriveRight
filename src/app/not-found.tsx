
import { ErrorDisplay } from '@/components/ErrorDisplay';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 - Page Not Found',
};

export default function NotFound() {
  return (
    <ErrorDisplay
      title="404 - A Wrong Turn"
      description="Oops! It looks like you've taken a detour to a page that doesn't exist. Let's get you back on the right road."
      buttonText="Go back to Homepage"
      buttonHref="/"
    />
  );
}
