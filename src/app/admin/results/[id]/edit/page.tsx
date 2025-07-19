
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { getResult, updateResult } from "@/services/resultsService";
import { getStudents, type Student } from "@/services/studentsService";
import { Timestamp } from "firebase/firestore";
import { SelectField } from "@/components/form/select-field";
import { InputField } from "@/components/form/input-field";
import { DatePickerField } from "@/components/form/date-picker-field";
import { TextareaField } from "@/components/form/textarea-field";

const editResultSchema = z.object({
  studentId: z.string({ required_error: "Please select a student." }),
  testType: z.string().min(1, "Test type is required."),
  date: z.date({ required_error: "Test date is required." }),
  score: z.coerce.number().min(0, "Score must be positive.").max(100, "Score cannot exceed 100."),
  status: z.enum(["Pass", "Fail"], { required_error: "Please select a status." }),
  rawResults: z.string().min(10, "Please provide a brief summary of the results."),
});

type EditResultFormValues = z.infer<typeof editResultSchema>;

export default function EditResultPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const resultId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [studentName, setStudentName] = useState("");

  const form = useForm<EditResultFormValues>({
    resolver: zodResolver(editResultSchema),
  });

  useEffect(() => {
    if (resultId) {
      setIsFetching(true);
      Promise.all([
          getResult(resultId),
          getStudents()
      ]).then(([result, fetchedStudents]) => {
            setStudents(fetchedStudents);
            if (result) {
                form.reset({
                    ...result,
                    date: result.date.toDate(),
                });
                setStudentName(result.studentName);
            } else {
                toast({
                    variant: "destructive",
                    title: "Result not found",
                    description: "Could not find a test result with that ID."
                })
                router.push("/admin/results");
            }
        })
        .catch(error => {
            console.error(error);
             toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch necessary data."
            })
            router.push("/admin/results");
        })
        .finally(() => {
            setIsFetching(false);
        });
    }
  }, [resultId, form, router, toast]);


  const onSubmit: SubmitHandler<EditResultFormValues> = async (data) => {
    setIsLoading(true);
    try {
        const studentName = students.find(s => s.id === data.studentId)?.name || 'Unknown Student';
        const resultWithTimestamp = {
            ...data,
            date: Timestamp.fromDate(data.date),
            studentName: studentName
        };

        await updateResult(resultId, resultWithTimestamp);
        toast({
        title: "Result Updated Successfully",
        description: `The test result for ${studentName} has been updated.`,
        });
        router.push("/admin/results");

    } catch (error) {
        console.error(error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not save the test result."
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
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
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
          <Link href="/admin/results">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Results
          </Link>
        </Button>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Test Result</CardTitle>
          <CardDescription>
            Update the test result details for {studentName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <SelectField
                control={form.control}
                name="studentId"
                label="Student"
                placeholder="Select a student"
                items={students.map(s => ({ value: s.id, label: s.name }))}
                isRequired
              />
              
              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  control={form.control}
                  name="testType"
                  label="Test Type"
                  placeholder="e.g., LMV-DL"
                  isRequired
                />
                <DatePickerField
                  control={form.control}
                  name="date"
                  label="Test Date"
                  isRequired
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                    control={form.control}
                    name="score"
                    label="Score (out of 100)"
                    type="number"
                    isRequired
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex items-center space-x-4 pt-2"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="Pass" /></FormControl>
                            <FormLabel className="font-normal">Pass</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value="Fail" /></FormControl>
                            <FormLabel className="font-normal">Fail</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <TextareaField
                control={form.control}
                name="rawResults"
                label="Raw Results Summary"
                placeholder="Provide a brief summary of the test performance..."
                description="This text will be used for generating AI feedback."
                isRequired
              />

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
