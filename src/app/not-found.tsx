"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Home, Mail, MapPin, Phone, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  const popularLinks = [
    { href: "/services", label: "Our Services" },
    { href: "/training", label: "Driving Training" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-screen">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* 404 Visual */}
          <div className="relative">
            <div className="text-[150px] sm:text-[200px] font-bold text-gray-200 dark:text-gray-700 leading-none select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Route Not Found
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
              Looks like you&apos;ve taken a wrong turn! The page you&apos;re looking for
              doesn&apos;t exist, but don&apos;t worry – we&apos;ll help you get back on track.
            </p>
          </div>

          {/* Search Box */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for services, training, or help..."
                className="pl-10 pr-4 py-3 text-center"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const query = (e.target as HTMLInputElement).value;
                    if (query.trim()) {
                      window.location.href = `/?search=${encodeURIComponent(
                        query
                      )}`;
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="min-w-[160px]">
              <Link href="/">
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-w-[160px]"
            >
              <Link href="javascript:history.back()">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Go Back
              </Link>
            </Button>
          </div>

          {/* Popular Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Popular Pages
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {popularLinks.map((link) => (
                <Button
                  key={link.href}
                  asChild
                  variant="ghost"
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:bg-blue-50 dark:hover:bg-gray-800"
                >
                  <Link href={link.href}>
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>

          {/* Help Section */}
          <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Still need help? Get in touch with us:
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 text-sm">
              <a
                href="tel:+1234567890"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Phone className="w-4 h-4" />
                Call Support
              </a>
              <a
                href="mailto:support@driveright.com"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <Mail className="w-4 h-4" />
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
