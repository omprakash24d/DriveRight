
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, CheckCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { InputField } from "@/components/form/input-field";
import { DatePickerField } from "@/components/form/date-picker-field";
import { SelectField } from "@/components/form/select-field";
import { TextareaField } from "@/components/form/textarea-field";
import { FileField } from "@/components/form/file-field";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_DOCUMENT_TYPES = ["image/jpeg", "image/png", "application/pdf"];

const refresherSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  mobileNo: z.string().min(10, "Please enter a valid 10-digit mobile number."),
  dob: z.date({ required_error: "A date of birth is required." }),
  vehicleType: z.enum(["hmv", "lmv"], { required_error: "Please select a vehicle type." }),
  reason: z.string().min(10, "Please provide a brief reason for your request."),
  licenseUpload: z.any()
    .refine((files) => files?.length === 1, "Previous license upload is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_DOCUMENT_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .pdf files are accepted."
    ),
});

type RefresherFormValues = z.infer<typeof refresherSchema>;

export default function RefresherPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<RefresherFormValues>({
    resolver: zodResolver(refresherSchema),
    defaultValues: {
      name: "",
      email: "",
      mobileNo: "",
      reason: "",
      licenseUpload: undefined,
    },
  });

  const onSubmit: SubmitHandler<RefresherFormValues> = async (data) => {
    setIsLoading(true);

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'licenseUpload') {
          formData.append(key, value[0]);
      } else if (key === 'dob' && value instanceof Date) {
          formData.append(key, value.toISOString());
      } else if (value) {
          formData.append(key, value as string);
      }
    });

    try {
        const response = await fetch('/refresher/api', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "An error occurred during submission.");
        }

        toast({
            title: "Request Sent!",
            description: "We've received your request and will be in touch shortly.",
        });
        form.reset();
        setIsSubmitted(true);

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
       <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-6">
            <CardHeader>
                <div className="flex justify-center">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle className="text-3xl mt-4">Request Sent Successfully!</CardTitle>
                <CardDescription>
                    Thank you for your interest. We will review your request and contact you soon. Please check your email for a confirmation.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={() => { setIsSubmitted(false); form.reset(); }} className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
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
            <CardTitle className="text-3xl">Request a Refresher Course</CardTitle>
            <CardDescription>
              Need to brush up on your skills? Fill out the form below to request a refresher course.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <InputField control={form.control} name="name" label="Full Name" placeholder="Enter Your Full Name" isRequired />
                <div className="grid md:grid-cols-2 gap-6">
                  <InputField control={form.control} name="email" label="Email Address" type="email" placeholder="abc@example.com" isRequired />
                  <InputField control={form.control} name="mobileNo" label="Mobile No." placeholder="Enter Your Mobile Number" isRequired />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
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
                  <SelectField
                    control={form.control}
                    name="vehicleType"
                    label="Vehicle Type"
                    placeholder="Select vehicle type"
                    items={[
                      { value: 'lmv', label: 'Light Motor Vehicle (LMV)' },
                      { value: 'hmv', label: 'Heavy Motor Vehicle (HMV)' },
                    ]}
                    isRequired
                  />
                </div>
                <TextareaField
                  control={form.control}
                  name="reason"
                  label="Reason for Refresher"
                  placeholder="e.g., Need practice with highway driving, haven't driven in a while, etc."
                  rows={4}
                  isRequired
                />
                <FileField
                    control={form.control}
                    name="licenseUpload"
                    label="Upload Previous License"
                    isRequired
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
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
