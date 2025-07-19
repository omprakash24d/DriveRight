
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultLookupForm } from "./_components/ResultLookupForm";
import { TestResultDisplay, type TestResult } from "./_components/TestResultDisplay";
import { findTestResult } from "./actions";

interface LookupData {
  identifier: string;
}

export default function ResultsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleLookup = async (data: LookupData) => {
    setIsLoading(true);
    setResult(null);
    setNotFound(false);
    
    const foundResult = await findTestResult(data.identifier);

    if (foundResult) {
        setResult(foundResult);
    } else {
        setNotFound(true);
    }

    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        <ResultLookupForm onLookup={handleLookup} isLoading={isLoading} />

        {isLoading && (
            <Card className="mt-8">
                <CardHeader>
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-10 w-1/2" />
                </CardContent>
            </Card>
        )}
        
        {notFound && !isLoading && (
             <Card className="mt-8 border-destructive">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-8 w-8 text-destructive" />
                    Result Not Found
                </CardTitle>
                </CardHeader>
                <CardContent>
                <Alert variant="destructive">
                    <AlertTitle>No Record Found</AlertTitle>
                    <AlertDescription>
                    We could not find any test results matching the ID or phone number you entered. Please double-check the information and try again.
                    </AlertDescription>
                </Alert>
                </CardContent>
            </Card>
        )}

        {result && !isLoading && (
          <TestResultDisplay result={result} />
        )}
      </div>
    </div>
  );
}
