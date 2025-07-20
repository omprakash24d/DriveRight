// A centralized and validated configuration management file.

function getConfigValue(key: string, required = true): string {
    const value = process.env[key];
    if (required && !value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || "";
}

export const schoolConfig = {
  // Site Metadata
  name: getConfigValue('NEXT_PUBLIC_SCHOOL_NAME'),
  appBaseUrl: getConfigValue('NEXT_PUBLIC_APP_URL'),

  // Contact Info
  contactEmail: getConfigValue('NEXT_PUBLIC_CONTACT_EMAIL'),
  phone: getConfigValue('NEXT_PUBLIC_PHONE_NUMBER'),
  address: getConfigValue('NEXT_PUBLIC_ADDRESS'),
  whatsappNumber: getConfigValue('NEXT_PUBLIC_WHATSAPP_NUMBER'),
  
  // Firebase Client Config
  firebase: {
    apiKey: getConfigValue('NEXT_PUBLIC_FIREBASE_API_KEY'),
    authDomain: getConfigValue('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
    projectId: getConfigValue('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
    storageBucket: getConfigValue('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getConfigValue('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getConfigValue('NEXT_PUBLIC_FIREBASE_APP_ID'),
  },

  // Firebase Admin Config (Server-side)
  // This is a special case as it's a JSON string
  firebaseAdmin: {
    serviceAccountKey: getConfigValue('FIREBASE_SERVICE_ACCOUNT_KEY', process.env.NODE_ENV === 'production'),
  },

  // Genkit AI
  googleAi: {
    apiKey: getConfigValue('GOOGLE_API_KEY', process.env.NODE_ENV === 'production'),
  },

  // Google Maps
  googleMaps: {
    apiKey: getConfigValue('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', false), // Optional for now
  },

  // Nodemailer (Email Service)
  smtp: {
    user: getConfigValue('SMTP_USER'),
    pass: getConfigValue('SMTP_PASS'),
    from: getConfigValue('FROM_EMAIL'),
    to: getConfigValue('TO_EMAIL'),
  },
  
  // Admin Authorization
  adminEmails: getConfigValue('NEXT_PUBLIC_ADMIN_EMAILS').split(',').map(e => e.trim()),
  
  // Payment Gateway
  razorpay: {
      keyId: getConfigValue('NEXT_PUBLIC_RAZORPAY_KEY_ID'),
      keySecret: getConfigValue('RAZORPAY_KEY_SECRET', process.env.NODE_ENV === 'production'),
  },
  
  // Analytics
  googleAnalytics: {
      id: getConfigValue('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', false) // Optional
  },

  // Social Media Links (Optional)
  socials: {
    facebook: getConfigValue('NEXT_PUBLIC_FACEBOOK_URL', false),
    twitter: getConfigValue('NEXT_PUBLIC_TWITTER_URL', false),
    instagram: getConfigValue('NEXT_PUBLIC_INSTAGRAM_URL', false),
    github: getConfigValue('NEXT_PUBLIC_GITHUB_URL', false),
    linkedin: getConfigValue('NEXT_PUBLIC_LINKEDIN_URL', false),
  }
};
