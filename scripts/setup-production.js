#!/usr/bin/env node

// Production setup verification script
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

console.log("🚀 Driving School Arwal Production Setup Checker\n");

const checks = [
  {
    name: "Environment Variables",
    check: () => {
      const envFile = path.join(rootDir, ".env.local");
      if (!fs.existsSync(envFile)) {
        return { status: "error", message: "Missing .env.local file" };
      }

      const envContent = fs.readFileSync(envFile, "utf8");
      const requiredVars = [
        "NEXT_PUBLIC_FIREBASE_API_KEY",
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        "FIREBASE_ADMIN_PROJECT_ID",
        "EMAIL_HOST",
        "EMAIL_USER",
      ];

      const missing = requiredVars.filter((v) => !envContent.includes(v));
      if (missing.length > 0) {
        return { status: "warning", message: `Missing: ${missing.join(", ")}` };
      }

      return { status: "success", message: "All required variables present" };
    },
  },

  {
    name: "Firebase Configuration",
    check: () => {
      try {
        const firebaseConfig = path.join(rootDir, "firebase.json");
        if (!fs.existsSync(firebaseConfig)) {
          return { status: "error", message: "Missing firebase.json" };
        }
        return { status: "success", message: "Firebase config found" };
      } catch (error) {
        return { status: "error", message: error.message };
      }
    },
  },

  {
    name: "Security Rules",
    check: () => {
      const rules = [
        "firestore.rules",
        "storage.rules",
        "src/firestore-production.rules",
      ];

      const existing = rules.filter((rule) =>
        fs.existsSync(path.join(rootDir, rule))
      );

      if (existing.length === 0) {
        return { status: "error", message: "No security rules found" };
      }

      return {
        status: existing.length === rules.length ? "success" : "warning",
        message: `Found: ${existing.join(", ")}`,
      };
    },
  },

  {
    name: "Production Dependencies",
    check: async () => {
      try {
        const packageJsonPath = path.join(rootDir, "package.json");
        const packageJsonContent = fs.readFileSync(packageJsonPath, "utf8");
        const packageJson = JSON.parse(packageJsonContent);

        const prodDeps = ["firebase-admin", "nodemailer", "@types/nodemailer"];
        const missing = prodDeps.filter(
          (dep) =>
            !packageJson.dependencies?.[dep] &&
            !packageJson.devDependencies?.[dep]
        );

        if (missing.length > 0) {
          return {
            status: "warning",
            message: `Consider adding: ${missing.join(", ")}`,
          };
        }

        return {
          status: "success",
          message: "All production dependencies present",
        };
      } catch (error) {
        return { status: "error", message: "Could not read package.json" };
      }
    },
  },

  {
    name: "Build Output",
    check: () => {
      const buildDir = path.join(rootDir, ".next");
      if (!fs.existsSync(buildDir)) {
        return {
          status: "warning",
          message: "No build found. Run: npm run build",
        };
      }
      return { status: "success", message: "Build artifacts present" };
    },
  },
];

// Main execution
console.log("5. Set up monitoring and alerts");

// Main execution
(async () => {
  // Run all checks
  let errorCount = 0;
  let warningCount = 0;

  for (const check of checks) {
    const result = await check.check();
    const icon =
      result.status === "success"
        ? "✅"
        : result.status === "warning"
        ? "⚠️"
        : "❌";

    console.log(`${icon} ${check.name}: ${result.message}`);

    if (result.status === "error") errorCount++;
    if (result.status === "warning") warningCount++;
  }

  console.log("\n📊 Summary:");
  console.log(`✅ Passed: ${checks.length - errorCount - warningCount}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  if (errorCount === 0 && warningCount === 0) {
    console.log("\n🎉 Your application is production-ready!");
  } else if (errorCount === 0) {
    console.log(
      "\n✨ Your application is mostly ready. Address warnings for optimal setup."
    );
  } else {
    console.log("\n🔧 Please fix the errors before deploying to production.");
  }

  console.log("\n📚 Next steps:");
  console.log("1. Fix any errors and warnings above");
  console.log("2. Run: npm run build");
  console.log("3. Test with: npm start");
  console.log("4. Deploy using your preferred platform");
  console.log("5. Set up monitoring and alerts");
})().catch(console.error);
