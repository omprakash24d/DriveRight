/**
 * DriveRight Application Initialization
 * Initialize all enhanced services for production robustness
 */

import { ApplicationInitializer } from './services/application-initializer';

// Initialize services when the application starts
if (typeof window === 'undefined') {
  // Server-side initialization
  ApplicationInitializer.initialize()
    .then((result) => {
      if (result.success) {

      } else {
        console.error('❌ DriveRight initialization completed with errors:', result.errors);
      }
    })
    .catch((error) => {
      console.error('❌ Failed to initialize DriveRight services:', error);
    });

  // Graceful shutdown handling
  process.on('SIGTERM', async () => {

    await ApplicationInitializer.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {

    await ApplicationInitializer.shutdown();
    process.exit(0);
  });
}

export { ApplicationInitializer };

