"use client";

// import {
//   getPersonalizedFeedback,
//   type PersonalizedFeedbackOutput,
// } from "@/ai/flows/personalized-feedback";

// Temporary fallback for deployment
const getPersonalizedFeedback = async (data: any) => ({
  feedback: "Great progress! Continue practicing regularly to improve your driving skills.",
  summary: "Overall performance shows good understanding of basic driving concepts with room for improvement in specific areas.",
  strengths: ["Good observation", "Proper signaling"],
  areasForImprovement: ["Parking precision", "Highway merging"],
  recommendedActions: ["Practice parallel parking", "Take highway driving lessons"],
  suggestedPlan: "Recommended to focus on parking techniques and highway driving practice. Consider additional 2-3 lessons with certified instructor."
});

type PersonalizedFeedbackOutput = {
  feedback: string;
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendedActions: string[];
  suggestedPlan: string;
};
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { generateAvatarColor } from "@/lib/utils";
import { deleteResult, type TestResult } from "@/services/resultsService";
import { format } from "date-fns";
import {
  ClipboardList,
  Edit,
  Eye,
  Lightbulb,
  Loader2,
  PlusCircle,
  Sparkles,
  ThumbsUp,
  Trash2,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Helper function to safely parse dates from various formats
const parseDate = (date: any): Date => {
  try {
    // Handle Firestore Timestamp format
    if (date && typeof date === "object" && "seconds" in date) {
      return new Date(date.seconds * 1000);
    }
    // Handle Date objects
    if (date instanceof Date) {
      return date;
    }
    // Handle ISO strings or other string formats
    return new Date(date);
  } catch (error) {
    console.warn("Invalid date format:", date);
    return new Date(); // Return current date as fallback
  }
};

interface AdminResultsViewProps {
  initialResults: TestResult[];
}

export function AdminResultsView({ initialResults }: AdminResultsViewProps) {
  const [results, setResults] = useState<TestResult[]>(initialResults);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [feedback, setFeedback] = useState<PersonalizedFeedbackOutput | null>(
    null
  );
  const { toast } = useToast();

  const handleDelete = async (resultId: string) => {
    try {
      await deleteResult(resultId);
      setResults(results.filter((result) => result.id !== resultId));
      toast({
        title: "Result Deleted",
        description: "The test result has been successfully removed.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not delete the test result.",
      });
    }
  };

  const handleGetFeedback = async (rawResults: string) => {
    setIsAiLoading(true);
    setFeedback(null);
    try {
      const aiResult = await getPersonalizedFeedback({
        testResults: rawResults,
      });
      setFeedback(aiResult);
    } catch (error) {
      console.error("AI Feedback Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not generate feedback. Please try again.",
      });
    }
    setIsAiLoading(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Test Results</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/admin/results/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Result
            </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Test Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length > 0 ? (
                results.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage
                          src={(result as any).studentAvatar}
                          alt={result.studentName}
                          data-ai-hint="person portrait"
                        />
                        <AvatarFallback
                          style={{
                            backgroundColor: generateAvatarColor(
                              result.studentName
                            ),
                          }}
                        >
                          <User className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <span>{result.studentName}</span>
                    </TableCell>
                    <TableCell>{result.testType}</TableCell>
                    <TableCell>
                      {(() => {
                        try {
                          return format(parseDate(result.date), "PPP");
                        } catch (error) {
                          return "Invalid Date";
                        }
                      })()}
                    </TableCell>
                    <TableCell>{result.score}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          result.status === "Pass" ? "default" : "destructive"
                        }
                      >
                        {result.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog
                        onOpenChange={(isOpen) => !isOpen && setFeedback(null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[625px]">
                          <DialogHeader>
                            <DialogTitle>
                              Test Details for {result.studentName}
                            </DialogTitle>
                            <DialogDescription>
                              Review raw results and generate AI-powered
                              feedback.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <Alert>
                              <AlertTitle>Raw Test Results</AlertTitle>
                              <AlertDescription>
                                {result.rawResults}
                              </AlertDescription>
                            </Alert>

                            <Button
                              onClick={() =>
                                handleGetFeedback(result.rawResults)
                              }
                              disabled={isAiLoading}
                            >
                              {isAiLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="mr-2 h-4 w-4" />
                              )}
                              Generate Feedback
                            </Button>
                            {isAiLoading && (
                              <div className="mt-6 space-y-4">
                                <Skeleton className="h-16 w-full" />
                                <div className="grid md:grid-cols-2 gap-4">
                                  <Skeleton className="h-24 w-full" />
                                  <Skeleton className="h-24 w-full" />
                                </div>
                                <Skeleton className="h-20 w-full" />
                              </div>
                            )}
                            {feedback && (
                              <div className="mt-6 space-y-4">
                                <Alert>
                                  <Lightbulb className="h-4 w-4" />
                                  <AlertTitle>AI-Powered Summary</AlertTitle>
                                  <AlertDescription>
                                    {feedback.summary}
                                  </AlertDescription>
                                </Alert>
                                <div className="grid md:grid-cols-2 gap-4">
                                  <Card>
                                    <CardHeader className="pb-2 flex-row items-center gap-2">
                                      <ThumbsUp className="h-5 w-5 text-green-500" />
                                      <CardTitle className="text-lg">
                                        Strengths
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
                                        {feedback.strengths.map(
                                          (item, index) => (
                                            <li key={index}>{item}</li>
                                          )
                                        )}
                                      </ul>
                                    </CardContent>
                                  </Card>
                                  <Card>
                                    <CardHeader className="pb-2 flex-row items-center gap-2">
                                      <TrendingUp className="h-5 w-5 text-amber-500" />
                                      <CardTitle className="text-lg">
                                        Areas for Improvement
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
                                        {feedback.areasForImprovement.map(
                                          (item, index) => (
                                            <li key={index}>{item}</li>
                                          )
                                        )}
                                      </ul>
                                    </CardContent>
                                  </Card>
                                </div>
                                <Card>
                                  <CardHeader className="pb-2 flex-row items-center gap-2">
                                    <ClipboardList className="h-5 w-5 text-primary" />
                                    <CardTitle className="text-lg">
                                      Suggested Plan
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                                      {feedback.suggestedPlan}
                                    </p>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="icon" asChild>
                        <Link href={`/admin/results/${result.id}/edit`}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete this test result.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(result.id)}
                            >
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No test results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
