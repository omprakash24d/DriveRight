// Quick script to check current services and their pricing
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function checkServices() {
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log("🔍 Checking training services...");
    const trainingSnapshot = await getDocs(collection(db, "trainingServices"));
    console.log(`Found ${trainingSnapshot.size} training services:`);

    trainingSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`- ${doc.id}: ${data.title}`);
      console.log(`  Pricing:`, data.pricing);
      console.log(`  Active: ${data.isActive}`);
      console.log("---");
    });

    console.log("\n🔍 Checking online services...");
    const onlineSnapshot = await getDocs(collection(db, "onlineServices"));
    console.log(`Found ${onlineSnapshot.size} online services:`);

    onlineSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`- ${doc.id}: ${data.title}`);
      console.log(`  Pricing:`, data.pricing);
      console.log(`  Active: ${data.isActive}`);
      console.log("---");
    });
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

checkServices();
