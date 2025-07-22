#!/usr/bin/env node

/**
 * Automated Vercel Environment Variables Setup Script
 * This script reads your .env file and sets all variables in Vercel
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
  bright: "\x1b[1m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readEnvFile() {
  const envPath = path.join(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) {
    log("❌ .env file not found!", "red");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const envVars = {};

  envContent.split("\n").forEach((line) => {
    // Skip comments and empty lines
    if (line.trim() === "" || line.trim().startsWith("#")) {
      return;
    }

    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      let value = valueParts.join("=").trim();

      // Remove quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      envVars[key.trim()] = value;
    }
  });

  return envVars;
}

function setVercelEnvVar(key, value, environment = "production") {
  try {
    log(`Setting ${key}...`, "blue");

    // Escape special characters in the value
    const escapedValue = value.replace(/\$/g, "\\$").replace(/"/g, '\\"');

    // Use vercel env add command
    const command = `vercel env add ${key} ${environment}`;

    // Execute command and provide the value via stdin
    const child = execSync(command, {
      input: `${escapedValue}\n`,
      stdio: ["pipe", "pipe", "pipe"],
      encoding: "utf8",
    });

    log(`✅ Set ${key}`, "green");
    return true;
  } catch (error) {
    log(`❌ Failed to set ${key}: ${error.message}`, "red");
    return false;
  }
}

function main() {
  log("🚀 Starting Vercel Environment Variables Setup", "bright");
  log("================================================", "blue");

  // Check if vercel CLI is installed
  try {
    execSync("vercel --version", { stdio: "pipe" });
    log("✅ Vercel CLI is installed", "green");
  } catch (error) {
    log(
      "❌ Vercel CLI not found. Please install it with: npm i -g vercel",
      "red"
    );
    process.exit(1);
  }

  // Check if project is linked
  try {
    execSync("vercel ls", { stdio: "pipe" });
    log("✅ Vercel project is linked", "green");
  } catch (error) {
    log('⚠️  Project might not be linked. Run "vercel link" first.', "yellow");
  }

  // Read environment variables
  log("\n📖 Reading .env file...", "blue");
  const envVars = readEnvFile();

  const totalVars = Object.keys(envVars).length;
  log(`Found ${totalVars} environment variables`, "blue");

  // Set environment variables in Vercel
  log("\n🔧 Setting environment variables in Vercel...", "blue");

  let successCount = 0;
  let failCount = 0;

  for (const [key, value] of Object.entries(envVars)) {
    if (setVercelEnvVar(key, value)) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Summary
  log("\n📊 Summary:", "bright");
  log(`✅ Successfully set: ${successCount} variables`, "green");
  if (failCount > 0) {
    log(`❌ Failed to set: ${failCount} variables`, "red");
  }

  log("\n🎉 Environment setup complete!", "green");
  log("\nNext steps:", "blue");
  log(
    "1. Update NEXT_PUBLIC_APP_URL and NEXT_PUBLIC_API_URL with your production domain"
  );
  log('2. Run "vercel --prod" to deploy');
  log("3. Add your production domain to Firebase Authentication settings");
  log("4. Update CORS settings if needed");
}

// Error handling
process.on("uncaughtException", (error) => {
  log(`❌ Uncaught Exception: ${error.message}`, "red");
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  log(`❌ Unhandled Rejection: ${reason}`, "red");
  process.exit(1);
});

// Run the script
main();
