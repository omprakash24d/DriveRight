
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Loader2, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { findCertificate } from "./actions";
import { InputField } from "@/components/form/input-field";

const downloadSchema = z.object({
  certificateNumber: z.string().min(5, "Certificate Number is required."),
});

type DownloadFormValues = z.infer<typeof downloadSchema>;

export default function CertificateDownloadPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<DownloadFormValues>({
    resolver: zodResolver(downloadSchema),
    defaultValues: {
      certificateNumber: "",
    },
  });

  const onSubmit: SubmitHandler<DownloadFormValues> = async (data) => {
    setIsLoading(true);
    
    try {
        const certificate = await findCertificate(data.certificateNumber);
        if (certificate) {
            router.push(`/certificate/view/${certificate.id}`);
        } else {
            toast({
                variant: "destructive",
                title: "Certificate Not Found",
                description: "Certificate not found. Please double-check the number and try again.",
            });
        }
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "An unexpected error occurred. Please try again later.",
        });
    }

    setIsLoading(false);
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Download Your Certificate</CardTitle>
            <CardDescription>
              Enter your certificate number below to find and download your document.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <InputField
                  control={form.control}
                  name="certificateNumber"
                  label="Certificate Number"
                  placeholder="Enter your certificate number (e.g., DL-A1B2C3D4)"
                  isRequired
                />
                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Download Certificate
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
