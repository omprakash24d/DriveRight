"use client";

import { InputField } from "@/components/form/input-field";
import { TextareaField } from "@/components/form/textarea-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { addCourse } from "@/services/coursesService";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";

const courseSchema = z.object({
  title: z.string().min(2, "Title is required."),
  description: z.string().min(10, "Description is required."),
  price: z.string().min(1, "Price is required."),
  value: z.string().min(1, "URL value is required (e.g., 'lmv')."),
  icon: z.string().min(1, "Icon name from lucide-react is required."),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export default function NewCoursePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "Free",
      value: "",
      icon: "Car",
    },
  });

  const onSubmit: SubmitHandler<CourseFormValues> = async (data) => {
    setIsLoading(true);
    try {
      await addCourse({
        ...data,
        modules: [],
        isDeleted: false,
      });
      toast({
        title: "Course Added Successfully",
        description: `${data.title} has been added. You can now add modules and lessons by editing it.`,
      });
      router.push("/admin/courses");
    } catch (error) {
      console.error("Failed to add course:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not add the course. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/admin/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Courses
          </Link>
        </Button>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Course</CardTitle>
          <CardDescription>
            Fill in the details below to create a new course. You can add
            modules and lessons after creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <InputField
                control={form.control}
                name="title"
                label="Course Title"
                placeholder="e.g., Learner's & Driving License (LMV)"
                isRequired
              />
              <TextareaField
                control={form.control}
                name="description"
                label="Description"
                placeholder="A short description of the course..."
                rows={4}
                isRequired
              />
              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  control={form.control}
                  name="price"
                  label="Price"
                  placeholder="e.g., Free or ₹15,000"
                  isRequired
                />
                <InputField
                  control={form.control}
                  name="value"
                  label="Enroll Link Value"
                  placeholder="e.g., lmv"
                  description="Used for the enroll button link."
                  isRequired
                />
              </div>

              <InputField
                control={form.control}
                name="icon"
                label="Lucide Icon Name"
                placeholder="e.g., Car, Truck, Bike"
                description="Enter any valid icon name from lucide.dev."
                isRequired
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  Add Course
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
