// Admin user creation script for development
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp, cert } = require("firebase-admin/app");

// Initialize Firebase Admin (you may need to adjust the config)
const app = initializeApp({
  projectId: "driveright-11b83", // Replace with your actual project ID
});

const auth = getAuth();
const db = getFirestore();

async function createAdminUser() {
  const adminEmail = "admin@om.com";
  const adminPassword = "admin123456"; // Change this password

  console.log("🔧 Creating admin user...");

  try {
    // Create user
    const userRecord = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: "Admin User",
      emailVerified: true,
    });

    console.log("✅ User created:", userRecord.uid);

    // Set admin custom claim
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });
    console.log("✅ Admin privileges granted");

    // Create admin profile in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      email: adminEmail,
      displayName: "Admin User",
      role: "admin",
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Admin profile created in Firestore");

    console.log("\n🎉 ADMIN USER CREATED SUCCESSFULLY!");
    console.log("=".repeat(50));
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log("=".repeat(50));
    console.log("\n📋 Next Steps:");
    console.log("1. Go to http://localhost:9002/admin/login");
    console.log(`2. Login with: ${adminEmail}`);
    console.log(`3. Password: ${adminPassword}`);
    console.log("4. You should now see the Quick Setup section!");
  } catch (error) {
    if (error.code === "auth/email-already-exists") {
      console.log("⚠️ User already exists, setting admin claims...");

      try {
        const user = await auth.getUserByEmail(adminEmail);
        await auth.setCustomUserClaims(user.uid, { admin: true });
        console.log("✅ Admin privileges updated");

        console.log("\n🎉 ADMIN USER READY!");
        console.log("=".repeat(50));
        console.log(`📧 Email: ${adminEmail}`);
        console.log(`🔑 Password: ${adminPassword}`);
        console.log("=".repeat(50));
      } catch (updateError) {
        console.error("❌ Failed to update admin claims:", updateError.message);
      }
    } else {
      console.error("❌ Error creating admin user:", error.message);
    }
  }
}

createAdminUser();
