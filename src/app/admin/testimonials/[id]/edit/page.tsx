
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
import { getTestimonial, updateTestimonial } from "@/services/testimonialsService";
import { InputField } from "@/components/form/input-field";
import { TextareaField } from "@/components/form/textarea-field";

const testimonialSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  course: z.string().min(1, "Course is required."),
  quote: z.string().min(10, "Quote must be at least 10 characters long."),
});

type TestimonialFormValues = z.infer<typeof testimonialSchema>;

export default function EditTestimonialPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const testimonialId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      name: "",
      course: "",
      quote: "",
    }
  });

  useEffect(() => {
    if (testimonialId) {
      setIsFetching(true);
      getTestimonial(testimonialId)
        .then(testimonial => {
            if (testimonial) {
                form.reset(testimonial);
            } else {
                toast({
                    variant: "destructive",
                    title: "Testimonial not found",
                    description: "Could not find a testimonial with that ID."
                })
                router.push("/admin/testimonials");
            }
        })
        .catch(error => {
            console.error(error);
             toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch testimonial data."
            })
            router.push("/admin/testimonials");
        })
        .finally(() => {
            setIsFetching(false);
        });
    }
  }, [testimonialId, form, router, toast]);

  const onSubmit: SubmitHandler<TestimonialFormValues> = async (data) => {
    setIsLoading(true);
    try {
        await updateTestimonial(testimonialId, data);
        toast({
            title: "Testimonial Updated Successfully",
            description: `The testimonial from ${data.name} has been updated.`,
        });
        router.push("/admin/testimonials");
    } catch (error) {
        console.error("Failed to update testimonial:", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not save changes. Please try again.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
         <div>
            <div className="mb-6"><Skeleton className="h-10 w-48" /></div>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                     <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                     <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-24 w-full" /></div>
                    <div className="flex justify-end"><Skeleton className="h-10 w-36" /></div>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div>
       <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/admin/testimonials"><ArrowLeft className="mr-2 h-4 w-4" />Back to All Testimonials</Link>
        </Button>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Testimonial</CardTitle>
          <CardDescription>Update the testimonial from {form.getValues("name")}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <InputField control={form.control} name="name" label="Student Name" placeholder="e.g., Jane Doe" isRequired />
              <InputField control={form.control} name="course" label="Course Taken" placeholder="e.g., LMV License Course" isRequired />
              <TextareaField control={form.control} name="quote" label="Quote" placeholder="The instructors were amazing..." rows={5} isRequired />
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
