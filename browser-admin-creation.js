/**
 * Browser-Based Admin User Creation Script
 *
 * Run this script in the browser console at http://localhost:9002/admin/login
 * to create an admin user account.
 *
 * Instructions:
 * 1. Open http://localhost:9002/admin/login in your browser
 * 2. Open the browser console (F12 -> Console tab)
 * 3. Copy and paste this entire script into the console
 * 4. Press Enter to execute
 * 5. Wait for the success message
 * 6. Login with admin@driveright.com / admin123456
 */

(async function createAdminUser() {
  try {
    console.log("🚀 Starting admin user creation...");

    // Check if we're on the right page and Firebase modules are available
    if (typeof window === "undefined") {
      console.error("❌ This script must be run in a browser environment.");
      return;
    }

    // Import Firebase modules - this works because they're loaded by the app
    let auth,
      db,
      createUserWithEmailAndPassword,
      signInWithEmailAndPassword,
      updateProfile,
      setDoc,
      doc,
      collection,
      serverTimestamp;

    try {
      // Access Firebase from the global window object (Next.js makes it available)
      const firebase = await import("/src/lib/firebase.js");
      auth = firebase.auth;
      db = firebase.db;

      const firebaseAuth = await import("firebase/auth");
      createUserWithEmailAndPassword =
        firebaseAuth.createUserWithEmailAndPassword;
      signInWithEmailAndPassword = firebaseAuth.signInWithEmailAndPassword;
      updateProfile = firebaseAuth.updateProfile;

      const firestore = await import("firebase/firestore");
      setDoc = firestore.setDoc;
      doc = firestore.doc;
      collection = firestore.collection;
      serverTimestamp = firestore.serverTimestamp;

      console.log("✅ Firebase modules loaded successfully");
    } catch (moduleError) {
      console.error("❌ Failed to load Firebase modules:", moduleError);
      console.log(
        "🔧 Make sure you are on the admin login page where Firebase is initialized."
      );
      return;
    }

    // Admin user details
    const adminEmail = "admin@driveright.com";
    const adminPassword = "admin123456";
    const adminDisplayName = "DriveRight Admin";

    console.log(`📧 Creating admin user: ${adminEmail}`);

    try {
      // Create new user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        adminEmail,
        adminPassword
      );
      const user = userCredential.user;

      console.log(`✅ Admin user created with UID: ${user.uid}`);

      // Update user profile
      await updateProfile(user, {
        displayName: adminDisplayName,
      });

      console.log("✅ User profile updated");

      // Create admin profile in Firestore
      console.log("📄 Creating admin profile in Firestore...");
      const adminProfile = {
        uid: user.uid,
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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: null,
        isActive: true,
        profile: {
          firstName: "DriveRight",
          lastName: "Admin",
          phone: "+1234567890",
          department: "Administration",
        },
      };

      await setDoc(doc(db, "users", user.uid), adminProfile);
      console.log("✅ Admin profile created in Firestore");

      // Also create in admins collection
      await setDoc(doc(db, "admins", user.uid), {
        ...adminProfile,
        adminLevel: "super",
        canManageUsers: true,
        canManageSettings: true,
        canViewAnalytics: true,
      });

      console.log("✅ Admin record created in admins collection");

      console.log("\n🎉 ADMIN USER SETUP COMPLETE!");
      console.log("=" + "=".repeat(49));
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log(`🆔 UID: ${user.uid}`);
      console.log("=" + "=".repeat(49));
      console.log("\n📋 NEXT STEPS:");
      console.log("1. Refresh this page");
      console.log("2. Login with the credentials above");
      console.log("3. Navigate to http://localhost:9002/admin/services");
      console.log('4. Look for the "Quick Setup" section');
      console.log('5. Click "Add Sample Services" or "Seed All Collections"');
      console.log(
        "\n✨ The Quick Setup section should now be visible after login!"
      );
    } catch (authError) {
      if (authError.code === "auth/email-already-in-use") {
        console.log("👤 Admin user already exists. Attempting to sign in...");

        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            adminEmail,
            adminPassword
          );
          const user = userCredential.user;

          console.log(`✅ Successfully signed in with UID: ${user.uid}`);

          // Update/create profile in case it's missing
          const adminProfile = {
            uid: user.uid,
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
            updatedAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            isActive: true,
            profile: {
              firstName: "DriveRight",
              lastName: "Admin",
              phone: "+1234567890",
              department: "Administration",
            },
          };

          await setDoc(doc(db, "users", user.uid), adminProfile, {
            merge: true,
          });
          await setDoc(
            doc(db, "admins", user.uid),
            {
              ...adminProfile,
              adminLevel: "super",
              canManageUsers: true,
              canManageSettings: true,
              canViewAnalytics: true,
            },
            { merge: true }
          );

          console.log("✅ Admin profile updated in Firestore");
          console.log("\n🎉 ADMIN LOGIN SUCCESSFUL!");
          console.log(
            "📋 Go to http://localhost:9002/admin/services to see the Quick Setup section"
          );
        } catch (signInError) {
          console.error(
            "❌ Error signing in existing user:",
            signInError.message
          );
          console.log("\n🔧 MANUAL SOLUTION:");
          console.log("Try logging in manually with:");
          console.log(`📧 Email: ${adminEmail}`);
          console.log(`🔑 Password: ${adminPassword}`);
        }
      } else {
        console.error("❌ Error creating admin user:", authError.message);
        console.log("\n🔧 TROUBLESHOOTING:");
        console.log(
          "1. Make sure Firebase Authentication is enabled in your project"
        );
        console.log("2. Check that email/password authentication is enabled");
        console.log("3. Try refreshing the page and running the script again");
      }
    }
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    console.log("\n🔧 TROUBLESHOOTING:");
    console.log("1. Make sure you are on http://localhost:9002/admin/login");
    console.log("2. Refresh the page and try again");
    console.log("3. Check that Firebase is properly loaded");
    console.log("4. Make sure the dev server is running");
  }
})();

console.log(`
🎯 ADMIN USER CREATION SCRIPT LOADED
====================================

This script will create an admin user with:
📧 Email: admin@driveright.com  
🔑 Password: admin123456

The script is now running automatically...
`);
