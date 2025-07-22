# DriveRight - Production Deployment Guide

## 🚀 Production Checklist

### Prerequisites

- [ ] Node.js 18+ installed
- [ ] Firebase project created with Blaze plan
- [ ] Domain name registered and DNS configured
- [ ] SSL certificate (handled by hosting provider)
- [ ] Email service credentials (SMTP)

## 📋 Environment Setup

### Required Environment Variables

Create `.env.production` with:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin (Server-side)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=noreply@yourdrivingschool.com

# Application URLs
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your_nextauth_secret

# Optional: Performance
REDIS_URL=redis://your_redis_instance

# Security
ENCRYPTION_KEY=your_32_character_encryption_key
```

## 🔐 Security Configuration

### 1. Firebase Security Rules

Deploy production Firestore rules:

```bash
firebase deploy --only firestore:rules --project your-project-id
```

### 2. Storage Rules

Deploy storage rules:

```bash
firebase deploy --only storage --project your-project-id
```

### 3. Rate Limiting

The application includes built-in rate limiting:

- Enrollment: 3 attempts per 15 minutes
- Contact forms: 2 submissions per 5 minutes
- Login attempts: 5 per 15 minutes
- General API: 60 requests per minute

## 📊 Monitoring & Health Checks

### Health Check Endpoint

- URL: `https://yourdomain.com/api/health`
- Returns: System status, database connectivity, storage status

### Performance Monitoring

- Built-in metrics collection
- Request/response time tracking
- Error rate monitoring
- Memory usage tracking

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**

   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Configure Environment Variables**

   - Add all production environment variables in Vercel dashboard
   - Enable automatic deployments from main branch

3. **Custom Domain Setup**
   - Add domain in Vercel dashboard
   - Configure DNS records as instructed

### Option 2: Netlify

1. **Build Configuration**

   ```toml
   # netlify.toml
   [build]
     command = "npm run build"
     publish = ".next"

   [functions]
     node_bundler = "esbuild"
   ```

2. **Deploy**
   ```bash
   npm run build
   netlify deploy --prod --dir=.next
   ```

### Option 3: Self-Hosted (VPS/Cloud)

1. **Server Setup**

   ```bash
   # Install Node.js and PM2
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   npm install -g pm2

   # Clone and setup
   git clone your-repository
   cd DriveRight
   npm install --production
   npm run build
   ```

2. **PM2 Configuration**

   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [
       {
         name: "driveright",
         script: "npm",
         args: "start",
         instances: "max",
         exec_mode: "cluster",
         env_production: {
           NODE_ENV: "production",
           PORT: 3000,
         },
       },
     ],
   };
   ```

3. **Start Application**

   ```bash
   pm2 start ecosystem.config.js --env production
   pm2 save
   pm2 startup
   ```

4. **Nginx Configuration**

   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl;
       server_name yourdomain.com;

       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## 📧 Email Configuration

### Gmail Setup

1. Enable 2-factor authentication
2. Generate app-specific password
3. Use app password in EMAIL_PASS environment variable

### Alternative Email Providers

- **SendGrid**: Professional email service with analytics
- **Amazon SES**: Cost-effective for high volume
- **Mailgun**: Developer-friendly email API

## 🔍 Testing Production

### Pre-deployment Testing

```bash
# Run production build locally
npm run build
npm start

# Test critical paths
curl https://localhost:3000/api/health
```

### Post-deployment Verification

- [ ] Health check endpoint responds correctly
- [ ] User registration/login works
- [ ] Enrollment form submission works
- [ ] Email notifications are sent
- [ ] File uploads function properly
- [ ] Certificate generation works
- [ ] Admin dashboard accessible

## 📈 Performance Optimization

### Image Optimization

- Use Next.js Image component for automatic optimization
- Configure CDN for static assets
- Implement lazy loading for images

### Caching Strategy

- Enable Redis for production caching
- Configure appropriate cache headers
- Use service worker for offline capability

### Database Optimization

- Implement compound indexes for complex queries
- Use Firestore security rules for client-side filtering
- Enable Firebase Extensions for additional functionality

## 🔧 Maintenance

### Regular Tasks

- Monitor health check endpoint
- Review error logs weekly
- Update dependencies monthly
- Backup Firestore data regularly
- Review and rotate API keys quarterly

### Scaling Considerations

- Monitor Firebase usage and billing
- Consider Firebase Functions for heavy computations
- Implement database sharding for large datasets
- Use CDN for global content delivery

## 🚨 Disaster Recovery

### Backup Strategy

- Automated Firestore backups (Firebase console)
- Version control for codebase
- Environment variable backup in secure location
- Regular database exports

### Recovery Procedures

1. Code deployment rollback via hosting provider
2. Database restoration from backups
3. DNS failover to maintenance page if needed
4. Communication plan for users during downtime

## 📞 Support & Maintenance

### Monitoring Alerts

Set up alerts for:

- Application errors (>5% error rate)
- High response times (>2 seconds)
- Storage usage (>80% capacity)
- Failed email deliveries

### Log Management

- Centralized logging with structured format
- Log retention policy (90 days recommended)
- Alert on critical errors
- Regular log analysis for optimization opportunities

---

## 🎯 Go-Live Checklist

- [ ] All environment variables configured
- [ ] Firebase rules deployed
- [ ] SSL certificate installed
- [ ] DNS records configured
- [ ] Email service tested
- [ ] Backup procedures verified
- [ ] Monitoring alerts configured
- [ ] Performance testing completed
- [ ] Security audit completed
- [ ] User acceptance testing passed

**🎉 Your DriveRight application is now production-ready!**
