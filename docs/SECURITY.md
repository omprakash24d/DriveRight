# 🔒 Security Policy & Guidelines

## 🚨 Important Security Notice

This project contains sensitive configuration data. Follow these security guidelines strictly to protect your application and user data.

## 🔐 Environment Variables & Secrets

### ❌ NEVER Commit These Files:

- `.env*` files (except `.env.example`)
- `config/project-config.cjs` (actual config file)
- `firebase-adminsdk-*.json`
- Any files containing API keys, passwords, or private keys

### ✅ Safe to Commit:

- `.env.example` (template without real values)
- `config/project-config.example.cjs` (template without secrets)

## 🛡️ Sensitive Information Categories

### 🔴 Critical Secrets (NEVER expose)

- Firebase service account private keys
- Database connection strings
- API secret keys (Razorpay, Gemini, etc.)
- SMTP passwords
- JWT secrets
- Encryption keys

### 🟡 Semi-Public (Use with caution)

- Firebase public API keys
- Public analytics IDs
- Domain names
- Contact information

### 🟢 Public Information (Safe to expose)

- Business name and address
- Social media links
- Course information
- Public website content

## 🔧 Setup for New Developers

### 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/omprakash24d/Driving-School-Arwal.git
cd Driving-School-Arwal

# Copy environment template
cp .env.example .env

# Copy config template
cp config/project-config.example.cjs config/project-config.cjs
```

### 2. Configure Sensitive Values

- Update `.env` with your actual credentials
- Update `config/project-config.cjs` with your business details
- **NEVER** commit these files

### 3. Verify Security

```bash
# Check what files will be committed
git status

# Ensure no sensitive files are staged
git diff --cached
```

## 🚀 Production Deployment Security

### Environment Variables Setup

Set these securely in your hosting platform (Vercel/Firebase):

1. **Firebase Configuration**

   - Get from Firebase Console > Project Settings
   - Use environment variables, not hardcoded values

2. **API Keys**

   - Generate fresh keys for production
   - Use different keys for staging/production
   - Rotate keys regularly

3. **Database Security**
   - Enable Firestore security rules
   - Use Firebase Auth for user authentication
   - Implement role-based access control

### Security Checklist

- [ ] All `.env*` files (except .example) in `.gitignore`
- [ ] No hardcoded secrets in source code
- [ ] Different credentials for dev/staging/production
- [ ] Firebase security rules configured
- [ ] HTTPS enforced on production
- [ ] Regular security audits performed

## 🔍 Security Audit Commands

```bash
# Check for potentially exposed secrets
git log --oneline | head -20

# Scan for sensitive patterns in code
grep -r "password\|secret\|key" src/ --exclude-dir=node_modules

# Check npm vulnerabilities
npm audit

# Check for exposed files
git ls-files | grep -E "\.(env|key|pem)$"
```

## 🚨 If Secrets Are Accidentally Exposed

### Immediate Actions:

1. **Rotate all exposed credentials immediately**
2. **Remove the commit from history** (if possible)
3. **Update all environments** with new credentials
4. **Notify team members** about the incident

### Key Rotation Steps:

1. **Firebase**: Generate new service account key
2. **APIs**: Regenerate API keys (Google, Razorpay, etc.)
3. **Email**: Change Gmail app password
4. **Database**: Update connection strings

## 📧 Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email: security@drivingschoolarwal.in
3. Include detailed description and steps to reproduce
4. Allow reasonable time for fix before disclosure

## 🛡️ Security Best Practices

### For Developers:

- Use strong, unique passwords
- Enable 2FA on all accounts
- Keep dependencies updated
- Review code for security issues
- Use environment variables for all secrets

### For Infrastructure:

- Use HTTPS everywhere
- Implement rate limiting
- Monitor for unusual activity
- Regular backup and disaster recovery testing
- Keep servers and dependencies updated

## 📚 Additional Resources

- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/rules)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Git Secrets Prevention](https://github.com/awslabs/git-secrets)

---

**Remember: Security is everyone's responsibility. When in doubt, ask!**
