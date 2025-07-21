
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormDescription, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, CheckCircle, UploadCloud, Info, CreditCard } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { InputField } from "@/components/form/input-field";
import { SelectField } from "@/components/form/select-field";
import { DatePickerField } from "@/components/form/date-picker-field";
import { FileField } from "@/components/form/file-field";
import { ImageCropDialog } from "./ImageCropDialog";
import Image from "next/image";
import { resizeImage } from "@/lib/utils";
import { indianStates, MAX_FILE_SIZE, ACCEPTED_DOCUMENT_TYPES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getCourses, type Course } from "@/services/coursesService";
import { useAuth } from "@/context/AuthContext";

declare global {
    interface Window {
        Razorpay: any;
    }
}

const enrollmentSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  mobileNumber: z.string().min(10, "Please enter a valid 10-digit mobile number.").max(15),
  dateOfBirth: z.date({
    required_error: "A date of birth is required.",
  }),
  state: z.string({ required_error: "Please select a state." }),
  address: z.string().min(10, "Please enter a full address."),
  vehicleType: z.enum(["hmv", "lmv", "mcwg", "lmv+mcwg", "others"], {
    required_error: "Please select a vehicle type.",
  }),
  documentId: z.string().optional(),
  idProof: z.custom<FileList>()
    .refine((files) => files?.length === 1, "ID Proof is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 10MB.`)
    .refine(
      (files) => ACCEPTED_DOCUMENT_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .pdf files are accepted."
    ),
  photoOriginal: z.string().min(1, 'Original photo is required.'),
  photoCropped: z.string().min(1, 'Cropped photo is required.'),
});

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;

export function EnrollmentFormComponent() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const [submissionResult, setSubmissionResult] = useState<{ success: boolean; refId: string } | null>(null);
  const searchParams = useSearchParams();
  const { user, userProfile } = useAuth();

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  const defaultVehicleType = useMemo(() => {
    const vehicleType = searchParams.get('vehicleType');
    if (vehicleType && ["hmv", "lmv", "mcwg", "lmv+mcwg", "others"].includes(vehicleType)) {
      return vehicleType as EnrollmentFormValues['vehicleType'];
    }
    return undefined;
  }, [searchParams]);

  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      fullName: "",
      email: "",
      mobileNumber: "",
      address: "",
      documentId: "",
      idProof: undefined,
      photoOriginal: "",
      photoCropped: "",
      vehicleType: defaultVehicleType,
    },
  });
  
  const selectedVehicleType = form.watch('vehicleType');

  const selectedCourse = useMemo(() => {
    if (!selectedVehicleType || courses.length === 0) return null;
    return courses.find(c => c.value === selectedVehicleType);
  }, [selectedVehicleType, courses]);

  const isFreeCourse = useMemo(() => {
    if (!selectedCourse) return true;
    return selectedCourse.price.toLowerCase() === 'free' || !/^\d/.test(selectedCourse.price);
  }, [selectedCourse]);

  useEffect(() => {
    setIsCoursesLoading(true);
    getCourses().then(setCourses).catch(() => {
        toast({ variant: "destructive", title: "Error", description: "Could not load course details." });
    }).finally(() => {
        setIsCoursesLoading(false);
    });
  }, [toast]);

  useEffect(() => {
    if (defaultVehicleType) {
      form.setValue('vehicleType', defaultVehicleType, { shouldValidate: true });
    }
  }, [defaultVehicleType, form]);

  useEffect(() => {
    if (userProfile) {
        form.setValue('fullName', userProfile.name || '');
        form.setValue('email', userProfile.email || '');
    }
  }, [userProfile, form]);

  const handlePhotoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const imageDataUrl = await resizeImage(file, 800);
        form.setValue('photoOriginal', imageDataUrl);
        setImageToCrop(imageDataUrl);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Image Error', description: 'Could not process the image.' });
      }
    }
  }, [form, toast]);

  const submitFormData = useCallback(async (data: EnrollmentFormValues, paymentId?: string, orderId?: string) => {
    setIsLoading(true);
    
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'idProof' || key === 'photoOriginal' || key === 'photoCropped') return;
      if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else if (value) {
        formData.append(key, value as string);
      }
    });

    formData.append('idProof', data.idProof[0]);
    formData.append('photoOriginal', data.photoOriginal);
    formData.append('photoCropped', data.photoCropped);
    if (paymentId) formData.append('paymentId', paymentId);
    if (orderId) formData.append('orderId', orderId);
    if (selectedCourse?.price) formData.append('pricePaid', selectedCourse.price);

    try {
        const response = await fetch('/enroll/api', {
            method: 'POST',
            body: formData,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "An error occurred.");

        setSubmissionResult({ success: true, refId: result.refId });
        toast({
            title: "Enrollment Submitted!",
            description: "Thank you for enrolling. Please check your email for confirmation.",
        });
        form.reset();
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: error.message,
        });
    } finally {
        setIsLoading(false);
    }
  }, [form, toast, selectedCourse]);

  const handlePayment = useCallback(async (formData: EnrollmentFormValues) => {
    setIsLoading(true);
    try {
      if (!selectedCourse || !selectedCourse.price) throw new Error("Course price is not available.");
      
      const amountInPaise = parseInt(selectedCourse.price.replace(/[^0-9]/g, '')) * 100;
      if (isNaN(amountInPaise) || amountInPaise <= 0) throw new Error("Invalid course price.");

      const orderResponse = await fetch('/api/payment/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: amountInPaise, currency: 'INR' }),
      });

      if (!orderResponse.ok) throw new Error('Failed to create payment order.');
      
      const order = await orderResponse.json();

      const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: "Driving School Arwal",
          description: `Payment for ${selectedCourse.title}`,
          order_id: order.id,
          handler: async (response: any) => {
              await submitFormData(formData, response.razorpay_payment_id, response.razorpay_order_id);
          },
          prefill: {
              name: formData.fullName,
              email: formData.email,
              contact: formData.mobileNumber,
          },
          theme: { color: "#2563EB" }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
          toast({ variant: 'destructive', title: 'Payment Failed', description: response.error.description || 'Something went wrong.' });
          setIsLoading(false);
      });
      rzp.open();

    } catch (error: any) {
        toast({ variant: "destructive", title: "Payment Initialization Failed", description: error.message });
        setIsLoading(false);
    }
  }, [selectedCourse, submitFormData, toast]);

  const onSubmit: SubmitHandler<EnrollmentFormValues> = useCallback(async (data) => {
    if (isFreeCourse) {
      await submitFormData(data);
    } else {
      await handlePayment(data);
    }
  }, [isFreeCourse, submitFormData, handlePayment]);


  if (submissionResult?.success) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-6">
            <CardHeader>
                <div className="flex justify-center">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle className="text-3xl mt-4">Enrollment Successful!</CardTitle>
                <CardDescription>
                    Your application has been received. Please save your reference number for future communication.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4" aria-live="polite">
                <div className="bg-secondary p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Your Reference Number</p>
                    <p className="text-2xl font-bold text-primary">{submissionResult.refId}</p>
                </div>
                <Button onClick={() => setSubmissionResult(null)} className="w-full">
                    Enroll Another Student
                </Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
      <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="max-w-3xl mx-auto">
        {imageToCrop && (
            <ImageCropDialog
                imageUrl={imageToCrop}
                onCrop={(croppedImageUrl) => {
                    form.setValue('photoCropped', croppedImageUrl, { shouldValidate: true });
                    setImageToCrop(null);
                }}
                onClose={() => {
                    form.setValue('photoOriginal', '', { shouldValidate: true });
                    form.setValue('photoCropped', '', { shouldValidate: true });
                    setImageToCrop(null);
                }}
            />
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Enrollment Application</CardTitle>
            <CardDescription>
              Complete the form below to begin your journey with Driving School Arwal. Fields marked with an asterisk (*) are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCourse && (
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Confirm Your Course Selection</AlertTitle>
                <AlertDescription>
                  You have selected the <span className="font-semibold">{selectedCourse.title}</span> course. The total cost is <span className="font-semibold">{selectedCourse.price}</span>.
                </AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <fieldset disabled={isLoading || isCoursesLoading} className="space-y-6">
                    <InputField control={form.control} name="fullName" label="Full Name" placeholder="Enter Your Full Name" isRequired />

                    <div className="grid md:grid-cols-2 gap-6">
                    <InputField control={form.control} name="email" label="Email Address" type="email" placeholder="abc@example.com" isRequired />
                    <InputField control={form.control} name="mobileNumber" label="Mobile Number" placeholder="Enter your Phone Number " isRequired />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                    <DatePickerField
                        control={form.control}
                        name="dateOfBirth"
                        label="Date of Birth"
                        isRequired
                        inputType="text"
                        captionLayout="dropdown"
                        fromYear={1950}
                        toYear={new Date().getFullYear()}
                        />
                    <SelectField
                        control={form.control}
                        name="state"
                        label="State"
                        placeholder="Select your state"
                        items={indianStates.map(state => ({ value: state, label: state }))}
                        isRequired
                        />
                    </div>
                    
                    <InputField control={form.control} name="address" label="Full Address" placeholder="123 Safety Drive, Roadtown" isRequired />

                    <SelectField
                        control={form.control}
                        name="vehicleType"
                        label="Vehicle Type"
                        placeholder={isCoursesLoading ? "Loading courses..." : "Choose a vehicle type..."}
                        items={courses.map(c => ({ value: c.value, label: c.title }))}
                        isRequired
                    />
                    <InputField control={form.control} name="documentId" label="Document ID Number (Optional)" placeholder="e.g., Aadhaar, PAN, or other ID number" description="This can help admins verify your identity faster." />
                    
                    <div className="grid md:grid-cols-2 gap-6 items-start">
                        <FileField
                            control={form.control}
                            name="idProof"
                            label="ID Proof Upload"
                            description="PDF, JPG, PNG. Max 10MB."
                            isRequired
                        />
                        <div>
                            <FormLabel>Photo Upload <span className="text-destructive">*</span></FormLabel>
                            {!form.watch('photoCropped') ? (
                            <label 
                                htmlFor="photo-upload" 
                                className="mt-2 relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                tabIndex={0}
                                role="button"
                                aria-label="Upload your photo"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        document.getElementById('photo-upload')?.click();
                                    }
                                }}
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Click or press Enter to upload</p>
                                </div>
                                <Input id="photo-upload" type="file" className="hidden" onChange={handlePhotoSelect} accept="image/png, image/jpeg" />
                            </label>
                            ) : (
                            <div className="mt-2 relative w-32 h-32">
                                <Image src={form.getValues('photoCropped')} alt="Photo preview" layout="fill" className="rounded-md object-cover"/>
                                <Button variant="destructive" size="sm" className="absolute -top-2 -right-2 rounded-full h-7 w-7" onClick={() => {
                                    form.setValue('photoOriginal', '');
                                    form.setValue('photoCropped', '');
                                }}>X</Button>
                            </div>
                            )}
                            <FormDescription>JPG, PNG. Max 10MB.</FormDescription>
                            <p className="text-sm font-medium text-destructive">{form.formState.errors.photoCropped?.message || form.formState.errors.photoOriginal?.message}</p>
                        </div>
                    </div>
                </fieldset>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading || isCoursesLoading}>
                  {isLoading || isCoursesLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                    isFreeCourse ? <><UserPlus className="mr-2 h-4 w-4" />Submit Enrollment</> : <><CreditCard className="mr-2 h-4 w-4" />Pay & Enroll</>
                  }
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
