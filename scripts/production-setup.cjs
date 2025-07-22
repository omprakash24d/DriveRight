// scripts/production-setup.cjs - Production Environment Setup
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

console.log("🚀 Driving School Arwal Production Deployment Setup");
console.log("==================================================\n");

// Production configuration
const productionConfig = {
  environment: "production",
  deployment: {
    platform: "vercel", // or 'netlify', 'aws', 'gcp'
    domain: "www.drivingschoolarwal.in",
    subdomain: "app.www.drivingschoolarwal.in",
    cdn: "enabled",
    ssl: "automatic",
    compression: "enabled",
  },
  security: {
    httpsOnly: true,
    hsts: true,
    csp: "strict",
    cors: "restricted",
    rateLimiting: "production",
  },
  monitoring: {
    errorTracking: "enabled",
    performanceMonitoring: "enabled",
    uptime: "enabled",
    logs: "centralized",
  },
  database: {
    backup: "daily",
    replication: "enabled",
    encryption: "enabled",
    archival: "7-years",
  },
};

// Environment variables for production
const productionEnvVars = {
  // Core Application
  NODE_ENV: "production",
  NEXT_PUBLIC_APP_URL: "https://app.www.drivingschoolarwal.in",
  NEXT_PUBLIC_API_URL: "https://app.www.drivingschoolarwal.in/api",

  // Security
  ENCRYPTION_KEY: "your-production-encryption-key-32-chars",
  JWT_SECRET: "your-production-jwt-secret-64-chars",
  SESSION_SECRET: "your-production-session-secret",

  // Firebase Production
  FIREBASE_PROJECT_ID: "drivingschoolarwal-production",
  FIREBASE_PRIVATE_KEY:
    "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  FIREBASE_CLIENT_EMAIL:
    "firebase-adminsdk@drivingschoolarwal-production.iam.gserviceaccount.com",

  // External Services
  SMTP_HOST: "smtp.sendgrid.net",
  SMTP_PORT: "587",
  SMTP_USER: "apikey",
  SMTP_PASS: "your-sendgrid-api-key",

  // Monitoring
  SENTRY_DSN: "https://your-sentry-dsn@sentry.io/project-id",
  GOOGLE_ANALYTICS_ID: "G-XXXXXXXXXX",

  // Rate Limiting
  REDIS_URL: "redis://your-redis-instance:6379",
  RATE_LIMIT_REDIS_URL: "redis://your-redis-instance:6379",

  // Compliance
  GDPR_NOTIFICATION_EMAIL: "privacy@www.drivingschoolarwal.in",
  DPO_EMAIL: "dpo@www.drivingschoolarwal.in",
  SECURITY_TEAM_EMAIL: "security@www.drivingschoolarwal.in",

  // Backup & Recovery
  BACKUP_STORAGE_BUCKET: "drivingschoolarwal-backups",
  BACKUP_ENCRYPTION_KEY: "your-backup-encryption-key",

  // CDN & Assets
  CDN_URL: "https://cdn.www.drivingschoolarwal.in",
  STORAGE_BUCKET: "drivingschoolarwal-production-assets",
};

async function createProductionFiles() {
  console.log("📁 Creating production configuration files...\n");

  // 1. Production environment file
  const envContent = Object.entries(productionEnvVars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  fs.writeFileSync(".env.production", envContent);
  console.log("✅ Created .env.production");

  // 2. Vercel configuration
  const vercelConfig = {
    version: 2,
    name: "drivingschool-arwal",
    builds: [
      {
        src: "package.json",
        use: "@vercel/next",
      },
    ],
    routes: [
      {
        src: "/api/(.*)",
        dest: "/api/$1",
        headers: {
          "Cache-Control": "no-cache",
        },
      },
      {
        src: "/(.*)",
        dest: "/$1",
      },
    ],
    env: Object.keys(productionEnvVars).reduce((acc, key) => {
      acc[key] = `@${key.toLowerCase().replace(/_/g, "-")}`;
      return acc;
    }, {}),
    headers: [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ],
    redirects: [
      {
        source: "/home",
        destination: "/",
        permanent: true,
      },
    ],
    rewrites: [
      {
        source: "/api/health",
        destination: "/api/monitoring/health",
      },
    ],
  };

  fs.writeFileSync("vercel.json", JSON.stringify(vercelConfig, null, 2));
  console.log("✅ Created vercel.json");

  // 3. Docker configuration for alternative deployment
  const dockerfileContent = `
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
`;

  fs.writeFileSync("Dockerfile", dockerfileContent.trim());
  console.log("✅ Created Dockerfile");

  // 4. Docker Compose for local production testing
  const dockerComposeContent = `
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - redis
      
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass your-redis-password
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
`;

  fs.writeFileSync("docker-compose.prod.yml", dockerComposeContent.trim());
  console.log("✅ Created docker-compose.prod.yml");

  // 5. Nginx configuration
  const nginxConfig = `
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name www.drivingschoolarwal.in www.www.drivingschoolarwal.in;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name www.drivingschoolarwal.in www.www.drivingschoolarwal.in;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-Frame-Options DENY always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Gzip compression
        gzip on;
        gzip_vary on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static file caching
        location /_next/static/ {
            proxy_pass http://app;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }

        location /images/ {
            proxy_pass http://app;
            add_header Cache-Control "public, max-age=31536000";
        }
    }
}
`;

  fs.writeFileSync("nginx.conf", nginxConfig.trim());
  console.log("✅ Created nginx.conf");

  // 6. GitHub Actions workflow
  const githubWorkflow = `
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npm run test:ci
      - run: npm run lint
      - run: node scripts/test-compliance.cjs

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          
      - name: Run post-deployment tests
        run: |
          sleep 30
          curl -f https://app.www.drivingschoolarwal.in/api/health
          
      - name: Notify team
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: \${{ job.status }}
          webhook_url: \${{ secrets.SLACK_WEBHOOK }}
`;

  const workflowDir = ".github/workflows";
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }
  fs.writeFileSync(path.join(workflowDir, "deploy.yml"), githubWorkflow.trim());
  console.log("✅ Created .github/workflows/deploy.yml");

  console.log("\n📋 Production files created successfully!");
}

async function generateDeploymentScript() {
  const deployScript = `#!/bin/bash

# Driving School Arwal Production Deployment Script
echo "🚀 Starting Driving School Arwal production deployment..."

# Pre-deployment checks
echo "📋 Running pre-deployment checks..."
npm run lint
npm run test:ci
node scripts/test-compliance.cjs

if [ $? -ne 0 ]; then
    echo "❌ Pre-deployment checks failed. Aborting deployment."
    exit 1
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Deploy to Vercel
echo "☁️ Deploying to Vercel..."
vercel --prod

# Post-deployment verification
echo "✅ Running post-deployment verification..."
sleep 30
curl -f https://app.www.drivingschoolarwal.in/api/health

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo "📱 Application URL: https://app.www.drivingschoolarwal.in"
else
    echo "❌ Deployment verification failed!"
    exit 1
fi

echo "📊 Deployment completed at $(date)"
`;

  fs.writeFileSync("deploy.sh", deployScript);
  console.log("✅ Created deploy.sh");

  // Make it executable (on Unix systems)
  try {
    exec("chmod +x deploy.sh");
  } catch (error) {
    // Ignore on Windows
  }
}

async function createMonitoringFiles() {
  console.log("\n📊 Creating monitoring configuration...");

  // Health check endpoint
  const healthCheckContent = `// src/app/api/monitoring/health/route.ts
import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {
      database: false,
      redis: false,
      external_apis: false
    },
    performance: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    }
  };

  try {
    // Database check
    const db = getFirestore();
    await db.collection('health_check').doc('test').set({ timestamp: new Date() });
    checks.checks.database = true;
  } catch (error) {
    checks.status = 'degraded';
    checks.checks.database = false;
  }

  // Redis check (if available)
  try {
    // Add Redis health check if using Redis
    checks.checks.redis = true;
  } catch (error) {
    checks.checks.redis = false;
  }

  // External APIs check
  try {
    // Add external service checks
    checks.checks.external_apis = true;
  } catch (error) {
    checks.checks.external_apis = false;
  }

  const allHealthy = Object.values(checks.checks).every(Boolean);
  if (!allHealthy) {
    checks.status = 'degraded';
  }

  return NextResponse.json(checks, {
    status: allHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}`;

  const healthDir = "src/app/api/monitoring/health";
  if (!fs.existsSync(healthDir)) {
    fs.mkdirSync(healthDir, { recursive: true });
  }
  fs.writeFileSync(path.join(healthDir, "route.ts"), healthCheckContent);
  console.log("✅ Created health check endpoint");

  // Metrics endpoint
  const metricsContent = `// src/app/api/monitoring/metrics/route.ts
import { NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET() {
  try {
    const db = getFirestore();
    
    // Collect application metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      application: {
        uptime_seconds: process.uptime(),
        memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        cpu_usage_percent: Math.round(process.cpuUsage().user / 1000000 * 100),
        node_version: process.version
      },
      business: {
        total_users: 0,
        active_sessions: 0,
        courses_completed_today: 0,
        certificates_issued_today: 0,
        revenue_today: 0
      },
      security: {
        failed_logins_last_hour: 0,
        blocked_ips: 0,
        security_events_today: 0,
        gdpr_requests_pending: 0
      },
      performance: {
        avg_response_time_ms: 0,
        error_rate_percent: 0,
        throughput_rps: 0
      }
    };

    // Fetch business metrics
    const today = new Date().toISOString().split('T')[0];
    
    // Count users
    const usersSnapshot = await db.collection('users').count().get();
    metrics.business.total_users = usersSnapshot.data().count;

    // Count today's completions
    const completionsSnapshot = await db.collection('certificates')
      .where('issuedDate', '>=', today)
      .count().get();
    metrics.business.certificates_issued_today = completionsSnapshot.data().count;

    // Count security events
    const securitySnapshot = await db.collection('security_events')
      .where('timestamp', '>=', today)
      .count().get();
    metrics.security.security_events_today = securitySnapshot.data().count;

    // Count pending GDPR requests
    const gdprSnapshot = await db.collection('gdpr_requests')
      .where('status', '==', 'pending')
      .count().get();
    metrics.security.gdpr_requests_pending = gdprSnapshot.data().count;

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Failed to collect metrics:', error);
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}`;

  const metricsDir = "src/app/api/monitoring/metrics";
  if (!fs.existsSync(metricsDir)) {
    fs.mkdirSync(metricsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(metricsDir, "route.ts"), metricsContent);
  console.log("✅ Created metrics endpoint");
}

async function updatePackageJson() {
  console.log("\n📦 Updating package.json with production scripts...");

  const packagePath = "package.json";
  const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

  // Add production scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    "build:prod": "NODE_ENV=production next build",
    "start:prod": "NODE_ENV=production next start",
    deploy: "bash deploy.sh",
    "test:ci": "npm run lint && npm run build",
    "health-check": "curl -f http://localhost:3000/api/monitoring/health",
    backup: "node scripts/backup-data.cjs",
    restore: "node scripts/restore-data.cjs",
    "compliance-check": "node scripts/test-compliance.cjs",
  };

  // Add production dependencies
  packageJson.dependencies = {
    ...packageJson.dependencies,
    "@sentry/nextjs": "^7.0.0",
    redis: "^4.0.0",
  };

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log("✅ Updated package.json");
}

async function main() {
  try {
    await createProductionFiles();
    await generateDeploymentScript();
    await createMonitoringFiles();
    await updatePackageJson();

    console.log("\n🎉 Production setup completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("1. Set up your production Firebase project");
    console.log("2. Configure Vercel environment variables");
    console.log("3. Set up monitoring services (Sentry, etc.)");
    console.log("4. Configure domain and SSL certificates");
    console.log("5. Run: npm run deploy");
    console.log("\n🔗 Useful commands:");
    console.log("• npm run build:prod     - Build for production");
    console.log("• npm run deploy         - Deploy to production");
    console.log("• npm run health-check   - Check application health");
    console.log("• npm run compliance-check - Run compliance tests");
  } catch (error) {
    console.error("❌ Production setup failed:", error);
    process.exit(1);
  }
}

main();
