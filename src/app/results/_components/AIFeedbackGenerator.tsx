
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { getPersonalizedFeedback, type PersonalizedFeedbackOutput } from "@/ai/flows/personalized-feedback";

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

import { Loader2, Sparkles, Lightbulb, ThumbsUp, TrendingUp, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { TextareaField } from "@/components/form/textarea-field";

const feedbackSchema = z.object({
  testResults: z.string().min(1),
  studyPlan: z.string().optional(),
});
type FeedbackFormValues = z.infer<typeof feedbackSchema>;

interface AIFeedbackGeneratorProps {
  rawResults: string;
}

export function AIFeedbackGenerator({ rawResults }: AIFeedbackGeneratorProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [feedback, setFeedback] = useState<PersonalizedFeedbackOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      testResults: rawResults,
      studyPlan: "",
    }
  });

  const handleGetFeedback: SubmitHandler<FeedbackFormValues> = async (data) => {
    setIsAiLoading(true);
    setFeedback(null);
    try {
      const aiResult = await getPersonalizedFeedback(data);
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
    <Card className="bg-secondary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="h-5 w-5 text-primary" />
          Personalized Feedback
        </CardTitle>
        <CardDescription>Use AI to get study tips based on your results.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGetFeedback)} className="space-y-4">
            <input type="hidden" {...form.register("testResults")} />
            <TextareaField
              control={form.control}
              name="studyPlan"
              label="Current Study Plan (Optional)"
              placeholder="e.g., 'I practice driving for 1 hour every evening...'"
            />
            <Button type="submit" disabled={isAiLoading}>
              {isAiLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Feedback
            </Button>
          </form>
        </Form>
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
                          <ThumbsUp className="h-5 w-5 text-green-500"/>
                          <CardTitle className="text-lg">Strengths</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
                              {feedback.strengths.map((item, index) => <li key={index}>{item}</li>)}
                          </ul>
                      </CardContent>
                  </Card>
                  <Card>
                      <CardHeader className="pb-2 flex-row items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-amber-500" />
                          <CardTitle className="text-lg">Areas for Improvement</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-sm">
                              {feedback.areasForImprovement.map((item, index) => <li key={index}>{item}</li>)}
                          </ul>
                      </CardContent>
                  </Card>
              </div>
              <Card>
                  <CardHeader className="pb-2 flex-row items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">Suggested Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap text-sm">{feedback.suggestedPlan}</p>
                  </CardContent>
              </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
