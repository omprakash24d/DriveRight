
"use client";

import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { nanoid } from 'nanoid';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, ArrowLeft, PlusCircle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { getCourse, updateCourse } from "@/services/coursesService";
import { InputField } from "@/components/form/input-field";
import { TextareaField } from "@/components/form/textarea-field";

const attachmentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Attachment name is required."),
  url: z.string().min(1, "URL is required.").refine(
    (val) => val.trim() === '#' || z.string().url().safeParse(val).success,
    { message: "Must be a valid URL or use '#' for no link." }
  ),
});

const lessonSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Lesson title is required."),
  videoUrl: z.string().url("Please provide a valid video file URL."),
  description: z.string().min(1, "Lesson description is required."),
  attachments: z.array(attachmentSchema),
});

const moduleSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Module title is required."),
  lessons: z.array(lessonSchema),
});

const courseSchema = z.object({
  title: z.string().min(2, "Title is required."),
  description: z.string().min(10, "Description is required."),
  price: z.string().min(1, "Price is required."),
  value: z.string().min(1, "URL value is required (e.g., 'lmv')."),
  icon: z.string().min(1, "Icon name from lucide-react is required."),
  modules: z.array(moduleSchema).optional(),
});

type CourseFormValues = z.infer<typeof courseSchema>;

export default function EditCoursePage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      modules: [],
      title: "",
      description: "",
      price: "",
      value: "",
    }
  });
  
  const { fields: moduleFields, append: appendModule, remove: removeModule } = useFieldArray({
    control: form.control,
    name: "modules",
  });

  useEffect(() => {
    if (courseId) {
      setIsFetching(true);
      getCourse(courseId)
        .then(course => {
            if (course) {
                form.reset({
                  ...course,
                  modules: course.modules || [],
                });
            } else {
                toast({ variant: "destructive", title: "Course not found" })
                router.push("/admin/courses");
            }
        })
        .catch(error => {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch course data." })
        })
        .finally(() => setIsFetching(false));
    }
  }, [courseId, form, router, toast]);

  const onSubmit: SubmitHandler<CourseFormValues> = async (data) => {
    setIsLoading(true);
    try {
        await updateCourse(courseId, data);
        toast({ title: "Course Updated Successfully" });
        router.push("/admin/courses");
    } catch (error) {
        toast({ variant: "destructive", title: "Update Failed" });
    } finally {
        setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div><Skeleton className="h-10 w-48 mb-6" /><Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card></div>
  }

  return (
    <div>
      <div className="mb-6"><Button asChild variant="outline"><Link href="/admin/courses"><ArrowLeft />Back to All Courses</Link></Button></div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Course Details</CardTitle><CardDescription>Update the core information for this course.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <InputField control={form.control} name="title" label="Title" isRequired />
              <TextareaField control={form.control} name="description" label="Description" rows={4} isRequired />
              <div className="grid md:grid-cols-2 gap-6">
                <InputField control={form.control} name="price" label="Price" placeholder="e.g., Free or ₹15,000" isRequired />
                <InputField control={form.control} name="value" label="Enroll Link Value" isRequired />
              </div>
              <InputField
                control={form.control}
                name="icon"
                label="Lucide Icon Name"
                placeholder="e.g., Car, Truck, Bike"
                description="Enter any valid icon name from lucide.dev."
                isRequired
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div><CardTitle>Course Content</CardTitle><CardDescription>Manage modules and lessons for this course.</CardDescription></div>
                <Button type="button" variant="outline" onClick={() => appendModule({ id: nanoid(), title: '', lessons: [] })}><PlusCircle /> Add Module</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full space-y-4">
                {moduleFields.map((moduleItem, moduleIndex) => (
                  <AccordionItem value={moduleItem.id} key={moduleItem.id} className="border rounded-md p-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <AccordionTrigger className="flex-1 text-lg font-semibold hover:no-underline">Module {moduleIndex + 1}: {form.watch(`modules.${moduleIndex}.title`)}</AccordionTrigger>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeModule(moduleIndex)}><Trash2 className="text-destructive" /></Button>
                    </div>
                    <AccordionContent className="pt-4 space-y-4">
                      <InputField control={form.control} name={`modules.${moduleIndex}.title`} label="Module Title" isRequired />
                      <LessonArray moduleIndex={moduleIndex} form={form} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
          
          <div className="flex justify-end"><Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : <Save />}Save Changes</Button></div>
        </form>
      </Form>
    </div>
  );
}

function LessonArray({ moduleIndex, form }: { moduleIndex: number, form: any }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `modules.${moduleIndex}.lessons`
  });
  return (
    <div className="space-y-4 pl-4 border-l-2 ml-2">
      <h4 className="font-semibold">Lessons</h4>
      {fields.map((lesson, lessonIndex) => (
        <Card key={lesson.id} className="p-4 bg-background">
          <div className="flex justify-between items-center mb-4">
            <h5 className="font-semibold">Lesson {lessonIndex + 1}</h5>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(lessonIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
          <div className="space-y-4">
            <InputField control={form.control} name={`modules.${moduleIndex}.lessons.${lessonIndex}.title`} label="Title" isRequired />
            <InputField control={form.control} name={`modules.${moduleIndex}.lessons.${lessonIndex}.videoUrl`} label="Video URL" isRequired />
            <TextareaField control={form.control} name={`modules.${moduleIndex}.lessons.${lessonIndex}.description`} label="Description" isRequired />
            <AttachmentArray moduleIndex={moduleIndex} lessonIndex={lessonIndex} form={form} />
          </div>
        </Card>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={() => append({ id: nanoid(), title: '', videoUrl: '', description: '', attachments: [] })}>Add Lesson</Button>
    </div>
  );
}

function AttachmentArray({ moduleIndex, lessonIndex, form }: { moduleIndex: number, lessonIndex: number, form: any}) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: `modules.${moduleIndex}.lessons.${lessonIndex}.attachments`
    });
    return (
        <div className="space-y-2">
             <h6 className="font-semibold text-sm">Attachments</h6>
            {fields.map((attachment, attachmentIndex) => (
                <div key={attachment.id} className="flex items-end gap-2 p-2 border rounded-md">
                   <InputField control={form.control} name={`modules.${moduleIndex}.lessons.${lessonIndex}.attachments.${attachmentIndex}.name`} label="Name" isRequired />
                   <InputField control={form.control} name={`modules.${moduleIndex}.lessons.${lessonIndex}.attachments.${attachmentIndex}.url`} label="URL" isRequired />
                   <Button type="button" variant="ghost" size="icon" onClick={() => remove(attachmentIndex)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => append({ id: nanoid(), name: '', url: ''})}>Add Attachment</Button>
        </div>
    )
}
