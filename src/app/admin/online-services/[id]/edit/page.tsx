
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { getOnlineService } from "@/services/quickServicesService";
import { InputField } from "@/components/form/input-field";
import { TextareaField } from "@/components/form/textarea-field";
import { updateOnlineServiceAction } from "../../actions";

const serviceSchema = z.object({
  icon: z.string().min(1, "Icon name from lucide-react is required."),
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  ctaText: z.string().min(1, "CTA Text is required."),
  href: z.string().min(1, "Link is required."),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function EditOnlineServicePage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
  });

  useEffect(() => {
    if (serviceId) {
      setIsFetching(true);
      getOnlineService(serviceId)
        .then(service => {
            if (service) {
                form.reset(service);
            } else {
                toast({ variant: "destructive", title: "Service not found" })
                router.push("/admin/online-services");
            }
        })
        .catch(error => {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch service data." })
        })
        .finally(() => setIsFetching(false));
    }
  }, [serviceId, form, router, toast]);

  const onSubmit: SubmitHandler<ServiceFormValues> = async (data) => {
    setIsLoading(true);
    try {
        const result = await updateOnlineServiceAction(serviceId, data);
        if (result.success) {
            toast({ title: "Service Updated Successfully" });
            router.push("/admin/online-services");
        } else {
            throw new Error(result.error);
        }
    } catch (error: any) {
        toast({ variant: "destructive", title: "Update Failed", description: error.message || "Could not update the service." });
    } finally {
        setIsLoading(false);
    }
  };
  
  if (isFetching) {
    return <div><Skeleton className="h-10 w-48 mb-6" /><Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>
  }

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
          <CardTitle>Edit Online Service</CardTitle>
          <CardDescription>Update the details for this homepage online tool card.</CardDescription>
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
              <InputField control={form.control} name="ctaText" label="Button Text" isRequired />
              <InputField control={form.control} name="href" label="Button Link" placeholder="e.g., /results" isRequired />

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
