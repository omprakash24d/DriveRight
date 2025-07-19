
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
import { addTrainingService } from "@/services/quickServicesService";
import { InputField } from "@/components/form/input-field";
import { TextareaField } from "@/components/form/textarea-field";

const serviceSchema = z.object({
  icon: z.string().min(1, "Icon name from lucide-react is required."),
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  services: z.string().min(1, "Please list at least one service feature."),
  ctaText: z.string().min(1, "CTA Text is required."),
  ctaHref: z.string().min(1, "CTA Link is required."),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function NewTrainingServicePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      icon: "Car",
      title: "",
      description: "",
      services: "",
      ctaText: "Enroll Now",
      ctaHref: "/enroll",
    },
  });

  const onSubmit: SubmitHandler<ServiceFormValues> = async (data) => {
    setIsLoading(true);
    try {
      const serviceData = {
        ...data,
        services: data.services.split('\n').map(s => s.trim()).filter(Boolean),
      };
      await addTrainingService(serviceData);
      toast({
        title: "Service Added Successfully",
        description: `${data.title} has been added to the homepage services.`,
      });
      router.push("/admin/training-services");
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
          <Link href="/admin/training-services">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Training Services
          </Link>
        </Button>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Training Service</CardTitle>
          <CardDescription>
            Fill in the details for a new service card to display on the homepage.
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
                placeholder="e.g., Car, Truck, Bike"
                description="Enter any valid icon name from lucide.dev."
                isRequired
              />

              <TextareaField control={form.control} name="description" label="Description" rows={3} isRequired />
              <TextareaField control={form.control} name="services" label="Service Features" description="List one feature per line." rows={5} isRequired />
              <InputField control={form.control} name="ctaText" label="Button Text" placeholder="e.g., Enroll Now" isRequired />
              <InputField control={form.control} name="ctaHref" label="Button Link" placeholder="e.g., /enroll?vehicleType=lmv" isRequired />

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
