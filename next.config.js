// @ts-check
import { withSentryConfig } from "@sentry/nextjs";
import { config } from "dotenv";

// Load environment variables from .env file at the very beginning
config({ path: "./.env" });

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  optimizeFonts: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
        port: "",
        pathname: "/v1/create-qr-code/**",
      },
      {
        protocol: "https",
        hostname: "drivingschoolarwal.in",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "om.indhinditech.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Sentry configuration
  sentry: {
    // Suppresses source map uploading logs during build
    silent: true,
    // Disables the automatic instrumentation for API routes
    autoInstrumentServerFunctions: false,
    // Disables the automatic instrumentation for middleware
    autoInstrumentMiddleware: false,
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,

  // Upload source maps in production only
  dryRun: process.env.NODE_ENV !== "production",

  // Organization and project
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

// Make sure to wrap your config with withSentryConfig
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
