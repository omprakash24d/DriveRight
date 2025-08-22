/**
 * Simple Admin User Creation Script for Browser Console
 *
 * Instructions:
 * 1. Open http://localhost:9002/signup in your browser
 * 2. Open browser console (F12 -> Console)
 * 3. Paste and run this script
 * 4. Then go to admin login and use the credentials
 */

// Auto-fill the signup form and submit it
console.log("🚀 Creating admin user via signup form...");

// Fill the form fields
const emailInput =
  document.querySelector('input[name="email"]') ||
  document.querySelector('input[type="email"]');
const passwordInput =
  document.querySelector('input[name="password"]') ||
  document.querySelector('input[type="password"]');
const firstNameInput = document.querySelector('input[name="firstName"]');
const lastNameInput = document.querySelector('input[name="lastName"]');
const phoneInput = document.querySelector('input[name="phone"]');

if (emailInput && passwordInput) {
  emailInput.value = "admin@driveright.com";
  passwordInput.value = "admin123456";

  if (firstNameInput) firstNameInput.value = "DriveRight";
  if (lastNameInput) lastNameInput.value = "Admin";
  if (phoneInput) phoneInput.value = "+1234567890";

  // Trigger change events
  [
    emailInput,
    passwordInput,
    firstNameInput,
    lastNameInput,
    phoneInput,
  ].forEach((input) => {
    if (input) {
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  console.log("✅ Form filled with admin credentials");
  console.log("📧 Email: admin@driveright.com");
  console.log("🔑 Password: admin123456");
  console.log("");
  console.log("📋 NEXT STEPS:");
  console.log('1. Click the "Sign Up" button below');
  console.log("2. Wait for successful registration");
  console.log("3. Go to http://localhost:9002/admin/login");
  console.log("4. Login with admin@driveright.com / admin123456");
  console.log("5. Navigate to http://localhost:9002/admin/services");
  console.log('6. Look for the "Quick Setup" section');
} else {
  console.error("❌ Could not find signup form fields");
  console.log(
    "Make sure you are on the signup page: http://localhost:9002/signup"
  );
}
