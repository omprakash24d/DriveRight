#!/usr/bin/env node

/**
 * Quick Deployment Setup for Vercel
 * This script prepares everything for deployment
 */

import { execSync } from "child_process";
import fs from "fs";

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  reset: "\x1b[0m",
  bright: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPrerequisites() {
  log("🔍 Checking Prerequisites...", "blue");

  // Check Node.js version
  const nodeVersion = process.version;
  log(`✅ Node.js version: ${nodeVersion}`, "green");

  // Check if .env exists
  if (fs.existsSync(".env")) {
    log("✅ .env file found", "green");
  } else {
    log("❌ .env file not found", "red");
    return false;
  }

  // Check if package.json exists
  if (fs.existsSync("package.json")) {
    log("✅ package.json found", "green");
  } else {
    log("❌ package.json not found", "red");
    return false;
  }

  return true;
}

function checkVercelCLI() {
  try {
    const version = execSync("vercel --version", {
      encoding: "utf8",
      stdio: "pipe",
    });
    log(`✅ Vercel CLI installed: ${version.trim()}`, "green");
    return true;
  } catch (error) {
    log("❌ Vercel CLI not found", "red");
    log("Install with: npm i -g vercel", "yellow");
    return false;
  }
}

function runBuild() {
  log("\n🔨 Running build test...", "blue");
  try {
    execSync("npm run build", { stdio: "inherit" });
    log("✅ Build successful!", "green");
    return true;
  } catch (error) {
    log("❌ Build failed!", "red");
    log("Please fix build errors before deploying", "yellow");
    return false;
  }
}

function main() {
  log("🚀 Driving School Arwal - Deployment Setup", "bright");
  log("==========================================", "blue");

  // Check prerequisites
  if (!checkPrerequisites()) {
    process.exit(1);
  }

  // Check Vercel CLI
  if (!checkVercelCLI()) {
    log("\nTo install Vercel CLI:", "yellow");
    log("npm install -g vercel", "cyan");
    process.exit(1);
  }

  // Run build test
  if (!runBuild()) {
    process.exit(1);
  }

  // Success message
  log("\n🎉 All checks passed!", "green");
  log("\n📋 Next Steps:", "bright");
  log("1. Generate production keys:", "blue");
  log("   node scripts/generate-production-keys.js", "cyan");
  log("\n2. Login to Vercel:", "blue");
  log("   vercel login", "cyan");
  log("\n3. Link your project:", "blue");
  log("   vercel link", "cyan");
  log("\n4. Set environment variables:", "blue");
  log("   node scripts/setup-vercel-env.js", "cyan");
  log("\n5. Deploy to production:", "blue");
  log("   vercel --prod", "cyan");

  log("\n📚 For detailed instructions, see:", "yellow");
  log("   DEPLOYMENT_GUIDE.md", "cyan");

  log("\n🔗 Your application features:", "magenta");
  log("   ✅ Firebase Authentication & Database", "green");
  log("   ✅ Email notifications (Gmail SMTP)", "green");
  log("   ✅ Payment gateway (Razorpay)", "green");
  log("   ✅ Error tracking (Sentry)", "green");
  log("   ✅ Analytics (Google Analytics)", "green");
  log("   ✅ AI Features (Gemini API)", "green");
  log("   ✅ Security headers & CORS", "green");
  log("   ✅ Responsive design", "green");

  log("\n🎯 Ready for deployment!", "bright");
}

main();
