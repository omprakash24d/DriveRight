// scripts/backup-system.cjs - Comprehensive Backup & Restore System
const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");

/**
 * Driving School Arwal Production Backup & Restore System
 *
 * Features:
 * - Automated daily/weekly/monthly backups
 * - Firestore database backups
 * - Firebase Storage backups
 * - Application code backups
 * - Point-in-time recovery
 * - Disaster recovery procedures
 */

class BackupSystem {
  constructor() {
    this.config = {
      projectId: process.env.FIREBASE_PROJECT_ID || "drivingschoolarwal-prod",
      backupBucket: process.env.BACKUP_BUCKET || "drivingschoolarwal-backups",
      retentionPolicies: {
        daily: 30, // Keep daily backups for 30 days
        weekly: 12, // Keep weekly backups for 12 weeks
        monthly: 12, // Keep monthly backups for 12 months
      },
      compressionLevel: 6,
      encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
    };

    this.backupDir = path.join(process.cwd(), "backups");
    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    // Create subdirectories
    ["firestore", "storage", "application", "logs"].forEach((dir) => {
      const dirPath = path.join(this.backupDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  // Generate timestamp for backup files
  getTimestamp() {
    return (
      new Date().toISOString().replace(/[:.]/g, "-").split("T")[0] +
      "_" +
      new Date().toISOString().replace(/[:.]/g, "-").split("T")[1].slice(0, -5)
    );
  }

  // Firestore Database Backup
  async backupFirestore(type = "daily") {
    console.log(`\n🔄 Starting Firestore ${type} backup...`);

    const timestamp = this.getTimestamp();
    const backupName = `firestore-${type}-${timestamp}`;

    try {
      // Export Firestore data
      const exportCommand = `gcloud firestore export gs://${this.config.backupBucket}/firestore/${backupName} --project=${this.config.projectId}`;

      console.log("📤 Exporting Firestore data...");
      execSync(exportCommand, { stdio: "inherit" });

      // Create local backup metadata
      const metadata = {
        type,
        timestamp: new Date().toISOString(),
        backupName,
        collections: await this.getCollectionsList(),
        size: await this.calculateBackupSize(backupName),
        retention: this.calculateRetentionDate(type),
      };

      fs.writeFileSync(
        path.join(this.backupDir, "firestore", `${backupName}.metadata.json`),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`✅ Firestore backup completed: ${backupName}`);
      return backupName;
    } catch (error) {
      console.error(`❌ Firestore backup failed:`, error);
      throw error;
    }
  }

  // Firebase Storage Backup
  async backupStorage(type = "daily") {
    console.log(`\n🔄 Starting Storage ${type} backup...`);

    const timestamp = this.getTimestamp();
    const backupName = `storage-${type}-${timestamp}`;
    const localBackupPath = path.join(this.backupDir, "storage", backupName);

    try {
      // Create local backup directory
      fs.mkdirSync(localBackupPath, { recursive: true });

      // Download all storage files
      const downloadCommand = `gsutil -m cp -r gs://${this.config.projectId}.appspot.com/* ${localBackupPath}/`;
      console.log("📦 Downloading storage files...");
      execSync(downloadCommand, { stdio: "inherit" });

      // Compress backup
      const archivePath = `${localBackupPath}.tar.gz`;
      console.log("🗜️ Compressing backup...");
      execSync(
        `tar -czf ${archivePath} -C ${path.dirname(
          localBackupPath
        )} ${path.basename(localBackupPath)}`,
        { stdio: "inherit" }
      );

      // Upload compressed backup to backup bucket
      const uploadCommand = `gsutil cp ${archivePath} gs://${this.config.backupBucket}/storage/`;
      console.log("☁️ Uploading to backup bucket...");
      execSync(uploadCommand, { stdio: "inherit" });

      // Clean up local files
      execSync(`rm -rf ${localBackupPath}`, { stdio: "inherit" });

      // Create metadata
      const metadata = {
        type,
        timestamp: new Date().toISOString(),
        backupName,
        archivePath: `gs://${this.config.backupBucket}/storage/${path.basename(
          archivePath
        )}`,
        retention: this.calculateRetentionDate(type),
      };

      fs.writeFileSync(
        path.join(this.backupDir, "storage", `${backupName}.metadata.json`),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`✅ Storage backup completed: ${backupName}`);
      return backupName;
    } catch (error) {
      console.error(`❌ Storage backup failed:`, error);
      throw error;
    }
  }

  // Application Code Backup
  async backupApplication(type = "daily") {
    console.log(`\n🔄 Starting Application ${type} backup...`);

    const timestamp = this.getTimestamp();
    const backupName = `application-${type}-${timestamp}`;
    const archivePath = path.join(
      this.backupDir,
      "application",
      `${backupName}.tar.gz`
    );

    try {
      // Get current git commit
      const gitCommit = execSync("git rev-parse HEAD", {
        encoding: "utf8",
      }).trim();
      const gitBranch = execSync("git rev-parse --abbrev-ref HEAD", {
        encoding: "utf8",
      }).trim();

      // Create application archive (excluding node_modules, .next, etc.)
      console.log("📦 Creating application archive...");
      const tarCommand = `tar -czf ${archivePath} --exclude=node_modules --exclude=.next --exclude=.git --exclude=backups --exclude=logs -C ${process.cwd()} .`;
      execSync(tarCommand, { stdio: "inherit" });

      // Upload to backup bucket
      const uploadCommand = `gsutil cp ${archivePath} gs://${this.config.backupBucket}/application/`;
      console.log("☁️ Uploading to backup bucket...");
      execSync(uploadCommand, { stdio: "inherit" });

      // Create metadata
      const metadata = {
        type,
        timestamp: new Date().toISOString(),
        backupName,
        gitCommit,
        gitBranch,
        archivePath: `gs://${
          this.config.backupBucket
        }/application/${path.basename(archivePath)}`,
        retention: this.calculateRetentionDate(type),
      };

      fs.writeFileSync(
        path.join(this.backupDir, "application", `${backupName}.metadata.json`),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`✅ Application backup completed: ${backupName}`);
      return backupName;
    } catch (error) {
      console.error(`❌ Application backup failed:`, error);
      throw error;
    }
  }

  // Full System Backup
  async performFullBackup(type = "daily") {
    console.log(`\n🚀 Starting Full System ${type.toUpperCase()} Backup`);
    console.log(`📅 ${new Date().toISOString()}`);
    console.log("=".repeat(50));

    const results = {
      timestamp: new Date().toISOString(),
      type,
      backups: {},
      duration: 0,
      success: true,
      errors: [],
    };

    const startTime = Date.now();

    try {
      // Backup Firestore
      results.backups.firestore = await this.backupFirestore(type);

      // Backup Storage
      results.backups.storage = await this.backupStorage(type);

      // Backup Application
      results.backups.application = await this.backupApplication(type);

      results.duration = Date.now() - startTime;

      console.log("\n🎉 Full backup completed successfully!");
      console.log(`⏱️ Total duration: ${Math.round(results.duration / 1000)}s`);
    } catch (error) {
      results.success = false;
      results.errors.push(error.message);
      console.error("\n❌ Backup failed:", error);
    }

    // Save backup report
    const reportPath = path.join(
      this.backupDir,
      "logs",
      `backup-${type}-${this.getTimestamp()}.json`
    );
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

    return results;
  }

  // Restore from backup
  async restoreFromBackup(backupName, component = "all") {
    console.log(`\n🔄 Starting restore: ${backupName} (${component})`);

    try {
      if (component === "all" || component === "firestore") {
        await this.restoreFirestore(backupName);
      }

      if (component === "all" || component === "storage") {
        await this.restoreStorage(backupName);
      }

      if (component === "all" || component === "application") {
        await this.restoreApplication(backupName);
      }

      console.log("✅ Restore completed successfully!");
    } catch (error) {
      console.error("❌ Restore failed:", error);
      throw error;
    }
  }

  // Restore Firestore
  async restoreFirestore(backupName) {
    console.log("🔄 Restoring Firestore...");

    const importCommand = `gcloud firestore import gs://${this.config.backupBucket}/firestore/${backupName} --project=${this.config.projectId}`;
    execSync(importCommand, { stdio: "inherit" });

    console.log("✅ Firestore restored");
  }

  // Restore Storage
  async restoreStorage(backupName) {
    console.log("🔄 Restoring Storage...");

    // Download backup
    const tempDir = path.join(this.backupDir, "temp-restore");
    fs.mkdirSync(tempDir, { recursive: true });

    const downloadCommand = `gsutil cp gs://${this.config.backupBucket}/storage/${backupName}.tar.gz ${tempDir}/`;
    execSync(downloadCommand, { stdio: "inherit" });

    // Extract
    execSync(`tar -xzf ${tempDir}/${backupName}.tar.gz -C ${tempDir}`, {
      stdio: "inherit",
    });

    // Upload to storage bucket
    const uploadCommand = `gsutil -m cp -r ${tempDir}/${backupName}/* gs://${this.config.projectId}.appspot.com/`;
    execSync(uploadCommand, { stdio: "inherit" });

    // Cleanup
    execSync(`rm -rf ${tempDir}`, { stdio: "inherit" });

    console.log("✅ Storage restored");
  }

  // Restore Application
  async restoreApplication(backupName) {
    console.log("🔄 Restoring Application...");

    const tempDir = path.join(this.backupDir, "temp-app-restore");
    fs.mkdirSync(tempDir, { recursive: true });

    // Download backup
    const downloadCommand = `gsutil cp gs://${this.config.backupBucket}/application/${backupName}.tar.gz ${tempDir}/`;
    execSync(downloadCommand, { stdio: "inherit" });

    // Extract
    execSync(`tar -xzf ${tempDir}/${backupName}.tar.gz -C ${tempDir}`, {
      stdio: "inherit",
    });

    console.log("⚠️ Application backup downloaded to:", tempDir);
    console.log(
      "⚠️ Manual review and deployment required for application restore"
    );

    console.log("✅ Application backup ready for manual deployment");
  }

  // Cleanup old backups based on retention policy
  async cleanupOldBackups() {
    console.log("\n🧹 Cleaning up old backups...");

    try {
      for (const [type, retentionDays] of Object.entries(
        this.config.retentionPolicies
      )) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        // Clean up cloud backups
        const cleanupCommand = `gsutil -m rm gs://${
          this.config.backupBucket
        }/**/*${type}*$(date -d "${cutoffDate.toISOString()}" +%Y-%m-%d)*`;
        try {
          execSync(cleanupCommand, { stdio: "inherit" });
        } catch (error) {
          // No files to delete or error - continue
        }
      }

      console.log("✅ Cleanup completed");
    } catch (error) {
      console.error("❌ Cleanup failed:", error);
    }
  }

  // Helper methods
  calculateRetentionDate(type) {
    const date = new Date();
    date.setDate(date.getDate() + this.config.retentionPolicies[type]);
    return date.toISOString();
  }

  async getCollectionsList() {
    try {
      const listCommand = `gcloud firestore operations list --project=${this.config.projectId} --format="value(name)" --limit=1`;
      return [
        "students",
        "enrollments",
        "courses",
        "instructors",
        "certificates",
      ]; // Default collections
    } catch (error) {
      return ["unknown"];
    }
  }

  async calculateBackupSize(backupName) {
    try {
      const sizeCommand = `gsutil du -s gs://${this.config.backupBucket}/firestore/${backupName}`;
      const output = execSync(sizeCommand, { encoding: "utf8" });
      return output.split(" ")[0] + " bytes";
    } catch (error) {
      return "unknown";
    }
  }

  // List available backups
  listBackups() {
    console.log("\n📋 Available Backups:");

    ["firestore", "storage", "application"].forEach((component) => {
      const componentDir = path.join(this.backupDir, component);
      if (fs.existsSync(componentDir)) {
        const files = fs
          .readdirSync(componentDir)
          .filter((file) => file.endsWith(".metadata.json"))
          .sort()
          .reverse();

        console.log(`\n${component.toUpperCase()}:`);
        files.slice(0, 10).forEach((file) => {
          const metadata = JSON.parse(
            fs.readFileSync(path.join(componentDir, file), "utf8")
          );
          console.log(`  - ${metadata.backupName} (${metadata.timestamp})`);
        });
      }
    });
  }
}

// CLI Interface
async function main() {
  const backup = new BackupSystem();
  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  switch (command) {
    case "full":
      await backup.performFullBackup(arg1 || "manual");
      break;

    case "firestore":
      await backup.backupFirestore(arg1 || "manual");
      break;

    case "storage":
      await backup.backupStorage(arg1 || "manual");
      break;

    case "application":
      await backup.backupApplication(arg1 || "manual");
      break;

    case "restore":
      if (!arg1) {
        console.error("❌ Backup name required for restore");
        process.exit(1);
      }
      await backup.restoreFromBackup(arg1, arg2);
      break;

    case "cleanup":
      await backup.cleanupOldBackups();
      break;

    case "list":
      backup.listBackups();
      break;

    default:
      console.log(`
Driving School Arwal Backup System

Usage:
  node scripts/backup-system.cjs <command> [options]

Commands:
  full [type]                 - Perform full system backup (daily/weekly/monthly)
  firestore [type]           - Backup Firestore database only
  storage [type]             - Backup Firebase Storage only  
  application [type]         - Backup application code only
  restore <backup-name> [component] - Restore from backup
  cleanup                    - Clean up old backups
  list                       - List available backups

Examples:
  node scripts/backup-system.cjs full daily
  node scripts/backup-system.cjs restore firestore-daily-2024-01-15_10-30-00
  node scripts/backup-system.cjs cleanup
      `);
      break;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Backup system error:", error);
    process.exit(1);
  });
}

module.exports = BackupSystem;
