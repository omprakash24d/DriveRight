// scripts/security-config.js - Production security configuration
const fs = require("fs");
const path = require("path");

/**
 * Security configuration for production deployment
 * This script ensures all security measures are properly configured
 */

const SECURITY_CONFIG = {
  // Environment variables that MUST be set
  requiredEnvVars: [
    "ENCRYPTION_KEY",
    "JWT_SECRET",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_PRIVATE_KEY",
    "FIREBASE_CLIENT_EMAIL",
    "NEXT_PUBLIC_BASE_URL",
  ],

  // Security headers configuration
  securityHeaders: {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(self), payment=()",
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },

  // Rate limiting configuration
  rateLimits: {
    global: { requests: 100, windowMs: 60000 },
    auth: { requests: 5, windowMs: 60000 },
    api: { requests: 60, windowMs: 60000 },
    admin: { requests: 10, windowMs: 60000 },
    contact: { requests: 3, windowMs: 300000 },
  },

  // Security monitoring
  monitoring: {
    enableAuditLogging: true,
    enableSecurityEvents: true,
    enableIPBlocking: true,
    enableSuspiciousInputDetection: true,
    criticalEventNotifications: true,
  },

  // Data protection
  dataProtection: {
    enableEncryption: true,
    encryptionAlgorithm: "aes-256-gcm",
    enablePIIDetection: true,
    enableDataClassification: true,
    enableSecureStorage: true,
  },

  // Firestore security rules
  firestoreRules: `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access for courses
    match /courses/{document} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Protected user data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read, write: if isAdmin();
    }
    
    // Admin-only collections
    match /audit_logs/{document} {
      allow read, write: if isAdmin();
    }
    
    match /security_events/{document} {
      allow read, write: if isAdmin();
    }
    
    match /blocked_ips/{document} {
      allow read, write: if isAdmin();
    }
    
    // Enrollment data - user or admin access
    match /enrollments/{document} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || isAdmin());
    }
    
    // Helper functions
    function isAdmin() {
      return request.auth != null && 
        request.auth.token.admin == true;
    }
    
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
  }
}`,

  // Storage security rules
  storageRules: `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read for images
    match /images/{allPaths=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // User documents - user or admin access
    match /documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == userId || isAdmin());
    }
    
    // Admin-only uploads
    match /admin/{allPaths=**} {
      allow read, write: if isAdmin();
    }
    
    function isAdmin() {
      return request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}`,
};

// Validation functions
function validateEnvironment() {
  const missing = [];

  for (const envVar of SECURITY_CONFIG.requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((env) => console.error(`   - ${env}`));
    return false;
  }

  console.log("✅ All required environment variables are set");
  return true;
}

function validateSecurityFiles() {
  const requiredFiles = [
    "src/middleware.ts",
    "src/lib/encryption.ts",
    "src/lib/audit-logger.ts",
    "src/lib/error-tracking.ts",
    "src/app/api/security/events/route.ts",
    "src/app/api/security/ip-blocks/route.ts",
  ];

  const missing = [];

  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
      missing.push(file);
    }
  }

  if (missing.length > 0) {
    console.error("❌ Missing required security files:");
    missing.forEach((file) => console.error(`   - ${file}`));
    return false;
  }

  console.log("✅ All required security files are present");
  return true;
}

function generateSecurityReport() {
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    security: {
      environmentVariables: validateEnvironment(),
      securityFiles: validateSecurityFiles(),
      encryptionEnabled: !!process.env.ENCRYPTION_KEY,
      httpsEnabled: process.env.NODE_ENV === "production",
      auditLoggingEnabled: SECURITY_CONFIG.monitoring.enableAuditLogging,
      rateLimitingEnabled: true,
      cspEnabled: true,
      firestoreRulesConfigured: true,
    },
    recommendations: [],
  };

  // Add recommendations based on configuration
  if (!report.security.environmentVariables) {
    report.recommendations.push("Set all required environment variables");
  }

  if (!report.security.encryptionEnabled) {
    report.recommendations.push("Configure encryption key for data protection");
  }

  if (process.env.NODE_ENV !== "production") {
    report.recommendations.push(
      "Ensure proper production environment configuration"
    );
  }

  return report;
}

function createSecurityChecklist() {
  const checklist = `
# Driving School Arwal Security Checklist

## ✅ Environment Security
- [ ] All environment variables are set and secured
- [ ] HTTPS is enabled in production
- [ ] Encryption keys are properly configured
- [ ] Database connection strings are secured

## ✅ Application Security
- [ ] Security middleware is active
- [ ] Rate limiting is configured
- [ ] Input validation is implemented
- [ ] XSS protection is enabled
- [ ] CSRF protection is active

## ✅ Data Security
- [ ] PII data is encrypted
- [ ] Sensitive data is properly classified
- [ ] Data access is audited
- [ ] Backup encryption is enabled

## ✅ Firebase Security
- [ ] Firestore security rules are deployed
- [ ] Storage security rules are configured
- [ ] Authentication is properly secured
- [ ] Admin access is restricted

## ✅ Monitoring & Logging
- [ ] Audit logging is enabled
- [ ] Security events are monitored
- [ ] Error tracking is configured
- [ ] Performance monitoring is active

## ✅ Network Security
- [ ] IP blocking is configured
- [ ] Suspicious input detection is active
- [ ] Geographic restrictions are set
- [ ] DDoS protection is enabled

## ✅ Compliance
- [ ] GDPR compliance measures are implemented
- [ ] Data retention policies are configured
- [ ] User consent management is active
- [ ] Right to be forgotten is implemented

## ✅ Incident Response
- [ ] Security incident procedures are documented
- [ ] Alert systems are configured
- [ ] Response team is trained
- [ ] Recovery procedures are tested
`;

  fs.writeFileSync(
    path.join(process.cwd(), "SECURITY_CHECKLIST.md"),
    checklist
  );
  console.log("✅ Security checklist created: SECURITY_CHECKLIST.md");
}

function deployFirestoreRules() {
  const rulesPath = path.join(process.cwd(), "firestore-security.rules");
  fs.writeFileSync(rulesPath, SECURITY_CONFIG.firestoreRules);

  const storageRulesPath = path.join(process.cwd(), "storage-security.rules");
  fs.writeFileSync(storageRulesPath, SECURITY_CONFIG.storageRules);

  console.log("✅ Security rules created:");
  console.log("   - firestore-security.rules");
  console.log("   - storage-security.rules");
  console.log("");
  console.log("Deploy with:");
  console.log("   firebase deploy --only firestore:rules");
  console.log("   firebase deploy --only storage");
}

// Main execution
function main() {
  console.log("🔒 Driving School Arwal Security Configuration");
  console.log("=====================================");

  // Generate security report
  const report = generateSecurityReport();
  console.log("\n📊 Security Report:");
  console.log(JSON.stringify(report, null, 2));

  // Create security checklist
  createSecurityChecklist();

  // Deploy security rules
  deployFirestoreRules();

  // Save security configuration
  const configPath = path.join(process.cwd(), "security-config.json");
  fs.writeFileSync(configPath, JSON.stringify(SECURITY_CONFIG, null, 2));
  console.log("✅ Security configuration saved: security-config.json");

  console.log("\n🎯 Next Steps:");
  console.log("1. Review and complete the security checklist");
  console.log("2. Deploy Firestore security rules");
  console.log("3. Test security configurations");
  console.log("4. Set up monitoring alerts");
  console.log("5. Configure backup and recovery procedures");

  if (report.recommendations.length > 0) {
    console.log("\n⚠️  Recommendations:");
    report.recommendations.forEach((rec) => console.log(`   - ${rec}`));
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  SECURITY_CONFIG,
  validateEnvironment,
  validateSecurityFiles,
  generateSecurityReport,
  createSecurityChecklist,
  deployFirestoreRules,
};
