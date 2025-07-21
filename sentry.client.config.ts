// This file configures the initialization of Sentry on the browser/client side.
// The config you add here will be used whenever a user loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV !== 'production',
  
  // Capture unhandled promise rejections
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  
  // Performance Monitoring
  // Capture 100% of the transactions in dev, adjust in production
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Set environment
  environment: process.env.NODE_ENV,
  
  // Filter out noise from development
  beforeSend(event, hint) {
    // Filter out common development noise
    if (process.env.NODE_ENV === 'development') {
      // Don't send console.log events from development
      if (event.level === 'log') {
        return null;
      }
    }
    
    // Filter out common browser extension errors
    const error = hint.originalException;
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message);
      if (
        message.includes('Script error') ||
        message.includes('Non-Error exception captured') ||
        message.includes('ResizeObserver loop limit exceeded') ||
        message.includes('ChunkLoadError')
      ) {
        return null;
      }
    }
    
    return event;
  },
  
  // Tag important context
  initialScope: {
    tags: {
      component: "client",
      school: process.env.NEXT_PUBLIC_SCHOOL_NAME || "driving-school",
    },
  },
});
