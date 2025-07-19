
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Award } from "lucide-react";
import { AIFeedbackGenerator } from "./AIFeedbackGenerator";

export interface TestResult {
  studentName: string;
  testType: "LL" | "DL";
  date: string;
  score: number;
  passed: boolean;
  rawResults: string;
  certificateId?: string;
}

interface TestResultDisplayProps {
  result: TestResult;
}

export function TestResultDisplay({ result }: TestResultDisplayProps) {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {result.passed ? <CheckCircle className="h-8 w-8 text-green-500" /> : <XCircle className="h-8 w-8 text-destructive" />}
          Result for {result.studentName}
        </CardTitle>
        <CardDescription>
          {result.testType} Test taken on {result.date}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant={result.passed ? "default" : "destructive"}>
          <AlertTitle className="text-xl font-bold">
            You {result.passed ? "Passed" : "Did Not Pass"}
          </AlertTitle>
          <AlertDescription>
            Your score was {result.score} / 100.
            {result.passed ? " Congratulations! You can now view and download your official certificate below." : " Don't worry, you can try again. Use our feedback tool to see how you can improve."}
          </AlertDescription>
        </Alert>

        {result.passed && result.certificateId && (
          <div className="text-center">
              <Button asChild size="lg">
                  <Link href={`/certificate/view/${result.certificateId}`}>
                      <Award className="mr-2 h-5 w-5"/>
                      View Your Certificate
                  </Link>
              </Button>
          </div>
        )}
        
        <AIFeedbackGenerator rawResults={result.rawResults} />

      </CardContent>
    </Card>
  );
}
