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

  // Enable experimental instrumentation hook for Sentry
  experimental: {
    instrumentationHook: true,
  },

  // Fix for Node.js modules in client-side build and Genkit dependencies
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    // Ignore external modules that cause warnings
    config.externals = config.externals || [];
    config.externals.push({
      "@opentelemetry/exporter-jaeger":
        "commonjs @opentelemetry/exporter-jaeger",
    });

    // Suppress warnings for dynamic requires and handlebars
    config.module = config.module || {};
    config.module.unknownContextCritical = false;
    config.module.unknownContextRegExp = /^\.\/.*$/;
    config.module.unknownContextRequest = ".";

    return config;
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

// Injected content via Sentry wizard below
// Injected content via Sentry wizard below

// The following block is redundant and causes duplicate identifier errors.
// Please use only one Sentry configuration wrapper (the ES module export above).
