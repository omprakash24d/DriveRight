
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Award, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStudents, type Student } from "@/services/studentsService";
import { InputField } from "@/components/form/input-field";
import { SelectField } from "@/components/form/select-field";

const generateCertificateSchema = z.object({
  studentId: z.string({
    required_error: "Please select a student.",
  }),
  course: z.string().min(1, "Course name is required, e.g., LMV or MCWG."),
  certificateType: z.enum(["LL", "DL"], {
    required_error: "Please select a certificate type.",
  }),
});

type GenerateCertificateFormValues = z.infer<typeof generateCertificateSchema>;

export default function GenerateCertificatePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingStudents, setIsFetchingStudents] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);

  const form = useForm<GenerateCertificateFormValues>({
    resolver: zodResolver(generateCertificateSchema),
    defaultValues: {
      course: "",
    }
  });
  
  useEffect(() => {
    async function fetchStudents() {
        setIsFetchingStudents(true);
        try {
            const fetchedStudents = await getStudents();
            setStudents(fetchedStudents);
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch student list."
            });
        } finally {
            setIsFetchingStudents(false);
        }
    }
    fetchStudents();
  }, [toast]);

  const onSubmit: SubmitHandler<GenerateCertificateFormValues> = async (data) => {
    setIsLoading(true);
    try {
        const student = students.find(s => s.id === data.studentId);
        if (!student) {
            toast({ variant: "destructive", title: "Error", description: "Selected student not found." });
            setIsLoading(false);
            return;
        }

        // The session cookie is sent automatically by the browser.
        const response = await fetch('/api/admin/certificates', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                studentId: data.studentId,
                studentName: student.name,
                studentEmail: student.email,
                course: data.course,
                type: data.certificateType,
            }),
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || 'Failed to generate certificate');
        }
        
        const result = await response.json();
        
        toast({
            title: "Certificate Generated & Sent",
            description: `A new ${data.certificateType} certificate has been issued and emailed to ${student.name}.`,
        });
        router.push("/admin/certificates");
    } catch (error: any) {
        console.error("Error generating certificate:", error);
        toast({
            variant: "destructive",
            title: "Generation Failed",
            description: error.message || "Could not generate or email the certificate. Please try again."
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div>
       <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/admin/certificates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Certificates
          </Link>
        </Button>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Generate New Certificate</CardTitle>
          <CardDescription>
            Select a student and certificate type to generate a new record. An email with a link to the certificate will be sent automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <SelectField
                  control={form.control}
                  name="studentId"
                  label="Student"
                  placeholder={isFetchingStudents ? "Loading students..." : "Select a student to issue certificate"}
                  items={students.map(s => ({ value: s.id, label: `${s.name} (${s.email}) - ID: ${s.id}` }))}
                  isRequired
               />

              <InputField
                control={form.control}
                name="course"
                label="Course"
                placeholder="e.g., LMV or MCWG"
                isRequired
              />
              
              <SelectField
                control={form.control}
                name="certificateType"
                label="Certificate Type"
                placeholder="Select the certificate type"
                items={[
                  { value: "LL", label: "Learner's License (LL)" },
                  { value: "DL", label: "Driving License (DL)" },
                ]}
                isRequired
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading || isFetchingStudents}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Award className="mr-2 h-4 w-4" />
                  )}
                  Generate & Email Certificate
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
