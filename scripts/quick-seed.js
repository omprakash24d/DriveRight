#!/usr/bin/env node

/**
 * Quick seeding script for enhanced services
 * Usage: node scripts/quick-seed.js [action]
 * Actions: enhanced, all, force, status
 */

import { spawn } from "child_process";

// Get action from command line arguments
const action = process.argv[2] || "enhanced";

console.log("🚀 DriveRight Enhanced Services Quick Seeding");
console.log("=".repeat(50));

// Map actions to API calls
const actionMappings = {
  enhanced: {
    method: "POST",
    path: "/api/admin/seed",
    body: { action: "seed-enhanced-only" },
    description: "Seed enhanced services only",
  },
  all: {
    method: "POST",
    path: "/api/admin/seed",
    body: { action: "seed-all" },
    description: "Seed all collections",
  },
  force: {
    method: "POST",
    path: "/api/admin/seed",
    body: { action: "force-reseed", force: true },
    description: "Force reseed all enhanced services",
  },
  status: {
    method: "GET",
    path: "/api/admin/seed?action=check",
    description: "Check seeding status",
  },
};

const config = actionMappings[action];

if (!config) {
  console.error("❌ Invalid action. Available actions:");
  Object.keys(actionMappings).forEach((key) => {
    console.log(`   ${key}: ${actionMappings[key].description}`);
  });
  process.exit(1);
}

console.log(`📋 Action: ${config.description}`);
console.log("⏳ Starting...\n");

// Execute the seeding via curl (cross-platform)
const curlArgs = [
  "curl",
  "-X",
  config.method,
  "-H",
  "Content-Type: application/json",
  "-H",
  "Accept: application/json",
];

if (config.body) {
  curlArgs.push("-d", JSON.stringify(config.body));
}

curlArgs.push(`http://localhost:9002${config.path}`);

const curl = spawn(curlArgs[0], curlArgs.slice(1), {
  stdio: ["inherit", "pipe", "pipe"],
});

let output = "";
let error = "";

curl.stdout.on("data", (data) => {
  output += data.toString();
});

curl.stderr.on("data", (data) => {
  error += data.toString();
});

curl.on("close", (code) => {
  console.log("\n" + "=".repeat(50));

  if (code === 0) {
    try {
      const result = JSON.parse(output);

      if (result.success) {
        console.log("✅ Success!");
        console.log("📊 Result:", result.message);

        if (result.data) {
          console.log("\n📈 Details:");
          if (typeof result.data === "object") {
            Object.entries(result.data).forEach(([key, value]) => {
              if (typeof value === "number") {
                console.log(`   ${key}: ${value}`);
              } else if (Array.isArray(value) && value.length > 0) {
                console.log(`   ${key}: ${value.length} items`);
              } else {
                console.log(`   ${key}: ${value}`);
              }
            });
          }
        }

        console.log("\n🎉 Seeding completed successfully!");
        console.log("💡 You can now access the admin panel to manage services");
      } else {
        console.log("❌ Failed!");
        console.log("🔍 Error:", result.error || "Unknown error");
      }
    } catch (parseError) {
      console.log("❌ Failed to parse response");
      console.log("📄 Raw output:", output);
      if (error) {
        console.log("🔍 Error:", error);
      }
    }
  } else {
    console.log("❌ Request failed with code:", code);
    if (error) {
      console.log("🔍 Error:", error);
    }
    if (output) {
      console.log("📄 Output:", output);
    }
  }

  console.log("\n💡 Tips:");
  console.log(
    "   • Visit http://localhost:9002/admin/seed for the web interface"
  );
  console.log("   • Run with different actions: enhanced, all, force, status");
  console.log("   • Make sure the dev server is running (npm run dev)");
});

curl.on("error", (err) => {
  console.error("❌ Failed to execute curl:", err.message);
  console.log(
    "\n💡 Alternative: Visit http://localhost:9002/admin/seed in your browser"
  );
  process.exit(1);
});
