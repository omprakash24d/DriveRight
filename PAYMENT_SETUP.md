# Payment System Environment Configuration

## Required Environment Variables

Create or update your `.env.local` file with the following variables:

```bash
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id

# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Firebase Admin (if not already configured)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account-email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key\n-----END PRIVATE KEY-----\n"

# Next.js Configuration
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

## Razorpay Setup

1. **Create Razorpay Account**: Visit https://razorpay.com/
2. **Get API Keys**: Dashboard → Settings → API Keys
3. **Configure Webhooks**: Dashboard → Settings → Webhooks
   - Webhook URL: `https://yourdomain.com/api/services/payment/verify`
   - Events: `payment.captured`, `payment.failed`

## Email Configuration

### Gmail Setup

1. Enable 2-Factor Authentication
2. Generate App Password: Google Account → Security → App passwords
3. Use the generated password in `EMAIL_PASS`

### Other SMTP Providers

- **Outlook/Hotmail**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom SMTP**: Configure according to your provider

## Payment Flow Testing

### Test Cards (Razorpay Test Mode)

```
Card Number: 4111 1111 1111 1111
Expiry: Any future date
CVV: Any 3 digits
```

### UPI Testing

```
UPI ID: success@razorpay
```

## Production Deployment

### 1. Environment Variables

Update production environment with:

- Production Razorpay keys
- Production SMTP credentials
- Production Firebase config

### 2. Webhook Configuration

Configure webhook endpoint:

```
URL: https://yourdomain.com/api/services/payment/verify
Method: POST
Events: payment.captured, payment.failed, payment.authorized
```

### 3. SSL Certificate

Ensure your domain has valid SSL certificate for webhook security.

### 4. Firebase Security Rules

Update Firestore rules for production:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Enhanced services collections
    match /enhancedTrainingServices/{document} {
      allow read: if true;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == "admin";
    }

    match /enhancedOnlineServices/{document} {
      allow read: if true;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == "admin";
    }

    match /serviceBookings/{document} {
      allow read, write: if request.auth != null;
    }

    match /transactions/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Testing Checklist

- [ ] Environment variables configured
- [ ] Razorpay test keys working
- [ ] Email notifications sending
- [ ] Order creation successful
- [ ] Payment verification working
- [ ] Transaction recording in database
- [ ] Admin panel fare management
- [ ] Service booking flow complete

## Troubleshooting

### Common Issues

1. **Razorpay Key Errors**

   - Verify test/production keys
   - Check key format (no extra spaces)

2. **Email Not Sending**

   - Verify SMTP credentials
   - Check firewall/security settings
   - Enable "Less secure app access" if needed

3. **Database Permission Errors**

   - Update Firestore security rules
   - Verify service account permissions

4. **Webhook Failures**
   - Check SSL certificate
   - Verify webhook URL accessibility
   - Review webhook signature validation

### Logs and Monitoring

Check these locations for debugging:

- Browser console for client-side errors
- Server logs: `npm run dev` output
- Firebase console for database errors
- Razorpay dashboard for payment status

## Support

For technical support:

1. Check Razorpay documentation: https://razorpay.com/docs/
2. Firebase documentation: https://firebase.google.com/docs/
3. Next.js documentation: https://nextjs.org/docs/
