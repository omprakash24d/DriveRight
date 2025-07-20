
import Link from "next/link";
import { getSiteSettings } from "@/services/settingsService";
import { Car, Facebook, Github, Twitter, Instagram, Linkedin } from "lucide-react";
import { CurrentYear } from "./CurrentYear";

export async function Footer() {
  const settings = await getSiteSettings();

  const socialLinkConfig = [
    {
      envVar: process.env.NEXT_PUBLIC_FACEBOOK_URL,
      label: "Facebook page",
      icon: <Facebook className="w-5 h-5" />
    },
    {
      envVar: process.env.NEXT_PUBLIC_TWITTER_URL,
      label: "Twitter page",
      icon: <Twitter className="w-5 h-5" />
    },
    {
      envVar: process.env.NEXT_PUBLIC_GITHUB_URL,
      label: "Github page",
      icon: <Github className="w-5 h-5" />
    },
    {
      envVar: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
      label: "Instagram page",
      icon: <Instagram className="w-5 h-5" />
    },
    {
      envVar: process.env.NEXT_PUBLIC_LINKEDIN_URL,
      label: "LinkedIn page",
      icon: <Linkedin className="w-5 h-5" />
    },
  ];

  const socialLinks = socialLinkConfig
    .filter(link => link.envVar && link.envVar !== '#')
    .map(link => ({
      href: link.envVar!,
      label: link.label,
      icon: link.icon
    }));

  return (
    <footer className="bg-secondary/30 dark:bg-card border-t">
        <div className="mx-auto w-full max-w-screen-xl p-4 py-6 lg:py-8">
            <div className="md:flex md:justify-between">
                <div className="mb-6 md:mb-0">
                    <Link href="/" className="flex items-center gap-3">
                        <Car className="h-8 w-8 text-primary" />
                        <span className="self-center text-2xl font-bold text-foreground">{settings.schoolName}</span>
                    </Link>
                    <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                        Your journey to safe and skilled driving starts here.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-4">
                    <div>
                        <h2 className="mb-6 text-sm font-semibold text-foreground uppercase">Our School</h2>
                        <ul className="text-muted-foreground font-medium">
                            <li className="mb-4"><Link href="/about" className="hover:underline">About Us</Link></li>
                            <li className="mb-4"><Link href="/courses" className="hover:underline">Courses</Link></li>
                            <li className="mb-4"><Link href="/contact" className="hover:underline">Contact</Link></li>
                        </ul>
                    </div>
                     <div>
                        <h2 className="mb-6 text-sm font-semibold text-foreground uppercase">Student Portal</h2>
                        <ul className="text-muted-foreground font-medium">
                            <li className="mb-4"><Link href="/login" className="hover:underline">Login</Link></li>
                            <li className="mb-4"><Link href="/signup" className="hover:underline">Sign Up</Link></li>
                            <li className="mb-4"><Link href="/dashboard" className="hover:underline">Dashboard</Link></li>
                             <li className="mb-4"><Link href="/enroll" className="hover:underline">Enroll Now</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="mb-6 text-sm font-semibold text-foreground uppercase">Online Services</h2>
                        <ul className="text-muted-foreground font-medium">
                            <li className="mb-4"><Link href="/results" className="hover:underline">Results Lookup</Link></li>
                            <li className="mb-4"><Link href="/ll-exam-pass" className="hover:underline">LL Exam Pass Info</Link></li>
                            <li className="mb-4"><Link href="/license-print" className="hover:underline">DL Print Request</Link></li>
                            <li className="mb-4"><Link href="/certificate/download" className="hover:underline">Certificate Download</Link></li>
                            <li className="mb-4"><Link href="/certificate/verify" className="hover:underline">Verify Certificate</Link></li>
                        </ul>
                    </div>
                     <div>
                        <h2 className="mb-6 text-sm font-semibold text-foreground uppercase">Legal</h2>
                        <ul className="text-muted-foreground font-medium">
                             <li className="mb-4"><Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link></li>
                             <li className="mb-4"><Link href="/terms-of-service" className="hover:underline">Terms of Service</Link></li>
                             <li className="mb-4"><Link href="/disclaimer" className="hover:underline">Disclaimer</Link></li>
                             <li className="mb-4"><Link href="/returns-and-refunds" className="hover:underline">Return & Refund Policy</Link></li>
                        </ul>
                    </div>
                </div>
            </div>
            <hr className="my-6 border-border sm:mx-auto lg:my-8" />
            <div className="sm:flex sm:items-center sm:justify-between">
                <span className="text-sm text-muted-foreground text-center sm:text-left">
                    © <CurrentYear /> <Link href="/" className="hover:underline">{settings.schoolName}™</Link>. All Rights Reserved.
                </span>
                <div className="flex mt-4 space-x-5 justify-center sm:mt-0">
                    {socialLinks.map((social, index) => (
                         <Link key={index} href={social.href} className="text-muted-foreground hover:text-primary" aria-label={social.label}>
                            {social.icon}
                            <span className="sr-only">{social.label}</span>
                         </Link>
                    ))}
                </div>
            </div>
        </div>
    </footer>
  );
}
