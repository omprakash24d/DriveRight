// Development utility to check current user's claims
// You can run this in the browser console when logged in

async function checkCurrentUserClaims() {
  const { auth } = await import("./src/lib/firebase.js");
  const user = auth.currentUser;

  if (!user) {
    console.log("No user is currently logged in");
    return;
  }

  try {
    const tokenResult = await user.getIdTokenResult();
    console.log("Current user:", user.email);
    console.log("User ID:", user.uid);
    console.log("Custom claims:", tokenResult.claims);
    console.log("Is admin:", tokenResult.claims.admin === true);
  } catch (error) {
    console.error("Error getting user claims:", error);
  }
}

// Usage: checkCurrentUserClaims()
window.checkCurrentUserClaims = checkCurrentUserClaims;
