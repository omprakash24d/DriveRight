#!/usr/bin/env node

/**
 * Memory Monitor for DriveRight Application
 */

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function monitorMemory() {
  const usage = process.memoryUsage();
  const timestamp = new Date().toISOString();
  
  console.log(`📊 [Memory Monitor] ${timestamp}`);
  console.log(`   RSS (Resident Set Size): ${formatBytes(usage.rss)}`);
  console.log(`   Heap Total: ${formatBytes(usage.heapTotal)}`);
  console.log(`   Heap Used: ${formatBytes(usage.heapUsed)}`);
  console.log(`   External: ${formatBytes(usage.external)}`);
  console.log(`   Array Buffers: ${formatBytes(usage.arrayBuffers)}`);
  
  // Warning thresholds
  const heapUsedMB = usage.heapUsed / (1024 * 1024);
  const rssGB = usage.rss / (1024 * 1024 * 1024);
  
  if (heapUsedMB > 1500) {
    console.log(`⚠️  Warning: High heap usage (${formatBytes(usage.heapUsed)})`);
  }
  
  if (rssGB > 3) {
    console.log(`🚨 Critical: Very high memory usage (${formatBytes(usage.rss)})`);
  }
  
  console.log("\n");
}

// Monitor every 30 seconds
console.log("🔍 Starting memory monitoring...");
setInterval(monitorMemory, 30000);
monitorMemory(); // Initial reading