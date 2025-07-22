#!/usr/bin/env node

// Performance optimization and monitoring setup
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

console.log("🚀 Driving School Arwal Performance Optimizer\n");

const optimizations = [
  {
    name: "Next.js Bundle Analysis",
    check: async () => {
      const packageJsonPath = path.join(rootDir, "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      const hasAnalyzer =
        packageJson.devDependencies?.["@next/bundle-analyzer"];
      if (!hasAnalyzer) {
        return {
          status: "warning",
          message:
            "Bundle analyzer not installed. Run: npm install --save-dev @next/bundle-analyzer",
        };
      }

      return { status: "success", message: "Bundle analyzer available" };
    },
  },

  {
    name: "Image Optimization",
    check: async () => {
      const nextConfigPath = path.join(rootDir, "next.config.js");
      if (!fs.existsSync(nextConfigPath)) {
        return { status: "warning", message: "No next.config.js found" };
      }

      const configContent = fs.readFileSync(nextConfigPath, "utf8");
      const hasImageConfig = configContent.includes("images:");

      if (!hasImageConfig) {
        return {
          status: "warning",
          message: "Image optimization config missing in next.config.js",
        };
      }

      return { status: "success", message: "Image optimization configured" };
    },
  },

  {
    name: "Caching System",
    check: async () => {
      const cacheFilePath = path.join(rootDir, "src/lib/cache.ts");
      if (!fs.existsSync(cacheFilePath)) {
        return { status: "error", message: "Cache system not found" };
      }

      // Check if Redis is available
      try {
        const { execSync } = await import("child_process");
        execSync("npm list ioredis", { stdio: "ignore" });
        return { status: "success", message: "Redis caching available" };
      } catch {
        return {
          status: "warning",
          message:
            "Memory cache only. Install Redis for production: npm install ioredis",
        };
      }
    },
  },

  {
    name: "Database Indexing",
    check: async () => {
      const indexesPath = path.join(rootDir, "firestore.indexes.json");
      if (!fs.existsSync(indexesPath)) {
        return { status: "warning", message: "No Firestore indexes defined" };
      }

      const indexes = JSON.parse(fs.readFileSync(indexesPath, "utf8"));
      const indexCount = indexes.indexes?.length || 0;

      if (indexCount === 0) {
        return { status: "warning", message: "No custom indexes defined" };
      }

      return {
        status: "success",
        message: `${indexCount} database indexes defined`,
      };
    },
  },

  {
    name: "Error & Analytics Tracking",
    check: async () => {
      const errorTrackingPath = path.join(rootDir, "src/lib/error-tracking.ts");
      const analyticsPath = path.join(rootDir, "src/lib/analytics.ts");

      if (!fs.existsSync(errorTrackingPath)) {
        return { status: "error", message: "Error tracking system missing" };
      }

      if (!fs.existsSync(analyticsPath)) {
        return { status: "error", message: "Analytics system missing" };
      }

      return { status: "success", message: "Monitoring systems in place" };
    },
  },

  {
    name: "Production Build Optimization",
    check: async () => {
      const buildDir = path.join(rootDir, ".next");
      if (!fs.existsSync(buildDir)) {
        return {
          status: "warning",
          message: "No production build found. Run: npm run build",
        };
      }

      // Check if build is optimized
      const buildManifest = path.join(buildDir, "build-manifest.json");
      if (fs.existsSync(buildManifest)) {
        return {
          status: "success",
          message: "Optimized production build available",
        };
      }

      return { status: "warning", message: "Build may not be fully optimized" };
    },
  },
];

// Performance recommendations
const recommendations = [
  {
    category: "Critical Performance",
    items: [
      "✅ Install Redis for production caching: npm install ioredis",
      "✅ Enable Gzip compression in your hosting provider",
      "✅ Set up CDN for static assets (Cloudflare, AWS CloudFront)",
      "✅ Optimize images: Use WebP format, proper sizing",
      "✅ Enable HTTP/2 on your server",
    ],
  },

  {
    category: "Database Optimization",
    items: [
      "📊 Create composite indexes for complex queries",
      "📊 Implement query pagination for large datasets",
      "📊 Use Firestore subcollections for nested data",
      "📊 Cache frequently accessed data",
      "📊 Monitor Firestore usage and costs",
    ],
  },

  {
    category: "Frontend Performance",
    items: [
      "⚡ Implement code splitting for large components",
      "⚡ Use React.lazy() for route-based code splitting",
      "⚡ Optimize bundle size with tree shaking",
      "⚡ Implement service worker for offline functionality",
      "⚡ Use intersection observer for lazy loading",
    ],
  },

  {
    category: "Monitoring & Analytics",
    items: [
      "📈 Set up real user monitoring (RUM)",
      "📈 Implement Core Web Vitals tracking",
      "📈 Monitor API response times",
      "📈 Track conversion funnel analytics",
      "📈 Set up alerts for performance degradation",
    ],
  },

  {
    category: "Security Performance",
    items: [
      "🔒 Implement rate limiting on all endpoints",
      "🔒 Use security headers (CSP, HSTS, etc.)",
      "🔒 Enable request/response compression",
      "🔒 Implement proper caching headers",
      "🔒 Use secure session management",
    ],
  },
];

// Run all checks
let errorCount = 0;
let warningCount = 0;

for (const optimization of optimizations) {
  const result = await optimization.check();
  const icon =
    result.status === "success"
      ? "✅"
      : result.status === "warning"
      ? "⚠️"
      : "❌";

  console.log(`${icon} ${optimization.name}: ${result.message}`);

  if (result.status === "error") errorCount++;
  if (result.status === "warning") warningCount++;
}

console.log("\n📊 Performance Summary:");
console.log(
  `✅ Optimized: ${optimizations.length - errorCount - warningCount}`
);
console.log(`⚠️  Needs Attention: ${warningCount}`);
console.log(`❌ Critical Issues: ${errorCount}`);

if (errorCount === 0 && warningCount === 0) {
  console.log("\n🎉 Your application is performance-optimized!");
} else if (errorCount === 0) {
  console.log("\n✨ Good performance! Address warnings for optimal speed.");
} else {
  console.log("\n🔧 Please fix critical performance issues.");
}

console.log("\n📚 Performance Optimization Roadmap:");
recommendations.forEach((category) => {
  console.log(`\n${category.category}:`);
  category.items.forEach((item) => console.log(`  ${item}`));
});

console.log("\n🚀 Next Performance Steps:");
console.log(
  "1. Run: npm run build -- --analyze (if bundle analyzer installed)"
);
console.log("2. Test with Lighthouse: npm start then audit in Chrome DevTools");
console.log("3. Set up monitoring: Configure error tracking and analytics");
console.log("4. Load test: Use tools like k6 or Artillery for stress testing");
console.log("5. Monitor in production: Set up alerts and dashboards");
