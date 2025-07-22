// scripts/check-redis.js - Check if Redis is available
async function checkRedis() {
  try {
    // Try to import ioredis
    const { Redis } = await import("ioredis");

    if (process.env.REDIS_URL) {
      console.log("✅ Redis module found");
      console.log("✅ REDIS_URL environment variable set");

      try {
        const redis = new Redis(process.env.REDIS_URL);
        await redis.ping();
        console.log("✅ Redis connection successful");
        await redis.disconnect();
      } catch (error) {
        console.log("❌ Redis connection failed:", error.message);
      }
    } else {
      console.log("✅ Redis module found");
      console.log("⚠️  REDIS_URL environment variable not set");
      console.log("💡 Set REDIS_URL=redis://localhost:6379 for local Redis");
    }
  } catch (error) {
    console.log("ℹ️  Redis module not installed (optional for production)");
    console.log("💡 Install with: npm install ioredis");
    console.log("📝 Application will use memory cache fallback");
  }
}

checkRedis()
  .then(() => {
    console.log("\n🎯 Cache system status check complete");
  })
  .catch(console.error);
