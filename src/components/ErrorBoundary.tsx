"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { ErrorService } from "@/lib/error-service";
import { AlertTriangle, Bug, Home, RefreshCw } from "lucide-react";
import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
  errorId?: string;
}

function DefaultErrorFallback({
  error,
  resetError,
  errorId,
}: ErrorFallbackProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Something went wrong
          </CardTitle>
          <CardDescription className="mt-2">
            We apologize for the inconvenience. The error has been automatically
            reported to our team.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && error && (
            <div className="p-3 bg-gray-100 rounded-md">
              <p className="text-sm font-medium text-gray-900 mb-1">
                Error Details:
              </p>
              <p className="text-xs text-gray-600 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          {errorId && (
            <div className="p-3 bg-blue-50 rounded-md">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Error ID:
              </p>
              <p className="text-xs text-blue-700 font-mono break-all">
                {errorId}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Button onClick={resetError} className="w-full" variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>

            <Button
              onClick={() => (window.location.href = "/")}
              className="w-full"
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>

            {user && (
              <Button
                onClick={() => (window.location.href = "/contact")}
                className="w-full"
                variant="ghost"
              >
                <Bug className="mr-2 h-4 w-4" />
                Report Issue
              </Button>
            )}
          </div>

          <p className="text-xs text-gray-500 text-center">
            If this problem persists, please contact our support team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private errorId?: string;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Generate a unique error ID for tracking
    this.errorId = `err_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Log to our error service
    ErrorService.logError(error, {
      component: "ErrorBoundary",
      action: "componentDidCatch",
      metadata: {
        errorId: this.errorId,
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        userAgent:
          typeof window !== "undefined"
            ? window.navigator.userAgent
            : "unknown",
        url: typeof window !== "undefined" ? window.location.href : "unknown",
      },
    });

    // Call custom onError handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.errorId = undefined;
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.handleReset}
          errorId={this.errorId}
        />
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to trigger error boundary
export function useErrorHandler() {
  return (error: Error, context?: { component?: string; action?: string }) => {
    ErrorService.logError(error, {
      component: context?.component || "useErrorHandler",
      action: context?.action || "manual",
    });
    throw error; // Re-throw to trigger error boundary
  };
}
