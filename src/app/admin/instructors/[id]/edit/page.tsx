
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, Image as ImageIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { getInstructor, updateInstructor } from "@/services/instructorsService";
import { InputField } from "@/components/form/input-field";
import { TextareaField } from "@/components/form/textarea-field";
import { resizeImage } from "@/lib/utils";

const instructorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  experience: z.string().min(1, "Experience is required."),
  specialties: z.string().min(1, "Specialties are required."),
  bio: z.string().min(10, "Bio must be at least 10 characters long."),
  avatar: z.string().optional(),
});

type InstructorFormValues = z.infer<typeof instructorSchema>;

export default function EditInstructorPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const instructorId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<InstructorFormValues>({
    resolver: zodResolver(instructorSchema),
  });
  
  const avatarValue = form.watch('avatar');

  useEffect(() => {
    if (instructorId) {
      setIsFetching(true);
      getInstructor(instructorId)
        .then(instructor => {
            if (instructor) {
                form.reset(instructor);
            } else {
                toast({
                    variant: "destructive",
                    title: "Instructor not found",
                    description: "Could not find an instructor with that ID."
                })
                router.push("/admin/instructors");
            }
        })
        .catch(error => {
            console.error(error);
             toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch instructor data."
            })
            router.push("/admin/instructors");
        })
        .finally(() => {
            setIsFetching(false);
        });
    }
  }, [instructorId, form, router, toast]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resizedDataUrl = await resizeImage(file, 256);
        form.setValue('avatar', resizedDataUrl, { shouldValidate: true });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Image Error', description: 'Could not process the image.' });
      }
    }
  };

  const onSubmit: SubmitHandler<InstructorFormValues> = async (data) => {
    setIsLoading(true);
    try {
        await updateInstructor(instructorId, data);
        toast({
            title: "Instructor Updated Successfully",
            description: `${data.name}'s details have been updated.`,
        });
        router.push("/admin/instructors");
    } catch (error) {
        console.error("Failed to update instructor:", error);
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
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                         <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                    </div>
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
          <Link href="/admin/instructors"><ArrowLeft className="mr-2 h-4 w-4" />Back to All Instructors</Link>
        </Button>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Edit Instructor Profile</CardTitle>
          <CardDescription>Update the information for {form.getValues("name")}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <InputField control={form.control} name="name" label="Full Name" placeholder="e.g., Mr. Rajan Verma" isRequired />
                <div className="grid md:grid-cols-2 gap-6">
                    <InputField control={form.control} name="experience" label="Experience" placeholder="e.g., 15+ Years" isRequired />
                    <InputField control={form.control} name="specialties" label="Specialties" placeholder="LMV, Defensive Driving" description="Comma-separated values." isRequired />
                </div>
                <TextareaField control={form.control} name="bio" label="Biography" placeholder="A short bio about the instructor..." rows={4} isRequired />
                <div className="space-y-2">
                    <label className="text-sm font-medium">Photograph</label>
                    {avatarValue ? (
                      <div className="flex items-center gap-4">
                        <Image src={avatarValue} alt="Avatar preview" width={64} height={64} className="rounded-full" />
                        <Button variant="outline" onClick={() => form.setValue('avatar', undefined)}>
                          <X className="mr-2 h-4 w-4" /> Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        <Input type="file" accept="image/png, image/jpeg" onChange={handleAvatarChange} />
                      </div>
                    )}
                </div>
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
