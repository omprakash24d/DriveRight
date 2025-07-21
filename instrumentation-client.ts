import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of the transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // ...

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      // Mask all text content, emails, and usernames
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

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
  }
});
