
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Loader2, Printer, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InputField } from "@/components/form/input-field";
import { DatePickerField } from "@/components/form/date-picker-field";

const licensePrintSchema = z.object({
  name: z.string().min(2, "Full name is required."),
  email: z.string().email("A valid email is required to receive your document."),
  dlNumber: z.string().min(5, "Driving License number is required."),
  dob: z.date({ required_error: "Date of Birth is required." }),
});

type LicensePrintFormValues = z.infer<typeof licensePrintSchema>;

export default function LicensePrintPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<LicensePrintFormValues>({
    resolver: zodResolver(licensePrintSchema),
    defaultValues: {
      name: "",
      email: "",
      dlNumber: "",
    },
  });

  const onSubmit: SubmitHandler<LicensePrintFormValues> = async (data) => {
    setIsLoading(true);

    try {
      const response = await fetch('/license-print/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("There was an error submitting your request.");
      }

      setIsSubmitted(true);
      form.reset();

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Could not submit your request. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 flex items-center justify-center">
        <Card className="w-full max-w-lg text-center p-6">
          <CardHeader>
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl mt-4">Request Submitted!</CardTitle>
            <CardDescription>
              We have received your request. Our team will verify your details and email your driving license document to you shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsSubmitted(false)} className="w-full">
              Submit Another Request
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Request Driving License Print</CardTitle>
            <CardDescription>
              Enter your details below. Our team will verify them and email you a print-ready copy of your license.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <InputField control={form.control} name="name" label="Full Name" placeholder="Enter your full name" isRequired />
                <InputField control={form.control} name="email" label="Email Address" type="email" placeholder="your.email@example.com" isRequired />
                <InputField control={form.control} name="dlNumber" label="Driving License No." placeholder="Enter your DL number" isRequired />
                <DatePickerField
                  control={form.control}
                  name="dob"
                  label="Date of Birth"
                  isRequired
                  inputType="text"
                  captionLayout="dropdown"
                  fromYear={1950}
                  toYear={new Date().getFullYear()}
                />

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
                  Submit Request
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
