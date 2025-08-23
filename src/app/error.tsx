"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Enhanced error logging
    console.error("Application Error:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Optional: Send to error reporting service
    // errorReportingService.captureException(error);
  }, [error]);

  const handleGoHome = () => {
    router.push("/");
  };

  const getErrorDetails = () => {
    // Categorize different types of errors
    if (
      error.message.includes("ChunkLoadError") ||
      error.message.includes("Loading chunk")
    ) {
      return {
        title: "Loading Issue",
        description:
          "There was a problem loading the page. This usually happens when the app has been updated. Please refresh to get the latest version.",
        suggestion: "refresh",
      };
    }

    if (error.message.includes("Network") || error.message.includes("fetch")) {
      return {
        title: "Connection Problem",
        description:
          "We're having trouble connecting to our servers. Please check your internet connection and try again.",
        suggestion: "retry",
      };
    }

    return {
      title: "Something Went Wrong",
      description:
        "An unexpected error occurred. Our team has been notified and is working to fix this issue.",
      suggestion: "general",
    };
  };

  const errorDetails = getErrorDetails();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Error Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>

        {/* Error Content */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {errorDetails.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {errorDetails.description}
          </p>
        </div>

        {/* Error Code (if available) */}
        {error.digest && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Error ID: {error.digest}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={reset} className="w-full" size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>

          <Button
            onClick={handleGoHome}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>

        {/* Additional Help */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Still having trouble?{" "}
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              Refresh the page
            </button>{" "}
            or{" "}
            <a
              href="mailto:support@example.com"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
