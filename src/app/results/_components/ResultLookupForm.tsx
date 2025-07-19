
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Loader2, Search } from "lucide-react";
import { InputField } from "@/components/form/input-field";

const lookupSchema = z.object({
  identifier: z.string().min(1, "Please enter your ID or phone number."),
});

type LookupFormValues = z.infer<typeof lookupSchema>;

interface ResultLookupFormProps {
  onLookup: (data: LookupFormValues) => Promise<void>;
  isLoading: boolean;
}

export function ResultLookupForm({ onLookup, isLoading }: ResultLookupFormProps) {
  const form = useForm<LookupFormValues>({
    resolver: zodResolver(lookupSchema),
    defaultValues: {
      identifier: "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl">Check Your Exam Results</CardTitle>
        <CardDescription>Enter your student ID or registered phone number to find your latest test results.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onLookup)} className="space-y-4">
            <InputField
              control={form.control}
              name="identifier"
              label="Student ID or Phone Number"
              placeholder="e.g., DR12345 or 555-123-4567"
              isRequired
            />
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Search Results
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
