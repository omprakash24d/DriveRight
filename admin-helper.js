/**
 * ADMIN LOGIN AND SETUP HELPER
 *
 * Run this script in browser console to help debug and fix admin access
 */

console.log("🔧 ADMIN ACCESS HELPER SCRIPT");
console.log("============================");

// Check current admin emails from environment
console.log("📧 Current admin emails from environment:");
console.log("- omprakash24d@gmail.com");
console.log("- admin@driveright.com");
console.log("- admin@om.com");
console.log("");

console.log("🎯 SOLUTION OPTIONS:");
console.log("");

console.log("📋 OPTION 1: Use existing admin email");
console.log("Try logging in with: omprakash24d@gmail.com");
console.log("(This email is already configured as admin)");
console.log("");

console.log("📋 OPTION 2: Login with admin@om.com");
console.log(
  "If you know the password for admin@om.com, try different passwords:"
);
console.log("- admin123456");
console.log("- 123456");
console.log("- password");
console.log("");

console.log("📋 OPTION 3: Create new admin user");
console.log("Go to signup page and create account with any of these emails:");
console.log("- admin@driveright.com (if not already taken)");
console.log("- Any email, then we can add it to admin list");
console.log("");

console.log("🔍 DEBUGGING CURRENT SITUATION:");

// Check if we're on a Firebase page
if (typeof window !== "undefined") {
  if (window.location.hostname === "localhost") {
    console.log("✅ On localhost - good");

    // Check current page
    const path = window.location.pathname;
    console.log(`📍 Current page: ${path}`);

    if (path.includes("/login")) {
      console.log("📋 NEXT STEPS FOR LOGIN PAGE:");
      console.log("1. Try: omprakash24d@gmail.com with your usual password");
      console.log("2. Try: admin@om.com with admin123456");
      console.log("3. If none work, go to signup page first");
    } else if (path.includes("/signup")) {
      console.log("📋 NEXT STEPS FOR SIGNUP PAGE:");
      console.log("1. Create account with admin@driveright.com / admin123456");
      console.log("2. Or create with any email you prefer");
    } else if (path.includes("/admin")) {
      console.log("📋 YOU'RE IN THE ADMIN AREA!");
      console.log("Navigate to /admin/services to see Quick Setup");
    }
  }
}

console.log("");
console.log("🚨 IMPORTANT: Server must be restarted after environment changes");
console.log("The dev server is now running with updated admin emails");
console.log("");
console.log("💡 RECOMMENDATION:");
console.log(
  "Try logging in with omprakash24d@gmail.com first - it's already admin"
);
