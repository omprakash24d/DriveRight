// Browser Console Seeding Script
// Copy and paste this into your browser console at http://localhost:9002/admin/services

async function seedAllData() {
  console.log("🌱 Starting seeding from browser console...");

  try {
    // Get the auth token from localStorage or session
    const authData = localStorage.getItem(
      "firebase:authUser:AIzaSyAWm5qT1K5w8OvLj8o_bDFJKEgNtdZQ1JE:[DEFAULT]"
    );

    if (!authData) {
      console.error("❌ Not authenticated. Please sign in first.");
      return;
    }

    const user = JSON.parse(authData);
    const token = user.accessToken;

    console.log("✅ Found auth token, proceeding with seeding...");

    const response = await fetch("/api/admin/seed", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "seed-all",
        force: false,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("✅ SEEDING SUCCESSFUL!");
      console.log("📊 Results:", data.data);
      console.log("💡 Refresh the page to see your new services!");

      // Auto-refresh the page
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      console.error("❌ Seeding failed:", data.error);
    }
  } catch (error) {
    console.error("❌ Error during seeding:", error);
  }
}

// Instructions
console.log("🔧 DriveRight Sample Data Seeder");
console.log("================================");
console.log("");
console.log("📋 Instructions:");
console.log("1. Make sure you are signed in as admin");
console.log("2. Type: seedAllData()");
console.log("3. Press Enter");
console.log("");
console.log("💰 This will add services with your exact pricing:");
console.log("   • LMV Training: ₹6,000");
console.log("   • HMV Training: ₹11,000");
console.log("   • MCWG Training: ₹5,000");
console.log("   • Refresher Course: ₹3,500");
console.log("   • DL Printout: ₹450");
console.log("   • License Download: ₹0 (Free)");
console.log("");
console.log("▶️ Ready to run: seedAllData()");
