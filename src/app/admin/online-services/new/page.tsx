
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addOnlineService } from "@/services/quickServicesService";
import { InputField } from "@/components/form/input-field";
import { TextareaField } from "@/components/form/textarea-field";

const serviceSchema = z.object({
  icon: z.string().min(1, "Icon name from lucide-react is required."),
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  ctaText: z.string().min(1, "CTA Text is required."),
  href: z.string().min(1, "Link is required."),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function NewOnlineServicePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      icon: "FileCheck2",
      title: "",
      description: "",
      ctaText: "Get Started",
      href: "/",
    },
  });

  const onSubmit: SubmitHandler<ServiceFormValues> = async (data) => {
    setIsLoading(true);
    try {
      await addOnlineService(data);
      toast({
        title: "Service Added Successfully",
        description: `${data.title} has been added to the homepage online tools.`,
      });
      router.push("/admin/online-services");
    } catch (error) {
      console.error("Failed to add service:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not add the service. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
       <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/admin/online-services">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Online Services
          </Link>
        </Button>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Online Service</CardTitle>
          <CardDescription>
            Fill in the details for a new online tool card to display on the homepage.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <InputField control={form.control} name="title" label="Title" isRequired />
              
              <InputField
                control={form.control}
                name="icon"
                label="Lucide Icon Name"
                placeholder="e.g., FileCheck2, Printer"
                description="Enter any valid icon name from lucide.dev."
                isRequired
              />

              <TextareaField control={form.control} name="description" label="Description" rows={3} isRequired />
              <InputField control={form.control} name="ctaText" label="Button Text" placeholder="e.g., Check Status" isRequired />
              <InputField control={form.control} name="href" label="Button Link" placeholder="e.g., /results" isRequired />

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  Add Service
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
