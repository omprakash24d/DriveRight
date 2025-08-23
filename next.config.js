// ...preserve existing configuration below (no wrapping top-level override)
// @ts-check
import { config } from "dotenv";

// Load environment variables from .env file at the very beginning
config({ path: "./.env" });

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === "development";

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
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Disable experimental instrumentation hook temporarily
  experimental: {
    instrumentationHook: false,
  },

  // Content Security Policy headers
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";

    // Disable CSP in development to avoid script loading issues
    if (isDevelopment) {
      return [];
    }

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://checkout.razorpay.com https://www.google-analytics.com https://ssl.google-analytics.com https://www.gstatic.com https://tagmanager.google.com",
              "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://checkout.razorpay.com https://www.google-analytics.com https://ssl.google-analytics.com https://www.gstatic.com https://tagmanager.google.com",
              "worker-src 'self' blob:",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https:",
              "style-src 'self' 'unsafe-inline' https:",
              "connect-src 'self' https://www.google-analytics.com https://ssl.google-analytics.com https://analytics.google.com https://checkout.razorpay.com https://api.razorpay.com https://lumberjack.razorpay.com https://firebaseapp.com https://*.firebaseapp.com https://firestore.googleapis.com https://storage.googleapis.com https://firebase.googleapis.com wss://*.firebaseio.com https://region1.google-analytics.com https://www.googletagmanager.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://o4509708384468992.ingest.us.sentry.io",
              "frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://www.google.com https://www.youtube.com https://www.youtube-nocookie.com",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // Fix for Node.js modules in client-side build and Genkit dependencies
  webpack: (config, { isServer, dev }) => {
    // Enable WebAssembly support for Firebase Admin SDK dependencies
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
    };

    // Add WebAssembly module rules
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // Memory optimization for development builds
    if (dev) {
      // Configure filesystem cache with memory limits
      config.cache = {
        type: "filesystem",
        maxMemoryGenerations: 1,
        maxAge: 1000 * 60 * 60, // 1 hour
      };

      // Optimize chunk splitting to reduce memory usage
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              priority: -10,
              chunks: "all",
            },
          },
        },
      };

      // Limit parallelism to reduce memory usage
      config.parallelism = 1;
    }

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
        http2: false,
      };

      // Exclude Firebase Admin SDK from client-side bundle
      config.externals = config.externals || [];
      config.externals.push({
        "firebase-admin": "commonjs firebase-admin",
        "firebase-admin/firestore": "commonjs firebase-admin/firestore",
        "firebase-admin/auth": "commonjs firebase-admin/auth",
        "firebase-admin/storage": "commonjs firebase-admin/storage",
      });
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

// Export nextConfig directly in development to avoid Sentry issues
export default nextConfig;
