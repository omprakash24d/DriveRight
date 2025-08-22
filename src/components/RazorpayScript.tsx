// Razorpay Script Component for Payment Integration
"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function RazorpayScript() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're on the client side
    if (typeof window === "undefined") return;

    // Check if Razorpay script is already loaded
    if (window.Razorpay) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      'script[src*="checkout.razorpay.com"]'
    );
    if (existingScript) {
      setIsLoading(true);
      return;
    }

    // Load the script
    setIsLoading(true);
    setError(null);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.defer = true;

    const handleLoad = () => {
      setIsLoaded(true);
      setIsLoading(false);
      setError(null);
    };

    const handleError = () => {
      const errorMsg = "Failed to load Razorpay script";
      console.error(errorMsg);
      setError(errorMsg);
      setIsLoading(false);
      setIsLoaded(false);
    };

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    try {
      document.head.appendChild(script);
    } catch (err) {
      handleError();
    }

    // Cleanup function
    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);

      // Only remove if it's still in the document and we added it
      if (document.head.contains(script)) {
        try {
          document.head.removeChild(script);
        } catch (err) {
          console.warn("Failed to remove Razorpay script:", err);
        }
      }
    };
  }, []);

  // Expose loading state for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      (window as any).__razorpay_script_status = {
        isLoaded,
        isLoading,
        error,
        available: !!window.Razorpay,
      };
    }
  }, [isLoaded, isLoading, error]);

  return null; // This component doesn't render anything
}
