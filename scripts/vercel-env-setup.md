# 🚀 Vercel Environment Variables Setup

## **Step 1: Login to Vercel and Create Project**

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (run this in your project directory)
vercel link
```

## **Step 2: Set Environment Variables via Vercel CLI**

Copy and run these commands to set all environment variables:

### **Core Application Variables**

```bash
vercel env add NODE_ENV production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_API_URL production
```

### **Business Information (Public)**

```bash
vercel env add NEXT_PUBLIC_SCHOOL_NAME production
vercel env add NEXT_PUBLIC_CONTACT_EMAIL production
vercel env add NEXT_PUBLIC_PHONE production
vercel env add NEXT_PUBLIC_WHATSAPP_NUMBER production
vercel env add NEXT_PUBLIC_ADDRESS production
vercel env add NEXT_PUBLIC_ADMIN_EMAILS production
```

### **Social Media Links**

```bash
vercel env add NEXT_PUBLIC_FACEBOOK_URL production
vercel env add NEXT_PUBLIC_TWITTER_URL production
vercel env add NEXT_PUBLIC_GITHUB_URL production
vercel env add NEXT_PUBLIC_INSTAGRAM_URL production
```

### **Firebase Configuration (Public)**

```bash
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
```

### **Firebase Admin (Sensitive)**

```bash
vercel env add FIREBASE_SERVICE_ACCOUNT_KEY production
```

### **Email Configuration**

```bash
vercel env add SMTP_HOST production
vercel env add SMTP_PORT production
vercel env add SMTP_USER production
vercel env add SMTP_PASS production
vercel env add FROM_EMAIL production
vercel env add TO_EMAIL production
```

### **Payment Gateway**

```bash
vercel env add RAZORPAY_KEY_ID production
vercel env add RAZORPAY_KEY_SECRET production
```

### **External Services**

```bash
vercel env add GEMINI_API_KEY production
```

### **Analytics & Monitoring**

```bash
vercel env add NEXT_PUBLIC_GOOGLE_ANALYTICS_ID production
```

### **Sentry Configuration**

```bash
vercel env add NEXT_PUBLIC_SENTRY_DSN production
vercel env add SENTRY_ORG production
vercel env add SENTRY_PROJECT production
vercel env add SENTRY_AUTH_TOKEN production
vercel env add SENTRY_RELEASE production
```

### **Security & Infrastructure**

```bash
vercel env add ENCRYPTION_KEY production
vercel env add JWT_SECRET production
vercel env add SESSION_SECRET production
vercel env add RATE_LIMIT_REDIS_URL production
vercel env add BACKUP_STORAGE_BUCKET production
vercel env add BACKUP_ENCRYPTION_KEY production
vercel env add CDN_URL production
vercel env add METRICS_UPDATE_TOKEN production
```

### **Compliance**

```bash
vercel env add GDPR_NOTIFICATION_EMAIL production
vercel env add DPO_EMAIL production
vercel env add SECURITY_TEAM_EMAIL production
```

## **Step 3: Automated Setup Script**

Run this command to set all variables at once:

```bash
node scripts/setup-vercel-env.js
```

## **Step 4: Verify Environment Variables**

```bash
# List all environment variables
vercel env ls

# Pull environment variables to local
vercel env pull .env.local
```

## **Step 5: Production URLs to Update**

When you get your Vercel deployment URL, update these:

- `NEXT_PUBLIC_APP_URL`: Your production domain
- `NEXT_PUBLIC_API_URL`: Your production domain + `/api`
- Firebase Auth Domain: Add your production domain to Firebase
- Sentry: Update project settings with production domain
