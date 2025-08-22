#!/usr/bin/env node

/**
 * Memory Optimizer for DriveRight Application
 * Addresses critical ArrayBuffer allocation failures and webpack cache issues
 */

const fs = require("fs");
const path = require("path");

class MemoryOptimizer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, "..");
    this.optimizations = [];
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix = type === "error" ? "❌" : type === "warning" ? "⚠️" : "✅";
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  /**
   * Clean webpack cache to prevent memory buildup
   */
  async cleanWebpackCache() {
    try {
      const cacheDir = path.join(this.projectRoot, ".next/cache");
      if (fs.existsSync(cacheDir)) {
        await this.removeDirectory(cacheDir);
        this.log("Webpack cache cleared successfully");
        this.optimizations.push("Webpack cache cleared");
      }
    } catch (error) {
      this.log(`Failed to clean webpack cache: ${error.message}`, "error");
    }
  }

  /**
   * Optimize Next.js configuration for memory usage
   */
  async optimizeNextConfig() {
    try {
      const nextConfigPath = path.join(this.projectRoot, "next.config.js");

      if (fs.existsSync(nextConfigPath)) {
        let content = fs.readFileSync(nextConfigPath, "utf8");

        // Add memory optimization configurations
        const memoryOptimizations = `
  // Memory optimization configurations
  experimental: {
    // Reduce memory usage in development
    turbo: false,
    optimizePackageImports: ['@next/font'],
    // Limit concurrent webpack workers
    webpackWorkerCount: 2,
  },
  
  // Webpack optimization for memory
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Reduce memory usage in development
      config.cache = {
        type: 'filesystem',
        maxMemoryGenerations: 1,
        maxAge: 1000 * 60 * 60, // 1 hour
      };
      
      // Optimize memory usage
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\\\/]node_modules[\\\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
  },`;

        // Check if these optimizations already exist
        if (
          !content.includes("webpackWorkerCount") &&
          !content.includes("maxMemoryGenerations")
        ) {
          // Insert before the module.exports closing
          content = content.replace(
            /module\.exports\s*=\s*nextConfig/,
            `const nextConfig = {
  ...nextConfig,${memoryOptimizations}
};

module.exports = nextConfig`
          );

          fs.writeFileSync(nextConfigPath, content);
          this.log("Next.js config optimized for memory usage");
          this.optimizations.push("Next.js config optimized");
        }
      }
    } catch (error) {
      this.log(`Failed to optimize Next.js config: ${error.message}`, "error");
    }
  }

  /**
   * Create memory-optimized development scripts
   */
  async createOptimizedScripts() {
    try {
      const packagePath = path.join(this.projectRoot, "package.json");
      const packageData = JSON.parse(fs.readFileSync(packagePath, "utf8"));

      // Add memory-optimized scripts
      const memoryScripts = {
        "dev:memory-optimized":
          "node --max-old-space-size=4096 --max-semi-space-size=256 ./node_modules/.bin/next dev -p 9002",
        "dev:low-memory":
          "node --max-old-space-size=2048 --max-semi-space-size=128 ./node_modules/.bin/next dev -p 9002",
        "build:optimized":
          "node --max-old-space-size=8192 ./node_modules/.bin/next build",
        "clean:cache": "rm -rf .next/cache && rm -rf node_modules/.cache",
        "memory:monitor": "node scripts/memory-monitor.js",
      };

      packageData.scripts = { ...packageData.scripts, ...memoryScripts };

      fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
      this.log("Memory-optimized scripts added to package.json");
      this.optimizations.push("Optimized scripts created");
    } catch (error) {
      this.log(`Failed to create optimized scripts: ${error.message}`, "error");
    }
  }

  /**
   * Create memory monitoring script
   */
  async createMemoryMonitor() {
    const monitorScript = [
      "#!/usr/bin/env node",
      "",
      "/**",
      " * Memory Monitor for DriveRight Application",
      " */",
      "",
      "function formatBytes(bytes) {",
      '  if (bytes === 0) return "0 Bytes";',
      "  const k = 1024;",
      '  const sizes = ["Bytes", "KB", "MB", "GB"];',
      "  const i = Math.floor(Math.log(bytes) / Math.log(k));",
      '  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];',
      "}",
      "",
      "function monitorMemory() {",
      "  const usage = process.memoryUsage();",
      "  const timestamp = new Date().toISOString();",
      "  ",
      "  console.log(`📊 [Memory Monitor] ${timestamp}`);",
      "  console.log(`   RSS (Resident Set Size): ${formatBytes(usage.rss)}`);",
      "  console.log(`   Heap Total: ${formatBytes(usage.heapTotal)}`);",
      "  console.log(`   Heap Used: ${formatBytes(usage.heapUsed)}`);",
      "  console.log(`   External: ${formatBytes(usage.external)}`);",
      "  console.log(`   Array Buffers: ${formatBytes(usage.arrayBuffers)}`);",
      "  ",
      "  // Warning thresholds",
      "  const heapUsedMB = usage.heapUsed / (1024 * 1024);",
      "  const rssGB = usage.rss / (1024 * 1024 * 1024);",
      "  ",
      "  if (heapUsedMB > 1500) {",
      "    console.log(`⚠️  Warning: High heap usage (${formatBytes(usage.heapUsed)})`);",
      "  }",
      "  ",
      "  if (rssGB > 3) {",
      "    console.log(`🚨 Critical: Very high memory usage (${formatBytes(usage.rss)})`);",
      "  }",
      "  ",
      '  console.log("\\n");',
      "}",
      "",
      "// Monitor every 30 seconds",
      'console.log("🔍 Starting memory monitoring...");',
      "setInterval(monitorMemory, 30000);",
      "monitorMemory(); // Initial reading",
    ].join("\n");

    try {
      const monitorPath = path.join(
        this.projectRoot,
        "scripts",
        "memory-monitor.js"
      );
      fs.writeFileSync(monitorPath, monitorScript);
      this.log("Memory monitor script created");
      this.optimizations.push("Memory monitor created");
    } catch (error) {
      this.log(`Failed to create memory monitor: ${error.message}`, "error");
    }
  }

  /**
   * Remove directory recursively
   */
  async removeDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          await this.removeDirectory(filePath);
        } else {
          fs.unlinkSync(filePath);
        }
      }

      fs.rmdirSync(dirPath);
    }
  }

  /**
   * Clean node_modules cache
   */
  async cleanNodeModulesCache() {
    try {
      const cacheDir = path.join(this.projectRoot, "node_modules", ".cache");
      if (fs.existsSync(cacheDir)) {
        await this.removeDirectory(cacheDir);
        this.log("Node modules cache cleaned");
        this.optimizations.push("Node modules cache cleaned");
      }
    } catch (error) {
      this.log(`Failed to clean node_modules cache: ${error.message}`, "error");
    }
  }

  /**
   * Create environment-specific memory configuration
   */
  async createMemoryEnvConfig() {
    const envConfig = `# Memory optimization environment variables
NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=256"
NEXT_TELEMETRY_DISABLED=1

# Development optimization
NODE_ENV=development
FORCE_COLOR=1

# Webpack optimization
WEBPACK_WORKER_COUNT=2
NEXT_CACHE_SIZE_LIMIT=50MB
`;

    try {
      const envPath = path.join(this.projectRoot, ".env.memory");
      fs.writeFileSync(envPath, envConfig);
      this.log("Memory environment config created (.env.memory)");
      this.optimizations.push("Memory environment config created");
    } catch (error) {
      this.log(`Failed to create memory env config: ${error.message}`, "error");
    }
  }

  /**
   * Run all optimizations
   */
  async optimize() {
    this.log("🚀 Starting memory optimization process...");

    await this.cleanWebpackCache();
    await this.cleanNodeModulesCache();
    await this.optimizeNextConfig();
    await this.createOptimizedScripts();
    await this.createMemoryMonitor();
    await this.createMemoryEnvConfig();

    this.log("🎉 Memory optimization completed!");
    console.log("\n📋 Optimizations applied:");
    this.optimizations.forEach((opt, index) => {
      console.log(`   ${index + 1}. ${opt}`);
    });

    console.log("\n🔧 Next steps:");
    console.log("   1. Restart your development server");
    console.log("   2. Use: npm run dev:memory-optimized");
    console.log("   3. Monitor memory: npm run memory:monitor");
    console.log("   4. If issues persist, use: npm run dev:low-memory");
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new MemoryOptimizer();
  optimizer.optimize().catch(console.error);
}

module.exports = MemoryOptimizer;
