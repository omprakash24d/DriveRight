
import type { Metadata } from "next";
import { Inter, Dancing_Script } from "next/font/google";
import "./globals.css";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { Footer } from "@/components/Footer";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Chatbot } from "@/components/Chatbot";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteWrapper } from "@/components/SiteWrapper";
import { getSiteSettings } from "@/services/settingsService";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-cursive",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const schoolName = settings.schoolName;
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';


  return {
    metadataBase: new URL(appBaseUrl),
    title: {
      default: `${schoolName} - Your Path to Safe Driving in Arwal, Bihar`,
      template: `%s | ${schoolName}`,
    },
    description: `Join ${schoolName}, the leading driving school in Arwal, Bihar. We offer professional lessons for cars (LMV), motorcycles (MCWG), and heavy vehicles (HMV). Enroll online today!`,
    keywords: ['driving school Arwal', 'driving school Bihar', 'learn to drive', 'driving lessons', 'driving license Arwal', 'LMV training', 'MCWG training', 'HMV training', 'refresher course', schoolName],
    authors: [{ name: schoolName, url: appBaseUrl }],
    creator: schoolName,
    openGraph: {
        title: `${schoolName} - Professional Driving School`,
        description: `Your journey to safe and skilled driving starts here. Enroll online, check results, and get on the road safely with ${schoolName}.`,
        url: appBaseUrl,
        siteName: schoolName,
        images: [
          {
            url: `${appBaseUrl}/images/1.jpeg`,
            width: 1200,
            height: 630,
            alt: `A student learning to drive with an instructor at ${schoolName}`,
          },
        ],
        locale: 'en_IN',
        type: 'website',
    },
     twitter: {
        card: 'summary_large_image',
        title: `${schoolName} - Professional Driving School`,
        description: 'Learn to drive with the best instructors in Arwal, Bihar. Offering LMV, MCWG, and HMV courses.',
        images: [`${appBaseUrl}/images/1.jpeg`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DrivingSchool',
    name: settings.schoolName,
    address: {
        '@type': 'PostalAddress',
        streetAddress: settings.address,
        addressLocality: 'Arwal',
        addressRegion: 'Bihar',
        postalCode: '804401',
        addressCountry: 'IN'
    },
    contactPoint: {
        '@type': 'ContactPoint',
        telephone: settings.phone,
        contactType: 'Customer Service',
        email: settings.contactEmail,
    },
    telephone: settings.phone,
    email: settings.contactEmail,
    url: appBaseUrl,
    logo: `${appBaseUrl}/images/logo.jpg`,
    image: `${appBaseUrl}/images/1.jpeg`,
    description: `Professional driving school offering HMV, LMV, and motorcycle training courses in ${settings.address}.`,
    hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Driving Courses',
        itemListElement: [
            { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'HMV Training' } },
            { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'LMV Training' } },
            { '@type': 'Offer', 'itemOffered': { '@type': 'Service', name: 'Motorcycle Training' } }
        ]
    },
    sameAs: [
      process.env.NEXT_PUBLIC_FACEBOOK_URL,
      process.env.NEXT_PUBLIC_TWITTER_URL,
      process.env.NEXT_PUBLIC_INSTAGRAM_URL
    ].filter(Boolean),
  };

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
         <link rel="preload" href={inter.style.fontFamily} as="font" type="font/woff2" crossOrigin="anonymous" />
         <link rel="preload" href={dancingScript.style.fontFamily} as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased",
          inter.variable,
          dancingScript.variable
        )}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <SiteWrapper 
              header={<HeaderWrapper settings={settings} />} 
              footer={<Footer />}
            >
              {children}
            </SiteWrapper>
            <Toaster />
            <Chatbot />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
