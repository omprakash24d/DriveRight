"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorService } from "@/lib/error-service";
import { AlertTriangle, Bug, CheckCircle } from "lucide-react";
import { useState } from "react";

export default function SentryTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults((prev) => [...prev, message]);
  };

  const testError = () => {
    try {
      // This will trigger an error that Sentry should capture
      // @ts-ignore - Intentionally calling undefined function
      myUndefinedFunction();
    } catch (error) {
      addResult("✅ Error thrown and should be captured by Sentry");
    }
  };

  const testManualError = () => {
    ErrorService.logError(
      new Error("Manual test error from Sentry test page"),
      {
        component: "SentryTestPage",
        action: "testManualError",
        metadata: {
          testType: "manual",
          timestamp: new Date().toISOString(),
        },
      }
    );
    addResult("✅ Manual error logged via ErrorService");
  };

  const testWarning = () => {
    ErrorService.logWarning("This is a test warning message", {
      component: "SentryTestPage",
      action: "testWarning",
    });
    addResult("✅ Warning logged via ErrorService");
  };

  const testPerformance = () => {
    ErrorService.trackPerformance({
      operation: "sentry-test-operation",
      duration: 1250,
      metadata: {
        testType: "performance",
        result: "success",
      },
    });
    addResult("✅ Performance metric tracked");
  };

  const testUnhandledPromiseRejection = () => {
    // This will create an unhandled promise rejection
    Promise.reject(new Error("Test unhandled promise rejection"));
    addResult("✅ Unhandled promise rejection triggered");
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4">
            🧪 Sentry Error Tracking Test
          </h1>
          <p className="text-muted-foreground">
            Use these buttons to test different types of errors and monitoring
            features. Check your Sentry dashboard to see if events are being
            captured.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Error Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testError}
                variant="destructive"
                className="w-full"
              >
                🚨 Test Undefined Function Error
              </Button>

              <Button
                onClick={testManualError}
                variant="destructive"
                className="w-full"
              >
                📝 Test Manual Error Logging
              </Button>

              <Button
                onClick={testUnhandledPromiseRejection}
                variant="destructive"
                className="w-full"
              >
                ⚡ Test Unhandled Promise Rejection
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Monitoring Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={testWarning}
                variant="outline"
                className="w-full"
              >
                ⚠️ Test Warning Log
              </Button>

              <Button
                onClick={testPerformance}
                variant="outline"
                className="w-full"
              >
                📊 Test Performance Tracking
              </Button>

              <Button
                onClick={() => {
                  ErrorService.setUserContext(
                    "test-user-123",
                    "test@example.com",
                    "tester"
                  );
                  addResult("✅ User context set for Sentry");
                }}
                variant="outline"
                className="w-full"
              >
                👤 Set Test User Context
              </Button>
            </CardContent>
          </Card>
        </div>

        {testResults.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {testResults.map((result, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    {result}
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Next Step:</strong> Check your Sentry dashboard at{" "}
                  <a
                    href="https://sentry.io/organizations/cusb/projects/driveright/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    https://sentry.io/organizations/cusb/projects/driveright/
                  </a>{" "}
                  to see if these events were captured.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🔍 Debugging Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 text-sm">
              <div>
                <strong>Sentry DSN:</strong>{" "}
                <code className="bg-muted px-2 py-1 rounded">
                  {process.env.NEXT_PUBLIC_SENTRY_DSN
                    ? "✅ Configured"
                    : "❌ Not Set"}
                </code>
              </div>
              <div>
                <strong>Environment:</strong>{" "}
                <code className="bg-muted px-2 py-1 rounded">
                  {process.env.NODE_ENV}
                </code>
              </div>
              <div>
                <strong>Sentry Organization:</strong>{" "}
                <code className="bg-muted px-2 py-1 rounded">cusb</code>
              </div>
              <div>
                <strong>Sentry Project:</strong>{" "}
                <code className="bg-muted px-2 py-1 rounded">driveright</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
