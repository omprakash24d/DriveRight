// This file configures the initialization of Sentry on the server side.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV !== 'production',
  
  // Performance Monitoring
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Set environment
  environment: process.env.NODE_ENV,
  
  // Server-specific integrations
  integrations: [
    // Add server-specific integrations here if needed
  ],
  
  // Filter server-side events
  beforeSend(event, hint) {
    // Filter out Firebase admin initialization warnings in development
    if (process.env.NODE_ENV === 'development') {
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);
        if (
          message.includes('Firebase Admin SDK') ||
          message.includes('Firebase not initialized') ||
          message.includes('ECONNREFUSED') // Common development connection errors
        ) {
          return null;
        }
      }
    }
    
    return event;
  },
  
  // Tag server context
  initialScope: {
    tags: {
      component: "server",
      school: process.env.NEXT_PUBLIC_SCHOOL_NAME || "driving-school",
    },
  },
});
