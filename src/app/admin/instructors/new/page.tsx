
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, ArrowLeft, Image as ImageIcon, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { addInstructor } from "@/services/instructorsService";
import { InputField } from "@/components/form/input-field";
import { TextareaField } from "@/components/form/textarea-field";
import { resizeImage, uploadFile } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { nanoid } from "nanoid";

const instructorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  experience: z.string().min(1, "Experience is required."),
  specialties: z.string().min(1, "Specialties are required."),
  bio: z.string().min(10, "Bio must be at least 10 characters long."),
  avatar: z.string().optional(),
});

type InstructorFormValues = z.infer<typeof instructorSchema>;

export default function NewInstructorPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<InstructorFormValues>({
    resolver: zodResolver(instructorSchema),
    defaultValues: {
      name: "",
      experience: "",
      specialties: "",
      bio: "",
    },
  });
  
  const avatarPreviewUrl = form.watch('avatar');

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const resizedFile = await resizeImage(file, 256, 'file');
        setImageFile(resizedFile as File);
        // Set a preview URL
        form.setValue('avatar', URL.createObjectURL(resizedFile));
      } catch (error) {
        toast({ variant: 'destructive', title: 'Image Error', description: 'Could not process the image.' });
      }
    }
  };

  const onSubmit: SubmitHandler<InstructorFormValues> = async (data) => {
    setIsLoading(true);
    try {
      const instructorId = nanoid();
      let avatarUrl = '';
      if (imageFile) {
        avatarUrl = await uploadFile(imageFile, `instructors/${instructorId}/avatar.jpg`);
      }
      
      await addInstructor({ ...data, avatar: avatarUrl });

      toast({
        title: "Instructor Added Successfully",
        description: `${data.name} has been added to the system.`,
      });
      router.push("/admin/instructors");
    } catch (error) {
      console.error("Failed to add instructor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not add the instructor. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
       <div className="mb-6">
        <Button asChild variant="outline">
          <Link href="/admin/instructors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to All Instructors
          </Link>
        </Button>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Add New Instructor</CardTitle>
          <CardDescription>
            Fill in the details below to create a new instructor profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <InputField
                control={form.control}
                name="name"
                label="Full Name"
                placeholder="e.g., Mr. Rajan Verma"
                isRequired
              />
              <div className="grid md:grid-cols-2 gap-6">
                <InputField
                  control={form.control}
                  name="experience"
                  label="Experience"
                  placeholder="e.g., 15+ Years"
                  isRequired
                />
                <InputField
                  control={form.control}
                  name="specialties"
                  label="Specialties"
                  placeholder="LMV, Defensive Driving"
                  description="Comma-separated values."
                  isRequired
                />
              </div>
              <TextareaField
                control={form.control}
                name="bio"
                label="Biography"
                placeholder="A short bio about the instructor..."
                rows={4}
                isRequired
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">Photograph</label>
                {avatarPreviewUrl ? (
                  <div className="flex items-center gap-4">
                    <Image src={avatarPreviewUrl} alt="Avatar preview" width={64} height={64} className="rounded-full object-cover" />
                    <Button variant="outline" onClick={() => { form.setValue('avatar', ''); setImageFile(null); }}>
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
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  Add Instructor
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
