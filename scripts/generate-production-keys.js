#!/usr/bin/env node

/**
 * Generate secure production keys for environment variables
 */

import crypto from "crypto";

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

function generateSecureKey(length) {
  return crypto.randomBytes(length).toString("hex");
}

function generateBase64Key(length) {
  return crypto.randomBytes(length).toString("base64").slice(0, length);
}

function generateJWT() {
  return crypto.randomBytes(64).toString("hex");
}

function main() {
  log("🔐 Generating Production Security Keys", "bright");
  log("=====================================", "blue");

  log(
    "\n📋 Copy these values to your .env file or Vercel environment variables:\n",
    "blue"
  );

  // Generate all required keys
  const keys = {
    ENCRYPTION_KEY: generateSecureKey(16), // 32 characters hex
    JWT_SECRET: generateJWT(), // 128 characters hex
    SESSION_SECRET: generateBase64Key(32), // 32 characters base64
    BACKUP_ENCRYPTION_KEY: generateSecureKey(16), // 32 characters hex
    METRICS_UPDATE_TOKEN: generateBase64Key(24), // 24 characters base64
  };

  // Display the generated keys
  Object.entries(keys).forEach(([key, value]) => {
    log(`${key}=${value}`, "green");
  });

  log("\n📝 Additional values to update:", "yellow");
  log("NEXT_PUBLIC_APP_URL=https://your-actual-domain.com", "yellow");
  log("NEXT_PUBLIC_API_URL=https://your-actual-domain.com/api", "yellow");
  log("GDPR_NOTIFICATION_EMAIL=privacy@your-actual-domain.com", "yellow");
  log("DPO_EMAIL=dpo@your-actual-domain.com", "yellow");
  log("SECURITY_TEAM_EMAIL=security@your-actual-domain.com", "yellow");

  log("\n⚠️  Security Notes:", "red");
  log("- Store these keys securely", "red");
  log("- Never commit them to version control", "red");
  log("- Use different keys for different environments", "red");
  log("- Rotate keys periodically in production", "red");

  log("\n🎯 For Razorpay Production:", "blue");
  log("- Update RAZORPAY_KEY_ID with your live key ID", "blue");
  log("- Update RAZORPAY_KEY_SECRET with your live key secret", "blue");
  log("- Available at: https://dashboard.razorpay.com/app/keys", "blue");
}

main();
