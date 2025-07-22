#!/usr/bin/env node

/**
 * Deployment script for Driving School Arwal
 * Domain: drivingschoolarwal.in
 * Firebase Project: driveright-11b83
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

function readProductionEnv() {
  const envPath = ".env.production";

  if (!fs.existsSync(envPath)) {
    log("❌ .env.production file not found!", "red");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const envVars = {};

  envContent.split("\n").forEach((line) => {
    if (line.trim() === "" || line.trim().startsWith("#")) {
      return;
    }

    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      let value = valueParts.join("=").trim();

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

function setVercelEnv(key, value) {
  try {
    log(`Setting ${key}...`, "blue");
    execSync(`echo "${value}" | vercel env add ${key} production`, {
      stdio: ["pipe", "pipe", "pipe"],
    });
    log(`✅ Set ${key}`, "green");
    return true;
  } catch (error) {
    log(`❌ Failed to set ${key}`, "red");
    return false;
  }
}

async function main() {
  log("🚀 Driving School Arwal - Production Deployment", "bright");
  log("Domain: drivingschoolarwal.in", "cyan");
  log("Firebase: driveright-11b83", "cyan");
  log("================================================", "blue");

  // Check Vercel CLI
  try {
    execSync("vercel --version", { stdio: "pipe" });
    log("✅ Vercel CLI is available", "green");
  } catch (error) {
    log("❌ Please install Vercel CLI: npm i -g vercel", "red");
    process.exit(1);
  }

  // Read production environment
  log("\n📖 Reading production environment...", "blue");
  const envVars = readProductionEnv();
  log(`Found ${Object.keys(envVars).length} environment variables`, "green");

  // Deploy steps
  log("\n🎯 Starting deployment process...", "bright");

  log("\n1️⃣ Login to Vercel (if needed):", "yellow");
  log("   vercel login", "cyan");

  log("\n2️⃣ Link project:", "yellow");
  log("   vercel link", "cyan");

  log("\n3️⃣ Setting environment variables...", "yellow");

  let successCount = 0;
  for (const [key, value] of Object.entries(envVars)) {
    if (setVercelEnv(key, value)) {
      successCount++;
    }
  }

  log(
    `\n✅ Set ${successCount}/${
      Object.keys(envVars).length
    } environment variables`,
    "green"
  );

  log("\n4️⃣ Deploying to production...", "yellow");
  try {
    execSync("vercel --prod", { stdio: "inherit" });
    log("\n🎉 Deployment successful!", "green");
  } catch (error) {
    log("\n❌ Deployment failed", "red");
    process.exit(1);
  }

  log("\n📋 Post-deployment checklist:", "bright");
  log("1. Add drivingschoolarwal.in to Firebase Auth domains", "blue");
  log("2. Configure your domain DNS to point to Vercel", "blue");
  log("3. Add custom domain in Vercel dashboard", "blue");
  log("4. Test all functionality on the live site", "blue");
  log("5. Update Razorpay webhook URLs if using payments", "blue");

  log("\n🔗 Important URLs:", "magenta");
  log(`Production site: https://drivingschoolarwal.in`, "cyan");
  log(
    `Firebase Console: https://console.firebase.google.com/project/driveright-11b83`,
    "cyan"
  );
  log(`Vercel Dashboard: https://vercel.com/dashboard`, "cyan");
  log(
    `Sentry Dashboard: https://sentry.io/organizations/cusb/projects/drivingschoolarwal/`,
    "cyan"
  );
}

main().catch(console.error);
