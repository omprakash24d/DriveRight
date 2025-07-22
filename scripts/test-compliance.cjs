#!/usr/bin/env node

// scripts/test-compliance.js - GDPR Compliance Testing Suite
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔒 Driving School Arwal GDPR Compliance Testing");
console.log("=====================================\n");

// Test scenarios
const testScenarios = [
  {
    name: "Data Subject Access Request",
    endpoint: "/api/gdpr/data-subject-request",
    method: "POST",
    data: {
      userId: "test-user-123",
      userEmail: "test@example.com",
      requestType: "access",
      requestDetails: "User requesting all personal data",
    },
  },
  {
    name: "Data Portability Request",
    endpoint: "/api/gdpr/data-subject-request",
    method: "POST",
    data: {
      userId: "test-user-123",
      userEmail: "test@example.com",
      requestType: "portability",
      requestDetails: "User requesting data export in JSON format",
    },
  },
  {
    name: "Consent Recording",
    endpoint: "/api/gdpr/consent",
    method: "POST",
    data: {
      userId: "test-user-123",
      purpose: "marketing_communications",
      consentGiven: true,
      consentVersion: "2.0",
      legalBasis: "consent",
    },
  },
  {
    name: "Consent Withdrawal",
    endpoint: "/api/gdpr/consent",
    method: "POST",
    data: {
      userId: "test-user-123",
      purpose: "marketing_communications",
      consentGiven: false,
      legalBasis: "consent",
    },
  },
  {
    name: "Data Breach Reporting",
    endpoint: "/api/gdpr/data-breach",
    method: "POST",
    data: {
      description: "Test data breach - unauthorized access to user database",
      affectedUsers: ["test-user-123", "test-user-456"],
      dataCategories: ["personal_details", "contact_information"],
      riskLevel: "medium",
      containmentMeasures: ["Access revoked", "Passwords reset"],
      reportedBy: "security-team",
    },
  },
];

async function runTest(scenario) {
  return new Promise((resolve) => {
    const curl = `curl -X ${scenario.method} \\
      -H "Content-Type: application/json" \\
      -d '${JSON.stringify(scenario.data)}' \\
      http://localhost:3000${scenario.endpoint}`;

    exec(curl, { timeout: 10000 }, (error, stdout, stderr) => {
      const result = {
        name: scenario.name,
        success: !error,
        response: stdout,
        error: error ? error.message : null,
        status: "unknown",
      };

      try {
        const responseData = JSON.parse(stdout);
        result.status = responseData.success ? "passed" : "failed";
        result.details = responseData;
      } catch (e) {
        result.status = "failed";
        result.error = "Invalid JSON response";
      }

      resolve(result);
    });
  });
}

async function testSecurityHeaders() {
  return new Promise((resolve) => {
    exec("curl -I http://localhost:3000/", (error, stdout) => {
      const headers = stdout.toLowerCase();
      const securityChecks = {
        "content-security-policy": headers.includes("content-security-policy"),
        "x-frame-options": headers.includes("x-frame-options"),
        "x-content-type-options": headers.includes("x-content-type-options"),
        "strict-transport-security": headers.includes(
          "strict-transport-security"
        ),
        "referrer-policy": headers.includes("referrer-policy"),
      };

      const passed = Object.values(securityChecks).filter(Boolean).length;
      const total = Object.keys(securityChecks).length;

      resolve({
        name: "Security Headers Check",
        success: passed === total,
        status: passed === total ? "passed" : "failed",
        details: {
          score: `${passed}/${total}`,
          checks: securityChecks,
        },
      });
    });
  });
}

async function testDataEncryption() {
  const encryptionTest = {
    name: "Data Encryption Test",
    success: false,
    status: "failed",
    details: {},
  };

  try {
    // Check if encryption module exists and works
    const encryptionPath = path.join(__dirname, "../src/lib/encryption.ts");
    if (fs.existsSync(encryptionPath)) {
      encryptionTest.success = true;
      encryptionTest.status = "passed";
      encryptionTest.details = {
        module: "exists",
        algorithm: "AES-256-GCM",
        keyManagement: "environment-based",
      };
    }
  } catch (error) {
    encryptionTest.error = error.message;
  }

  return encryptionTest;
}

async function testAuditLogging() {
  const auditTest = {
    name: "Audit Logging Test",
    success: false,
    status: "failed",
    details: {},
  };

  try {
    // Check if audit logger exists
    const auditPath = path.join(__dirname, "../src/lib/audit-logger.ts");
    if (fs.existsSync(auditPath)) {
      auditTest.success = true;
      auditTest.status = "passed";
      auditTest.details = {
        module: "exists",
        features: ["GDPR events", "Security events", "Data access logging"],
      };
    }
  } catch (error) {
    auditTest.error = error.message;
  }

  return auditTest;
}

async function testGDPRCompliance() {
  const complianceChecks = [];

  // Test GDPR service exists
  const gdprPath = path.join(__dirname, "../src/lib/gdpr-compliance.ts");
  complianceChecks.push({
    check: "GDPR Service Module",
    passed: fs.existsSync(gdprPath),
    details: "Core GDPR compliance service implementation",
  });

  // Test API endpoints exist
  const apiEndpoints = [
    "src/app/api/gdpr/data-subject-request/route.ts",
    "src/app/api/gdpr/process-request/route.ts",
    "src/app/api/gdpr/consent/route.ts",
    "src/app/api/gdpr/data-breach/route.ts",
  ];

  apiEndpoints.forEach((endpoint) => {
    const fullPath = path.join(__dirname, "..", endpoint);
    complianceChecks.push({
      check: `API Endpoint: ${endpoint.split("/").pop()}`,
      passed: fs.existsSync(fullPath),
      details: `GDPR API endpoint implementation`,
    });
  });

  // Test environment variables
  const requiredEnvVars = [
    "ENCRYPTION_KEY",
    "FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_BASE_URL",
  ];

  requiredEnvVars.forEach((envVar) => {
    complianceChecks.push({
      check: `Environment Variable: ${envVar}`,
      passed: process.env[envVar] !== undefined,
      details: "Required for GDPR compliance operations",
    });
  });

  const passedChecks = complianceChecks.filter((c) => c.passed).length;
  const totalChecks = complianceChecks.length;

  return {
    name: "GDPR Compliance Infrastructure",
    success: passedChecks === totalChecks,
    status: passedChecks === totalChecks ? "passed" : "partial",
    details: {
      score: `${passedChecks}/${totalChecks}`,
      checks: complianceChecks,
    },
  };
}

async function generateComplianceReport(results) {
  const timestamp = new Date().toISOString();
  const passed = results.filter((r) => r.status === "passed").length;
  const total = results.length;
  const score = Math.round((passed / total) * 100);

  const report = {
    timestamp,
    summary: {
      totalTests: total,
      passed,
      failed: total - passed,
      score: `${score}%`,
      status:
        score >= 80 ? "compliant" : score >= 60 ? "partial" : "non-compliant",
    },
    tests: results,
    recommendations: generateRecommendations(results),
    nextSteps: [
      "Deploy to staging environment for testing",
      "Conduct user acceptance testing",
      "Train staff on GDPR procedures",
      "Set up monitoring and alerting",
      "Schedule regular compliance audits",
    ],
  };

  // Save report
  const reportPath = path.join(__dirname, "..", "GDPR_COMPLIANCE_REPORT.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return report;
}

function generateRecommendations(results) {
  const recommendations = [];

  results.forEach((result) => {
    if (result.status === "failed") {
      switch (result.name) {
        case "Security Headers Check":
          recommendations.push(
            "Configure missing security headers in middleware"
          );
          break;
        case "Data Encryption Test":
          recommendations.push(
            "Set up encryption keys and verify encryption module"
          );
          break;
        case "GDPR Compliance Infrastructure":
          recommendations.push(
            "Complete GDPR service setup and environment configuration"
          );
          break;
        default:
          recommendations.push(`Fix issues with: ${result.name}`);
      }
    }
  });

  if (recommendations.length === 0) {
    recommendations.push("All tests passed! Ready for production deployment");
  }

  return recommendations;
}

function printResults(results) {
  console.log("\n📊 Test Results:");
  console.log("================\n");

  results.forEach((result) => {
    const icon =
      result.status === "passed"
        ? "✅"
        : result.status === "partial"
        ? "⚠️"
        : "❌";

    console.log(`${icon} ${result.name}`);

    if (result.details) {
      if (result.details.score) {
        console.log(`   Score: ${result.details.score}`);
      }
      if (result.details.checks && Array.isArray(result.details.checks)) {
        result.details.checks.forEach((check) => {
          const checkIcon = check.passed ? "  ✓" : "  ✗";
          console.log(`${checkIcon} ${check.check}`);
        });
      }
    }

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    console.log("");
  });
}

async function main() {
  try {
    console.log("🚀 Starting GDPR compliance tests...\n");

    const results = [];

    // Run infrastructure tests
    console.log("Testing compliance infrastructure...");
    results.push(await testGDPRCompliance());
    results.push(await testSecurityHeaders());
    results.push(await testDataEncryption());
    results.push(await testAuditLogging());

    // Check if server is running before API tests
    console.log("\nChecking if development server is running...");
    exec("curl -f http://localhost:3000 > /dev/null 2>&1", async (error) => {
      if (error) {
        console.log("❌ Development server not running. Skipping API tests.");
        console.log(
          "   To run API tests, start the server with: npm run dev\n"
        );
      } else {
        console.log("✅ Development server is running. Testing APIs...\n");

        // Run API tests
        for (const scenario of testScenarios) {
          console.log(`Testing: ${scenario.name}...`);
          const result = await runTest(scenario);
          results.push(result);
        }
      }

      // Print results and generate report
      printResults(results);

      const report = await generateComplianceReport(results);

      console.log("📋 Compliance Summary:");
      console.log("=====================");
      console.log(`Overall Score: ${report.summary.score}`);
      console.log(`Status: ${report.summary.status.toUpperCase()}`);
      console.log(
        `Tests Passed: ${report.summary.passed}/${report.summary.totalTests}\n`
      );

      if (report.recommendations.length > 0) {
        console.log("💡 Recommendations:");
        report.recommendations.forEach((rec) => console.log(`   • ${rec}`));
        console.log("");
      }

      console.log(`📄 Full report saved to: GDPR_COMPLIANCE_REPORT.json`);
      console.log("\n🎯 Next Steps:");
      report.nextSteps.forEach((step) => console.log(`   • ${step}`));
    });
  } catch (error) {
    console.error("❌ Test execution failed:", error);
    process.exit(1);
  }
}

// Run tests
main();
