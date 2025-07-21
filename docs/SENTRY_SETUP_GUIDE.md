# 🚀 Sentry Setup Guide for DriveRight

## 📋 Quick Checklist

- [ ] Create Sentry account
- [ ] Create Next.js project in Sentry
- [ ] Get DSN from project settings
- [ ] Update `.env.local` file
- [ ] Test the configuration
- [ ] Deploy to production

---

## 🎯 Step-by-Step Setup

### **1. Create Sentry Account & Project**

1. **Sign up**: Go to https://sentry.io/signup/
2. **Create Organization**:
   - Organization name: `CUSB` (or your preferred name)
3. **Create Project**:
   - Platform: **Next.js**
   - Project name: `DriveRight`
   - Alert settings: Default (can change later)

### **2. Get Your Configuration Values**

After creating the project, you'll see a setup page with code snippets. Look for:

#### **A. DSN (Required)**

```
https://abc123def@o456789.ingest.sentry.io/123456
```

**Where to find**: Project Settings → Client Keys (DSN)

#### **B. Organization Slug**

Look at your Sentry URL: `https://sentry.io/organizations/[YOUR-ORG-SLUG]/`

#### **C. Auth Token (Optional - for source maps)**

1. Go to: User Settings → Auth Tokens
2. Click "Create New Token"
3. Name: `DriveRight Production`
4. Scopes: `org:read`, `project:read`, `project:releases`

### **3. Update Your Environment File**

Edit `p:\test\DriveRight\.env.local` and replace:

```bash
# Replace this line:
NEXT_PUBLIC_SENTRY_DSN=https://your-actual-dsn@your-org.ingest.sentry.io/your-project-id

# With your actual DSN:
NEXT_PUBLIC_SENTRY_DSN=https://abc123def@o456789.ingest.sentry.io/123456

# Replace this line:
SENTRY_ORG=your-org-slug

# With your organization slug:
SENTRY_ORG=cusb

# Replace this line (optional):
SENTRY_AUTH_TOKEN=your-auth-token-here

# With your actual token:
SENTRY_AUTH_TOKEN=sntryu_abc123def456...
```

### **4. Validate Configuration**

Run the validation script:

```bash
node scripts/validate-sentry.js
```

You should see all ✅ green checkmarks.

### **5. Test Your Setup**

1. **Start development server**:

   ```bash
   npm run dev
   ```

2. **Test error tracking** by adding this to any page temporarily:

   ```javascript
   // Add this button to test Sentry
   <button
     onClick={() => {
       throw new Error("Test Sentry Error");
     }}
   >
     Test Sentry
   </button>
   ```

3. **Check Sentry dashboard** - you should see the error appear within minutes.

---

## 🔧 Configuration Examples

### **Minimal Setup (Development)**

```bash
# Only DSN is required
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.ingest.io/project-id
```

### **Full Setup (Production)**

```bash
# Complete configuration with all features
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.ingest.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=DriveRight
SENTRY_AUTH_TOKEN=your-token
SENTRY_ENVIRONMENT=production
```

---

## 🚀 Production Deployment

### **Environment Variables for Vercel/Netlify**

Add these to your deployment platform:

```bash
NEXT_PUBLIC_SENTRY_DSN=your-production-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=DriveRight
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ENVIRONMENT=production
```

### **Different Environments**

Create separate Sentry projects for different environments:

- **Development**: `DriveRight-dev`
- **Staging**: `DriveRight-staging`
- **Production**: `DriveRight-prod`

---

## 📊 What You'll Get

### **Error Tracking**

- ✅ Automatic error capture
- ✅ Stack traces with source maps
- ✅ User context and session replay
- ✅ Performance monitoring

### **Alerts & Notifications**

- 📧 Email notifications for new errors
- 📱 Slack/Discord integrations
- 📈 Weekly error reports

### **Analytics**

- 🔍 Error frequency and trends
- 👥 User impact analysis
- ⚡ Performance bottlenecks
- 🎯 Release tracking

---

## 🆘 Troubleshooting

### **Common Issues**

1. **"Sentry not capturing errors"**

   - Check DSN is correct
   - Verify environment variables are loaded
   - Check browser console for Sentry initialization

2. **"Source maps not working"**

   - Ensure `SENTRY_AUTH_TOKEN` is set
   - Check token has correct scopes
   - Verify `SENTRY_ORG` and `SENTRY_PROJECT` match

3. **"Too many events"**
   - Adjust sample rates in Sentry config files
   - Set up error filtering

### **Validation Commands**

```bash
# Check environment variables
node scripts/validate-sentry.js

# Test build with Sentry
npm run build

# Check Sentry initialization
npm run dev
# Look for "Sentry initialized" in console
```

---

## 🔗 Helpful Resources

- **Sentry Dashboard**: https://sentry.io
- **Next.js Integration**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Performance Monitoring**: https://docs.sentry.io/product/performance/
- **Release Tracking**: https://docs.sentry.io/product/releases/

---

## ✅ Final Checklist

Before deploying to production:

- [ ] Sentry account created and project configured
- [ ] All environment variables set correctly
- [ ] `node scripts/validate-sentry.js` passes
- [ ] Test error captured successfully
- [ ] Performance monitoring enabled
- [ ] Team members have access to Sentry project
- [ ] Alert rules configured
- [ ] Source maps uploading (if using auth token)

---

**🎉 Congratulations!** Your DriveRight application now has enterprise-grade error tracking and monitoring!
