#!/usr/bin/env node
// scripts/secure-setup.cjs - Secure Environment Setup Script

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function secureSetup() {
  console.log("🔒 Driving School Arwal - Secure Setup");
  console.log("=====================================");
  console.log("This script will help you set up your environment securely.");
  console.log("");

  // Check if .env exists
  const envExists = fs.existsSync(".env");
  const configExists = fs.existsSync("config/project-config.cjs");

  if (envExists || configExists) {
    console.log("⚠️  Warning: Configuration files already exist.");
    const overwrite = await question("Do you want to overwrite them? (y/N): ");
    if (overwrite.toLowerCase() !== "y") {
      console.log("Setup cancelled.");
      rl.close();
      return;
    }
  }

  console.log("");
  console.log("📝 Please provide your business information:");
  console.log("");

  // Collect business information
  const businessName = await question("School Name: ");
  const contactEmail = await question("Contact Email: ");
  const phone = await question("Phone Number (with country code): ");
  const address = await question("School Address: ");
  const adminEmail = await question("Admin Email: ");

  console.log("");
  console.log("🔥 Firebase Configuration:");
  console.log("(Get these from Firebase Console > Project Settings > General)");
  console.log("");

  const firebaseProjectId = await question("Firebase Project ID: ");
  const firebaseApiKey = await question("Firebase API Key: ");
  const firebaseAuthDomain = await question("Firebase Auth Domain: ");
  const firebaseStorageBucket = await question("Firebase Storage Bucket: ");
  const firebaseMessagingSenderId = await question(
    "Firebase Messaging Sender ID: "
  );
  const firebaseAppId = await question("Firebase App ID: ");

  console.log("");
  console.log("🔑 Secure Credentials:");
  console.log("");

  const smtpPassword = await question("Gmail App Password (for email): ");
  const razorpayKeyId = await question("Razorpay Key ID: ");
  const razorpaySecret = await question("Razorpay Secret Key: ");
  const geminiApiKey = await question("Google Gemini API Key: ");

  // Generate secure keys
  const encryptionKey = generateSecureKey(32);
  const jwtSecret = generateSecureKey(64);
  const sessionSecret = generateSecureKey(32);

  console.log("");
  console.log("✅ Generated secure keys for encryption and sessions.");
  console.log("");

  // Create .env file
  const envContent = `# ===========================================
# Driving School Arwal - Environment Configuration
# Generated by secure setup script
# ===========================================

# Core Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:9002
NEXT_PUBLIC_API_URL=http://localhost:9002/api

# Business Information
NEXT_PUBLIC_SCHOOL_NAME="${businessName}"
NEXT_PUBLIC_CONTACT_EMAIL=${contactEmail}
NEXT_PUBLIC_PHONE=${phone}
NEXT_PUBLIC_WHATSAPP_NUMBER=${phone.replace("+", "")}
NEXT_PUBLIC_ADDRESS="${address}"
NEXT_PUBLIC_ADMIN_EMAILS=${adminEmail}

# Social Media Links (Update these with your actual links)
NEXT_PUBLIC_FACEBOOK_URL=https://facebook.com/yourpage
NEXT_PUBLIC_TWITTER_URL=https://twitter.com/yourhandle
NEXT_PUBLIC_GITHUB_URL=https://github.com/yourusername
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/yourhandle

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=${firebaseApiKey}
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${firebaseAuthDomain}
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${firebaseProjectId}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${firebaseStorageBucket}
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${firebaseMessagingSenderId}
NEXT_PUBLIC_FIREBASE_APP_ID=${firebaseAppId}

# Firebase Admin (You need to add your service account key manually)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "${firebaseProjectId}", "private_key_id": "YOUR_PRIVATE_KEY_ID", "private_key": "-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n", "client_email": "firebase-adminsdk-xxxxx@${firebaseProjectId}.iam.gserviceaccount.com", "client_id": "YOUR_CLIENT_ID", "auth_uri": "https://accounts.google.com/o/oauth2/auth", "token_uri": "https://oauth2.googleapis.com/token", "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs", "client_x509_cert_url": "YOUR_CERT_URL", "universe_domain": "googleapis.com"}'

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=${contactEmail}
SMTP_PASS=${smtpPassword}
FROM_EMAIL=${contactEmail}
TO_EMAIL=${adminEmail}

# Payment Gateway
RAZORPAY_KEY_ID=${razorpayKeyId}
RAZORPAY_KEY_SECRET=${razorpaySecret}

# External Services
GEMINI_API_KEY=${geminiApiKey}

# Analytics & Monitoring (Update with your actual IDs)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Sentry Configuration (Optional - update with your values)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-token
SENTRY_RELEASE=1.0

# Security & Infrastructure (Generated secure keys)
ENCRYPTION_KEY=${encryptionKey}
JWT_SECRET=${jwtSecret}
SESSION_SECRET=${sessionSecret}
RATE_LIMIT_REDIS_URL=redis://localhost:6379
BACKUP_STORAGE_BUCKET=${firebaseProjectId.replace(/-/g, "")}backups
BACKUP_ENCRYPTION_KEY=${generateSecureKey(32)}
CDN_URL=https://cdn.${businessName.toLowerCase().replace(/\s+/g, "")}.com
METRICS_UPDATE_TOKEN=${generateSecureKey(16)}

# Compliance
GDPR_NOTIFICATION_EMAIL=privacy@${businessName
    .toLowerCase()
    .replace(/\s+/g, "")}.com
DPO_EMAIL=dpo@${businessName.toLowerCase().replace(/\s+/g, "")}.com
SECURITY_TEAM_EMAIL=security@${businessName
    .toLowerCase()
    .replace(/\s+/g, "")}.com
`;

  // Write .env file
  fs.writeFileSync(".env", envContent);

  console.log("✅ Created .env file with your configuration.");
  console.log("");
  console.log("🚨 IMPORTANT SECURITY NOTES:");
  console.log("");
  console.log("1. ❌ NEVER commit the .env file to version control");
  console.log("2. 🔑 Update the Firebase service account key manually");
  console.log("3. 📊 Update analytics and monitoring IDs");
  console.log("4. 🌐 Update social media URLs");
  console.log("5. 🔄 Run: npm run config:update after making changes");
  console.log("");
  console.log("📚 Next steps:");
  console.log("- Edit .env file to complete Firebase service account key");
  console.log("- Update social media links and analytics IDs");
  console.log("- Run: npm run dev to start development");
  console.log("");

  rl.close();
}

function generateSecureKey(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

if (require.main === module) {
  secureSetup().catch(console.error);
}

module.exports = { secureSetup };
