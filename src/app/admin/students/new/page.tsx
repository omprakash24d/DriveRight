
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addStudent } from "@/services/studentsService";
import { InputField } from "@/components/form/input-field";

const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Please enter a valid phone number."),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export default function NewStudentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit: SubmitHandler<StudentFormValues> = async (data) => {
    setIsLoading(true);
    try {
      await addStudent(data);
      toast({
        title: "Student Added Successfully",
        description: `${data.name} has been added to the system.`,
      });
      router.push("/admin/students");
    } catch (error) {
      console.error("Failed to add student:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not add the student. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
       <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/admin/students">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Students
          </Link>
        </Button>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Student</CardTitle>
          <CardDescription>
            Fill in the details below to create a new student profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <InputField
                control={form.control}
                name="name"
                label="Full Name"
                placeholder="e.g., Rohan Sharma"
                isRequired
              />
              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  control={form.control}
                  name="email"
                  label="Email Address"
                  type="email"
                  placeholder="rohan.sharma@example.com"
                  isRequired
                />
                <InputField
                  control={form.control}
                  name="phone"
                  label="Phone Number"
                  placeholder="9876543210"
                  isRequired
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  Add Student
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
