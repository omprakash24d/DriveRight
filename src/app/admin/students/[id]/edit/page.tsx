
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
import { getStudent, updateStudent } from "@/services/studentsService";
import { InputField } from "@/components/form/input-field";

const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Please enter a valid phone number."),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export default function EditStudentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (studentId) {
      setIsFetching(true);
      getStudent(studentId)
        .then(student => {
            if (student) {
                form.reset({
                    name: student.name,
                    email: student.email,
                    phone: student.phone,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Student not found",
                    description: "Could not find a student with that ID."
                })
                router.push("/admin/students");
            }
        })
        .catch(error => {
            console.error(error);
             toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch student data."
            })
            router.push("/admin/students");
        })
        .finally(() => {
            setIsFetching(false);
        });
    }
  }, [studentId, form, router, toast]);

  const onSubmit: SubmitHandler<StudentFormValues> = async (data) => {
    setIsLoading(true);
    try {
        await updateStudent(studentId, data);
        toast({
            title: "Student Updated Successfully",
            description: `${data.name}'s details have been updated.`,
        });
        router.push("/admin/students");
    } catch (error) {
        console.error("Failed to update student:", error);
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
            <div className="mb-6">
                <Skeleton className="h-10 w-48" />
            </div>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Skeleton className="h-10 w-36" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
  }

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
          <CardTitle>Edit Student Details</CardTitle>
          <CardDescription>
            Update the information for {form.getValues("name")}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <InputField control={form.control} name="name" label="Full Name" placeholder="e.g., Rohan Sharma" isRequired />
                <div className="grid md:grid-cols-2 gap-6">
                    <InputField control={form.control} name="email" label="Email Address" type="email" placeholder="rohan.sharma@example.com" isRequired />
                    <InputField control={form.control} name="phone" label="Phone Number" placeholder="9876543210" isRequired />
                </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
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
