
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Info, ExternalLink, MailCheck } from "lucide-react";
import Link from "next/link";
import { InputField } from "@/components/form/input-field";
import { DatePickerField } from "@/components/form/date-picker-field";
import { SelectField } from "@/components/form/select-field";
import { indianStates } from "@/lib/constants";

const llExamSchema = z.object({
  name: z.string().min(2, "Full name is required."),
  email: z.string().email("A valid email is required to receive your results."),
  applicationNo: z.string().min(1, "Application number is required."),
  dob: z.date({
    required_error: "Date of Birth is required.",
  }),
  mobileNumber: z.string().min(10, "Please enter a valid 10-digit mobile number."),
  state: z.string({ required_error: "Please select your state." }),
});

type LlExamFormValues = z.infer<typeof llExamSchema>;

export default function LlExamPassPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<LlExamFormValues>({
    resolver: zodResolver(llExamSchema),
    defaultValues: {
      name: "",
      email: "",
      applicationNo: "",
      mobileNumber: "",
    },
  });

  const onSubmit: SubmitHandler<LlExamFormValues> = async (data) => {
    setIsLoading(true);

    try {
        const response = await fetch('/ll-exam-pass/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
           throw new Error("There was an error submitting your request.");
        }
        setIsSubmitted(true);
        form.reset();

    } catch (error) {
        console.error("Failed to log LL inquiry:", error);
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
                    <MailCheck className="h-16 w-16 text-primary" />
                </div>
                <CardTitle className="text-3xl mt-4">Thank You!</CardTitle>
                <CardDescription>
                    We have received your request. We will manually check your LL Exam Result and send the status to your registered email address shortly.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={() => setIsSubmitted(false)} className="w-full">
                    Check Another Application
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        <Alert className="mb-8">
            <Info className="h-4 w-4" />
            <AlertTitle>Please Note</AlertTitle>
            <AlertDescription>
                LL Exam results are checked manually by our team. You will receive an email with your result status after submission.
            </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Check LL Exam Result</CardTitle>
            <CardDescription>
              Enter your details below to request your Learner's License exam status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <InputField control={form.control} name="name" label="Full Name" placeholder="Enter your full name" isRequired />
                <InputField control={form.control} name="email" label="Email Address" type="email" placeholder="your.email@example.com" description="Your result will be sent to this email." isRequired />
                <InputField control={form.control} name="applicationNo" label="Application Number" placeholder="Enter your application number" description="You can find this on the official Parivahan registration portal." isRequired />
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
                <InputField control={form.control} name="mobileNumber" label="Mobile Number" type="tel" placeholder="Enter your mobile number" isRequired />
                <SelectField
                    control={form.control}
                    name="state"
                    label="State"
                    placeholder="Select your state"
                    items={indianStates.map(state => ({ value: state, label: state }))}
                    isRequired
                />
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Alert className="mt-8">
            <ExternalLink className="h-4 w-4" />
            <AlertTitle>Official Government Portal</AlertTitle>
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <p>For other services like checking application status, please visit the official Parivahan Sewa portal.</p>
                <Button asChild variant="link" className="p-0 h-auto mt-2 sm:mt-0">
                    <Link href="https://sarathi.parivahan.gov.in/sarathiservice/applicationStatus.do" target="_blank" rel="noopener noreferrer">
                        Visit Parivahan Sewa <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
            </AlertDescription>
        </Alert>

      </div>
    </div>
  );
}
