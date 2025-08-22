#!/usr/bin/env node

/**
 * Create Admin User Script
 *
 * This script creates an admin user account with proper Firebase authentication
 * and custom claims to access the admin panel features.
 */

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const admin = require("firebase-admin");
const path = require("path");

async function createAdminUser() {
  try {
    console.log("🚀 Starting admin user creation...");

    // Initialize Firebase Admin SDK with environment variables
    console.log("🔧 Loading Firebase service account from environment...");

    // Load service account from environment variable
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required"
      );
    }

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountKey);
    } catch (parseError) {
      throw new Error(
        "Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: " + parseError.message
      );
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    }

    console.log("✅ Firebase Admin SDK initialized successfully");

    const auth = admin.auth();
    const firestore = admin.firestore();

    // Admin user details
    const adminEmail = "admin@driveright.com";
    const adminPassword = "admin123456";
    const adminDisplayName = "DriveRight Admin";

    console.log(`📧 Creating admin user: ${adminEmail}`);

    let adminUser;

    try {
      // Try to get existing user first
      adminUser = await auth.getUserByEmail(adminEmail);
      console.log("👤 Admin user already exists, updating...");

      // Update existing user
      adminUser = await auth.updateUser(adminUser.uid, {
        password: adminPassword,
        displayName: adminDisplayName,
        emailVerified: true,
        disabled: false,
      });
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        // Create new user
        console.log("👤 Creating new admin user...");
        adminUser = await auth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: adminDisplayName,
          emailVerified: true,
          disabled: false,
        });
      } else {
        throw error;
      }
    }

    console.log(`✅ Admin user created/updated with UID: ${adminUser.uid}`);

    // Set custom claims for admin role
    console.log("🔐 Setting admin custom claims...");
    await auth.setCustomUserClaims(adminUser.uid, {
      admin: true,
      role: "admin",
      permissions: [
        "read",
        "write",
        "delete",
        "manage_users",
        "manage_settings",
      ],
    });

    console.log("✅ Admin custom claims set successfully");

    // Create admin profile in Firestore
    console.log("📄 Creating admin profile in Firestore...");
    const adminProfile = {
      uid: adminUser.uid,
      email: adminEmail,
      displayName: adminDisplayName,
      role: "admin",
      isAdmin: true,
      permissions: [
        "read",
        "write",
        "delete",
        "manage_users",
        "manage_settings",
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: null,
      isActive: true,
      profile: {
        firstName: "DriveRight",
        lastName: "Admin",
        phone: "+1234567890",
        department: "Administration",
      },
    };

    await firestore
      .collection("users")
      .doc(adminUser.uid)
      .set(adminProfile, { merge: true });
    console.log("✅ Admin profile created in Firestore");

    // Also create in admins collection for easy querying
    await firestore
      .collection("admins")
      .doc(adminUser.uid)
      .set(
        {
          ...adminProfile,
          adminLevel: "super",
          canManageUsers: true,
          canManageSettings: true,
          canViewAnalytics: true,
        },
        { merge: true }
      );

    console.log("✅ Admin record created in admins collection");

    console.log("\n🎉 ADMIN USER SETUP COMPLETE!");
    console.log("=" * 50);
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log(`🆔 UID: ${adminUser.uid}`);
    console.log("=" * 50);
    console.log("\n📋 NEXT STEPS:");
    console.log("1. Go to http://localhost:9002/admin/login");
    console.log(`2. Login with ${adminEmail} / ${adminPassword}`);
    console.log("3. Navigate to http://localhost:9002/admin/services");
    console.log('4. Look for the "Quick Setup" section');
    console.log('5. Click "Add Sample Services" or "Seed All Collections"');
    console.log(
      "\n✨ The Quick Setup section should now be visible after login!"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);

    if (error.code === "auth/project-not-found") {
      console.log("\n🔧 SETUP REQUIRED:");
      console.log(
        "Please ensure your Firebase project is properly configured."
      );
      console.log("Check your service account key or environment variables.");
    }

    if (error.code === "auth/insufficient-permission") {
      console.log("\n🔧 PERMISSION ERROR:");
      console.log("The service account needs Admin SDK access.");
      console.log(
        "Make sure your service account has the required permissions."
      );
    }

    process.exit(1);
  }
}

// Execute the script
createAdminUser();
