/**
 * Script to set admin claims for a user
 * Run with: node scripts/set-admin-claim.js <user-email>
 *
 * Make sure to have your Firebase Admin SDK credentials set up
 * Either through GOOGLE_APPLICATION_CREDENTIALS environment variable
 * or through the firebase-admin initialization in your project
 */

const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    // Try to use the service account file if it exists
    const serviceAccountPath = path.join(
      __dirname,
      "..",
      "serviceAccountKey.json"
    );
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error) {
    // Fallback to default credentials
    admin.initializeApp();
  }
}

async function setAdminClaim(email) {
  try {
    // Get user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`Found user: ${userRecord.email} (${userRecord.uid})`);

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    console.log(`Successfully set admin claim for ${email}`);
    console.log(
      "The user will need to sign out and sign back in for the claim to take effect."
    );
  } catch (error) {
    console.error("Error setting admin claim:", error.message);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error("Usage: node set-admin-claim.js <user-email>");
  process.exit(1);
}

setAdminClaim(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
