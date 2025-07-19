"use client";

import { useForm, useFieldArray, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, BookCopy, PlusCircle, Trash2 } from "lucide-react";
import { nanoid } from 'nanoid';
import { useState, useEffect } from "react";
import { getSiteSettings, saveSiteSettings, type SiteSettings } from "@/services/settingsService";
import { seedDefaultCourses } from "@/services/coursesService";
import { seedDefaultInstructors } from "@/services/instructorsService";
import { seedDefaultStudents } from "@/services/studentsService";
import { seedDefaultTestimonials } from "@/services/testimonialsService";
import { seedDefaultTrainingServices, seedDefaultOnlineServices } from "@/services/quickServicesService";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputField } from "@/components/form/input-field";
import { TextareaField } from "@/components/form/textarea-field";

const whyChooseUsPointSchema = z.object({
  icon: z.string().min(1, "Icon name is required."),
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  id: z.string().optional(),
});

const adminEmailSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
});

const settingsSchema = z.object({
  // General
  schoolName: z.string().min(1, "School name is required."),
  contactEmail: z.string().email("Please enter a valid email."),
  phone: z.string().min(10, "Please enter a valid phone number."),
  address: z.string().min(10, "Address is required."),
  whatsappNumber: z.string().min(10, "Please enter a valid WhatsApp number."),
  adminEmails: z.array(adminEmailSchema).min(1, "At least one admin email is required."),
  // Homepage
  homepageHeroTitle: z.string().min(1, "Hero title is required."),
  homepageHeroSubtitle: z.string().min(1, "Hero subtitle is required."),
  homepageAboutTitle: z.string().min(1, "About section title is required."),
  homepageAboutText1: z.string().min(10, "About text paragraph 1 is required."),
  homepageAboutText2: z.string().min(10, "About text paragraph 2 is required."),
  // About Page
  aboutPageTitle: z.string().min(1),
  aboutPageSubtitle: z.string().min(1),
  aboutPageText1: z.string().min(1),
  aboutPageText2: z.string().min(1),
  whyChooseUsPoints: z.array(whyChooseUsPointSchema),
  // Section Titles
  whyChooseUsTitle: z.string().min(1),
  whyChooseUsSubtitle: z.string().min(1),
  galleryTitle: z.string().min(1),
  gallerySubtitle: z.string().min(1),
  quickServicesTitle: z.string().min(1),
  quickServicesSubtitle: z.string().min(1),
  onlineToolsTitle: z.string().min(1),
  onlineToolsSubtitle: z.string().min(1),
  videoSectionTitle: z.string().min(1),
  videoSectionSubtitle: z.string().min(1),
  ctaTitle: z.string().min(1),
  ctaDescription: z.string().min(1),
  // Developer Note
  developerNoteTitle: z.string().min(1, "Developer note title is required."),
  developerNoteText: z.string().min(10, "Developer note text is required."),
  developerAvatarUrl: z.string().url("Please enter a valid URL."),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

function SettingsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-10 w-1/4" />
                <div className="border p-4 space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                        <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                    </div>
                    <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-24 w-full" /></div>
                </div>
                <div className="flex justify-end">
                    <Skeleton className="h-10 w-36" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  const { fields: whyChooseUsFields, append: appendWhyChooseUs, remove: removeWhyChooseUs } = useFieldArray({
    control: form.control,
    name: "whyChooseUsPoints",
  });
  
  const { fields: adminEmailFields, append: appendAdminEmail, remove: removeAdminEmail } = useFieldArray({
    control: form.control,
    name: "adminEmails",
  });

  useEffect(() => {
    async function fetchSettings() {
      setIsFetching(true);
      try {
        const settings = await getSiteSettings();
        if (settings) {
            form.reset({
              ...settings,
              adminEmails: settings.adminEmails.map(email => ({ email })),
              whyChooseUsPoints: settings.whyChooseUsPoints.map(p => ({...p, id: nanoid()}))
            });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Failed to load settings",
          description: "Could not fetch site settings from the database.",
        });
      } finally {
        setIsFetching(false);
      }
    }
    fetchSettings();
  }, [form, toast]);


  const onSubmit: SubmitHandler<SettingsFormValues> = async (data) => {
    setIsLoading(true);
    try {
        const settingsToSave: Partial<SiteSettings> = {
            schoolName: data.schoolName,
            contactEmail: data.contactEmail,
            phone: data.phone,
            address: data.address,
            whatsappNumber: data.whatsappNumber,
            homepageHeroTitle: data.homepageHeroTitle,
            homepageHeroSubtitle: data.homepageHeroSubtitle,
            homepageAboutTitle: data.homepageAboutTitle,
            homepageAboutText1: data.homepageAboutText1,
            homepageAboutText2: data.homepageAboutText2,
            whyChooseUsTitle: data.whyChooseUsTitle,
            whyChooseUsSubtitle: data.whyChooseUsSubtitle,
            galleryTitle: data.galleryTitle,
            gallerySubtitle: data.gallerySubtitle,
            quickServicesTitle: data.quickServicesTitle,
            quickServicesSubtitle: data.quickServicesSubtitle,
            onlineToolsTitle: data.onlineToolsTitle,
            onlineToolsSubtitle: data.onlineToolsSubtitle,
            videoSectionTitle: data.videoSectionTitle,
            videoSectionSubtitle: data.videoSectionSubtitle,
            ctaTitle: data.ctaTitle,
            ctaDescription: data.ctaDescription,
            developerNoteTitle: data.developerNoteTitle,
            developerNoteText: data.developerNoteText,
            developerAvatarUrl: data.developerAvatarUrl,
            aboutPageTitle: data.aboutPageTitle,
            aboutPageSubtitle: data.aboutPageSubtitle,
            aboutPageText1: data.aboutPageText1,
            aboutPageText2: data.aboutPageText2,
            adminEmails: data.adminEmails.map(item => item.email),
            whyChooseUsPoints: data.whyChooseUsPoints.map(point => ({
                icon: point.icon,
                title: point.title,
                description: point.description,
            })),
        };

        await saveSiteSettings(settingsToSave);
        toast({
            title: "Settings Saved",
            description: "Your changes have been successfully saved. It may take a moment for them to apply.",
        });
    } catch (error) {
        console.error("Settings save error:", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not save settings to the database. Check console for details.",
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleSeed = async (seedFunction: () => Promise<number>, name: string) => {
    setIsSeeding(true);
    try {
        const count = await seedFunction();
        if (count > 0) {
            toast({
                title: `${name} Seeded`,
                description: `${count} default ${name.toLowerCase()} have been added.`,
            });
        } else {
            toast({
                title: "Already Seeded",
                description: `All default ${name.toLowerCase()} are already in the database.`,
            });
        }
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Seeding Failed",
            description: `Could not seed default ${name.toLowerCase()}.`,
        });
    } finally {
        setIsSeeding(false);
    }
  };

  if (isFetching) {
    return (
         <div>
            <h1 className="text-3xl font-bold mb-6">Settings</h1>
            <SettingsSkeleton />
         </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Seed Default Data</CardTitle>
                <CardDescription>
                    If your site is missing content, use these buttons to populate it with defaults. This action will not overwrite existing data.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
                 <Button onClick={() => handleSeed(seedDefaultCourses, 'Courses')} variant="outline" disabled={isSeeding}>
                    {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookCopy className="mr-2 h-4 w-4" />}
                    Seed Courses
                </Button>
                <Button onClick={() => handleSeed(seedDefaultInstructors, 'Instructors')} variant="outline" disabled={isSeeding}>
                    {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookCopy className="mr-2 h-4 w-4" />}
                    Seed Instructors
                </Button>
                <Button onClick={() => handleSeed(seedDefaultStudents, 'Students')} variant="outline" disabled={isSeeding}>
                    {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookCopy className="mr-2 h-4 w-4" />}
                    Seed Students
                </Button>
                <Button onClick={() => handleSeed(seedDefaultTestimonials, 'Testimonials')} variant="outline" disabled={isSeeding}>
                    {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookCopy className="mr-2 h-4 w-4" />}
                    Seed Testimonials
                </Button>
                 <Button onClick={() => handleSeed(seedDefaultTrainingServices, 'Training Services')} variant="outline" disabled={isSeeding}>
                    {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookCopy className="mr-2 h-4 w-4" />}
                    Seed Training Services
                </Button>
                <Button onClick={() => handleSeed(seedDefaultOnlineServices, 'Online Services')} variant="outline" disabled={isSeeding}>
                    {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BookCopy className="mr-2 h-4 w-4" />}
                    Seed Online Services
                </Button>
            </CardContent>
        </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="general">
                <TabsList className="flex-wrap h-auto">
                    <TabsTrigger value="general">General & Auth</TabsTrigger>
                    <TabsTrigger value="homepage">Homepage Main</TabsTrigger>
                    <TabsTrigger value="about">About Page</TabsTrigger>
                    <TabsTrigger value="sections">Section Titles</TabsTrigger>
                    <TabsTrigger value="developer">Developer Note</TabsTrigger>
                </TabsList>
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Site Information</CardTitle>
                            <CardDescription>
                                Manage site-wide information and contact details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <InputField control={form.control} name="schoolName" label="School Name" isRequired />
                            <div className="grid md:grid-cols-2 gap-6">
                                <InputField control={form.control} name="contactEmail" label="Contact Email" type="email" isRequired />
                                <InputField control={form.control} name="phone" label="Public Phone Number" isRequired />
                            </div>
                            <InputField control={form.control} name="whatsappNumber" label="WhatsApp Number" description="Include country code without '+', e.g., 919876543210" isRequired />
                            <TextareaField control={form.control} name="address" label="School Address" rows={4} isRequired />
                            
                             <div>
                                <h3 className="text-lg font-medium">Administrator Emails</h3>
                                <p className="text-sm text-muted-foreground mb-4">Manage which email addresses have administrative access to this panel.</p>
                                <div className="space-y-4">
                                    {adminEmailFields.map((field, index) => (
                                        <div key={field.id} className="flex items-end gap-2">
                                            <div className="flex-grow">
                                                <InputField
                                                    control={form.control}
                                                    name={`adminEmails.${index}.email`}
                                                    label={index === 0 ? "Admin Emails" : ""}
                                                    placeholder="admin@example.com"
                                                    isRequired
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => removeAdminEmail(index)}
                                                disabled={adminEmailFields.length <= 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => appendAdminEmail({ email: "" })}
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Admin
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="homepage">
                     <Card>
                        <CardHeader>
                            <CardTitle>Homepage Hero & About</CardTitle>
                            <CardDescription>
                                Edit the text for the main sections on the homepage.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <InputField control={form.control} name="homepageHeroTitle" label="Hero Section Title" isRequired />
                            <TextareaField control={form.control} name="homepageHeroSubtitle" label="Hero Section Subtitle" rows={2} isRequired />
                            <InputField control={form.control} name="homepageAboutTitle" label="About Section Title" isRequired />
                            <TextareaField control={form.control} name="homepageAboutText1" label="About Section - Paragraph 1" rows={4} isRequired />
                            <TextareaField control={form.control} name="homepageAboutText2" label="About Section - Paragraph 2" rows={4} isRequired />
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="about">
                    <Card>
                        <CardHeader>
                            <CardTitle>About Us Page Content</CardTitle>
                            <CardDescription>
                                Manage the content displayed on the dedicated About Us page.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <InputField control={form.control} name="aboutPageTitle" label="About Page Title" />
                            <TextareaField control={form.control} name="aboutPageSubtitle" label="About Page Subtitle" rows={2} />
                            <TextareaField control={form.control} name="aboutPageText1" label="About Page - Paragraph 1" rows={4} />
                            <TextareaField control={form.control} name="aboutPageText2" label="About Page - Paragraph 2" rows={4} />
                        </CardContent>
                    </Card>
                    <Card className="mt-6">
                      <CardHeader>
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle>Why Choose Us Points</CardTitle>
                            <CardDescription>Edit the points that appear in the 'Why Choose Us' section.</CardDescription>
                          </div>
                          <Button type="button" variant="outline" onClick={() => appendWhyChooseUs({ id: nanoid(), icon: 'Car', title: '', description: '' })}>
                            <PlusCircle className="mr-2 h-4 w-4"/> Add Point
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {whyChooseUsFields.map((field, index) => (
                          <Card key={field.id} className="p-4 bg-muted/30">
                            <div className="grid md:grid-cols-2 gap-4">
                              <InputField control={form.control} name={`whyChooseUsPoints.${index}.title`} label="Title" isRequired />
                              <InputField control={form.control} name={`whyChooseUsPoints.${index}.icon`} label="Lucide Icon Name" isRequired />
                            </div>
                            <TextareaField control={form.control} name={`whyChooseUsPoints.${index}.description`} label="Description" isRequired />
                            <Button type="button" variant="destructive" size="sm" className="mt-2" onClick={() => removeWhyChooseUs(index)}>
                              <Trash2 className="mr-2 h-4 w-4"/> Remove Point
                            </Button>
                          </Card>
                        ))}
                      </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="sections">
                    <Card>
                        <CardHeader>
                            <CardTitle>Homepage Section Titles</CardTitle>
                            <CardDescription>
                                Manage the titles and subtitles for various sections on the homepage.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                            <InputField control={form.control} name="whyChooseUsTitle" label="Why Choose Us: Title" />
                            <TextareaField control={form.control} name="whyChooseUsSubtitle" label="Why Choose Us: Subtitle" rows={2} />
                            <InputField control={form.control} name="galleryTitle" label="Gallery: Title" />
                            <TextareaField control={form.control} name="gallerySubtitle" label="Gallery: Subtitle" rows={2} />
                            <InputField control={form.control} name="quickServicesTitle" label="Driving Services: Title" />
                            <TextareaField control={form.control} name="quickServicesSubtitle" label="Driving Services: Subtitle" rows={2} />
                            <InputField control={form.control} name="onlineToolsTitle" label="Online Tools: Title" />
                            <TextareaField control={form.control} name="onlineToolsSubtitle" label="Online Tools: Subtitle" rows={2} />
                            <InputField control={form.control} name="videoSectionTitle" label="Videos: Title" />
                            <TextareaField control={form.control} name="videoSectionSubtitle" label="Videos: Subtitle" rows={2} />
                            <InputField control={form.control} name="ctaTitle" label="Call To Action: Title" />
                            <TextareaField control={form.control} name="ctaDescription" label="Call To Action: Description" rows={2} />
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="developer">
                    <Card>
                        <CardHeader>
                            <CardTitle>Developer Note Section</CardTitle>
                            <CardDescription>
                                Manage the developer's note section on the homepage.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <InputField control={form.control} name="developerNoteTitle" label="Note Title" isRequired />
                            <TextareaField control={form.control} name="developerNoteText" label="Note Text" rows={5} isRequired />
                            <InputField control={form.control} name="developerAvatarUrl" label="Avatar Image URL" type="url" isRequired />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
             <div className="flex justify-end">
                <Button type="submit" disabled={isLoading || isSeeding}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save All Changes
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
