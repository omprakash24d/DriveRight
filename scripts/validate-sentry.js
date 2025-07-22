#!/usr/bin/env node
/**
 * Sentry Setup Validation Script
 * Run this after configuring your Sentry environment variables
 */

import { config } from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, "../.env.local") });

console.log("🔍 Validating Sentry Configuration...\n");

// Check required environment variables
const requiredVars = ["NEXT_PUBLIC_SENTRY_DSN"];

const optionalVars = [
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "SENTRY_AUTH_TOKEN",
  "SENTRY_ENVIRONMENT",
];

let hasErrors = false;

console.log("✅ Required Variables:");
requiredVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value || value.includes("your-actual-dsn")) {
    console.log(`❌ ${varName}: NOT SET or using placeholder`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: Configured`);
  }
});

console.log("\n📋 Optional Variables:");
optionalVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value || value.includes("your-")) {
    console.log(`⚠️  ${varName}: NOT SET or using placeholder`);
  } else {
    console.log(`✅ ${varName}: Configured`);
  }
});

console.log("\n🔗 Configuration Files:");
const configFiles = [
  "instrumentation-client.ts",
  "sentry.server.config.ts",
  "sentry.edge.config.ts",
  "instrumentation.ts",
  "src/lib/error-service.ts",
];

configFiles.forEach((file) => {
  const filePath = file.startsWith("src/")
    ? path.join(__dirname, "..", file)
    : path.join(__dirname, "..", file);

  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}: Exists`);
  } else {
    console.log(`❌ ${file}: Missing`);
    hasErrors = true;
  }
});

console.log("\n📝 Next Steps:");
if (hasErrors) {
  console.log("❌ Setup incomplete. Please:");
  console.log("1. Create a Sentry account at https://sentry.io");
  console.log("2. Create a Next.js project in Sentry");
  console.log("3. Update .env.local with your actual Sentry values");
  console.log("4. Replace placeholder values with real ones");
} else {
  console.log("✅ Sentry configuration looks good!");
  console.log("🚀 You can now deploy your application");
  console.log(
    "📊 Monitor errors at: https://sentry.io/organizations/" +
      process.env.SENTRY_ORG
  );
}

console.log("\n🔗 Helpful Links:");
console.log("• Sentry Dashboard: https://sentry.io");
console.log(
  "• Documentation: https://docs.sentry.io/platforms/javascript/guides/nextjs/"
);
console.log("• Error Tracking Guide: ./docs/ERROR_TRACKING_SETUP.md");

if (hasErrors) {
  process.exit(1);
} else {
  process.exit(0);
}
