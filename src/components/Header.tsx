"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import type { SiteSettings } from "@/services/settingsService";
import { Car, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { NavItem } from "./NavItem";
import { ThemeToggle } from "./theme-toggle";
import { UserNav } from "./UserNav";

const navLinks = [
  { href: "/", label: "Home" },
  {
    label: "About",
    items: [
      { href: "/about", label: "About Us" },
      { href: "/instructors", label: "Our Instructors" },
    ],
  },
  {
    label: "Services",
    items: [
      { href: "/courses", label: "Our Courses" },
      { href: "/refresher", label: "Refresher Course" },
    ],
  },
  {
    label: "Check Status",
    items: [
      { href: "/results", label: "Results Lookup" },
      { href: "/ll-exam-pass", label: "LL Exam Pass" },
    ],
  },
  {
    label: "Downloads",
    items: [
      { href: "/certificate/download", label: "Certificate" },
      { href: "/license-print", label: "Driving License" },
    ],
  },
  { href: "/contact", label: "Contact" },
];

export function Header({ settings }: { settings: SiteSettings }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between container-padding">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Car className="h-6 w-6 text-primary" />
          <span>{settings.schoolName}</span>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((item) => (
              <NavItem
                key={item.label || item.href}
                item={item}
                isMobile={false}
              />
            ))}
          </nav>

          <ThemeToggle />

          {!isLoading && (
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <UserNav />
              ) : (
                <>
                  <Button asChild variant="ghost">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          )}

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader className="mb-6">
                <SheetTitle asChild>
                  <Link
                    href="/"
                    className="flex items-center gap-2 font-bold text-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Car className="h-6 w-6 text-primary" />
                    <span>{settings.schoolName}</span>
                  </Link>
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Main navigation for the website.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4">
                {navLinks.map((item) => (
                  <NavItem
                    key={item.label || item.href}
                    item={item}
                    isMobile={true}
                    closeSheet={() => setIsMobileMenuOpen(false)}
                  />
                ))}
                <hr className="my-4" />
                {!isLoading &&
                  (user ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-lg font-medium text-muted-foreground transition-colors hover:text-primary"
                      >
                        Dashboard
                      </Link>
                      <UserNav isMobile={true} />
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-lg font-medium text-muted-foreground transition-colors hover:text-primary"
                      >
                        Login
                      </Link>
                      <Button asChild>
                        <Link
                          href="/signup"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </Button>
                    </>
                  ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
