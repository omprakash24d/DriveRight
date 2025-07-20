
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addTestimonial } from "@/services/testimonialsService";
import { InputField } from "@/components/form/input-field";
import { TextareaField } from "@/components/form/textarea-field";

const testimonialSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  course: z.string().min(1, "Course is required."),
  quote: z.string().min(10, "Quote must be at least 10 characters long."),
});

type TestimonialFormValues = z.infer<typeof testimonialSchema>;

export default function NewTestimonialPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      name: "",
      course: "",
      quote: "",
    },
  });

  const onSubmit: SubmitHandler<TestimonialFormValues> = async (data) => {
    setIsLoading(true);
    try {
      await addTestimonial(data);
      toast({
        title: "Testimonial Added Successfully",
        description: `A new testimonial from ${data.name} has been added.`,
      });
      router.push("/admin/testimonials");
    } catch (error) {
      console.error("Failed to add testimonial:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not add the testimonial. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
       <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/admin/testimonials">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Testimonials
          </Link>
        </Button>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Testimonial</CardTitle>
          <CardDescription>
            Fill in the details below to add a student testimonial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <InputField control={form.control} name="name" label="Student Name" placeholder="e.g., Jane Doe" isRequired />
              <InputField control={form.control} name="course" label="Course Taken" placeholder="e.g., LMV License Course" isRequired />
              <TextareaField control={form.control} name="quote" label="Quote" placeholder="The instructors were amazing..." rows={5} isRequired />
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquarePlus className="mr-2 h-4 w-4" />
                  )}
                  Add Testimonial
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
