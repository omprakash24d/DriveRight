"use client";

import { EnhancedDatePickerField } from "@/components/form/enhanced-date-picker-field";
import { EnhancedPhotoUpload } from "@/components/form/enhanced-photo-upload";
import { FileField } from "@/components/form/file-field";
import { InputField } from "@/components/form/input-field";
import { SelectField } from "@/components/form/select-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ACCEPTED_DOCUMENT_TYPES,
  indianStates,
  MAX_FILE_SIZE,
} from "@/lib/constants";
import { getPriceInfo } from "@/lib/priceUtils";
import { resizeImage } from "@/lib/utils";
import { getCourses, type Course } from "@/services/coursesService";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, CreditCard, Info, Loader2, UserPlus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { ImageCropDialog } from "./ImageCropDialog";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const enrollmentSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters.")
    .max(100, "Full name must be less than 100 characters.")
    .regex(/^[a-zA-Z\s]+$/, "Full name can only contain letters and spaces."),
  email: z
    .string()
    .email("Please enter a valid email address.")
    .max(255, "Email address is too long."),
  mobileNumber: z
    .string()
    .regex(
      /^[6-9]\d{9}$/,
      "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9."
    )
    .length(10, "Mobile number must be exactly 10 digits."),
  dateOfBirth: z
    .date({
      required_error: "A date of birth is required.",
    })
    .refine((date) => {
      const today = new Date();
      const minAge = 16;
      const maxAge = 100;
      const age = today.getFullYear() - date.getFullYear();
      return age >= minAge && age <= maxAge;
    }, "Age must be between 16 and 100 years."),
  state: z
    .string({ required_error: "Please select a state." })
    .min(1, "Please select a state."),
  address: z
    .string()
    .min(10, "Please enter a full address (minimum 10 characters).")
    .max(500, "Address is too long (maximum 500 characters)."),
  vehicleType: z.enum(["hmv", "lmv", "mcwg", "lmv+mcwg", "others"], {
    required_error: "Please select a vehicle type.",
  }),
  documentId: z.string().optional(),
  idProof: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, "ID Proof is required.")
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      `Max file size is 10MB.`
    )
    .refine(
      (files) => ACCEPTED_DOCUMENT_TYPES.includes(files?.[0]?.type),
      ".jpg, .jpeg, .png and .pdf files are accepted."
    ),
  photoOriginal: z.string().min(1, "Original photo is required."),
  photoCropped: z.string().min(1, "Cropped photo is required."),
});

type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;

export function EnrollmentFormComponent() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCoursesLoading, setIsCoursesLoading] = useState(true);
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean;
    refId: string;
  } | null>(null);
  const searchParams = useSearchParams();
  const { user, userProfile } = useAuth();

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  const defaultVehicleType = useMemo(() => {
    const vehicleType = searchParams.get("vehicleType");
    if (
      vehicleType &&
      ["hmv", "lmv", "mcwg", "lmv+mcwg", "others"].includes(vehicleType)
    ) {
      return vehicleType as EnrollmentFormValues["vehicleType"];
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

  const selectedVehicleType = form.watch("vehicleType");

  const selectedCourse = useMemo(() => {
    if (!selectedVehicleType || courses.length === 0) return null;
    return courses.find((c) => c.value === selectedVehicleType);
  }, [selectedVehicleType, courses]);

  const isFreeCourse = useMemo(() => {
    if (!selectedCourse) return true;
    return getPriceInfo(selectedCourse.price).isFree;
  }, [selectedCourse]);

  useEffect(() => {
    setIsCoursesLoading(true);
    getCourses()
      .then((result) => {
        if (result && result.success && Array.isArray(result.data)) {
          setCourses(result.data);
        } else {
          setCourses([]);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load course details.",
          });
        }
      })
      .catch(() => {
        setCourses([]);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load course details.",
        });
      })
      .finally(() => {
        setIsCoursesLoading(false);
      });
  }, [toast]);

  useEffect(() => {
    if (defaultVehicleType) {
      form.setValue("vehicleType", defaultVehicleType, {
        shouldValidate: true,
      });
    }
  }, [defaultVehicleType, form]);

  useEffect(() => {
    if (userProfile) {
      form.setValue("fullName", userProfile.name || "");
      form.setValue("email", userProfile.email || "");
    }
  }, [userProfile, form]);

  const handlePhotoSelect = useCallback(
    async (file: File) => {
      try {
        const imageDataUrl = await resizeImage(file, 800);
        form.setValue("photoOriginal", imageDataUrl);
        setImageToCrop(imageDataUrl);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Image Error",
          description: "Could not process the image.",
        });
        throw error; // Re-throw to be handled by the enhanced component
      }
    },
    [form, toast]
  );

  const submitFormData = useCallback(
    async (
      data: EnrollmentFormValues,
      paymentId?: string,
      orderId?: string
    ) => {
      setIsLoading(true);

      try {
        // Additional client-side validation
        if (!data.photoCropped || !data.photoOriginal) {
          throw new Error(
            "Photo upload is required. Please upload and crop your photo."
          );
        }

        if (!data.idProof || data.idProof.length === 0) {
          throw new Error("ID Proof upload is required.");
        }

        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (
            key === "idProof" ||
            key === "photoOriginal" ||
            key === "photoCropped"
          )
            return;
          if (key === "documentId") {
            formData.append("documentId", value ? String(value) : "");
          } else if (key === "paymentId") {
            formData.append("paymentId", value ? String(value) : "");
          } else if (key === "orderId") {
            formData.append("orderId", value ? String(value) : "");
          } else if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else if (value) {
            formData.append(key, value as string);
          }
        });

        formData.append("idProof", data.idProof[0]);
        formData.append("photoOriginal", data.photoOriginal);
        formData.append("photoCropped", data.photoCropped);
        formData.append(
          "documentId",
          data.documentId ? String(data.documentId) : ""
        );
        formData.append("paymentId", paymentId ? String(paymentId) : "");
        formData.append("orderId", orderId ? String(orderId) : "");
        if (selectedCourse?.price)
          formData.append("pricePaid", selectedCourse.price);

        const response = await fetch("/enroll/api", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          // Handle specific error cases
          if (response.status === 400) {
            throw new Error(
              result.message || "Invalid form data. Please check all fields."
            );
          } else if (response.status === 413) {
            throw new Error(
              "File too large. Please reduce file size and try again."
            );
          } else if (response.status >= 500) {
            throw new Error("Server error. Please try again later.");
          } else {
            throw new Error(
              result.message || "An error occurred during submission."
            );
          }
        }

        setSubmissionResult({ success: true, refId: result.refId });
        toast({
          title: "Enrollment Submitted!",
          description:
            "Thank you for enrolling. Please check your email for confirmation.",
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
    },
    [form, toast, selectedCourse]
  );

  const handlePayment = useCallback(
    async (formData: EnrollmentFormValues) => {
      setIsLoading(true);
      try {
        if (!selectedCourse || !selectedCourse.price)
          throw new Error("Course price is not available.");

        const amountInPaise =
          parseInt(
            String(selectedCourse.price || "").replace(/[^0-9]/g, "") || "0"
          ) * 100;
        if (isNaN(amountInPaise) || amountInPaise <= 0)
          throw new Error("Invalid course price.");

        const orderResponse = await fetch("/api/payment/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amountInPaise, currency: "INR" }),
        });

        if (!orderResponse.ok)
          throw new Error("Failed to create payment order.");

        const order = await orderResponse.json();

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: "Driving School Arwal",
          description: `Payment for ${selectedCourse.title}`,
          order_id: order.id,
          handler: async (response: any) => {
            await submitFormData(
              formData,
              response.razorpay_payment_id,
              response.razorpay_order_id
            );
          },
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.mobileNumber,
          },
          theme: { color: "#2563EB" },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          toast({
            variant: "destructive",
            title: "Payment Failed",
            description: response.error.description || "Something went wrong.",
          });
          setIsLoading(false);
        });
        rzp.open();
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Payment Initialization Failed",
          description: error.message,
        });
        setIsLoading(false);
      }
    },
    [selectedCourse, submitFormData, toast]
  );

  const onSubmit: SubmitHandler<EnrollmentFormValues> = useCallback(
    async (data) => {
      try {
        // Validate all required fields before submission
        const validation = enrollmentSchema.safeParse(data);
        if (!validation.success) {
          const firstError = validation.error.errors[0];
          toast({
            variant: "destructive",
            title: "Validation Error",
            description: firstError.message,
          });
          return;
        }

        if (isFreeCourse) {
          await submitFormData(data);
        } else {
          await handlePayment(data);
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Submission Error",
          description:
            error.message || "Please check all fields and try again.",
        });
      }
    },
    [isFreeCourse, submitFormData, handlePayment, toast]
  );

  if (submissionResult?.success) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 flex items-center justify-center">
        <Card className="w-full max-w-md text-center p-6">
          <CardHeader>
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl mt-4">
              Enrollment Successful!
            </CardTitle>
            <CardDescription>
              Your application has been received. Please save your reference
              number for future communication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" aria-live="polite">
            <div className="bg-secondary p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Your Reference Number
              </p>
              <p className="text-2xl font-bold text-primary">
                {submissionResult.refId}
              </p>
            </div>
            <Button
              onClick={() => setSubmissionResult(null)}
              className="w-full"
            >
              Enroll Another Student
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-16 md:py-24">
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      <div className="max-w-3xl mx-auto">
        {imageToCrop && (
          <ImageCropDialog
            imageUrl={imageToCrop}
            onCrop={(croppedImageUrl) => {
              form.setValue("photoCropped", croppedImageUrl, {
                shouldValidate: true,
              });
              setImageToCrop(null);
            }}
            onClose={() => {
              form.setValue("photoOriginal", "", { shouldValidate: true });
              form.setValue("photoCropped", "", { shouldValidate: true });
              setImageToCrop(null);
            }}
          />
        )}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Enrollment Application</CardTitle>
            <CardDescription>
              Complete the form below to begin your journey with Driving School
              Arwal. Fields marked with an asterisk (*) are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCourse && (
              <Alert className="mb-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Confirm Your Course Selection</AlertTitle>
                <AlertDescription>
                  You have selected the{" "}
                  <span className="font-semibold">{selectedCourse.title}</span>{" "}
                  course. The total cost is{" "}
                  <span className="font-semibold">{selectedCourse.price}</span>.
                </AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <fieldset
                  disabled={isLoading || isCoursesLoading}
                  className="space-y-6"
                >
                  <InputField
                    control={form.control}
                    name="fullName"
                    label="Full Name"
                    placeholder="Enter your complete legal name"
                    isRequired
                    description="Enter your name exactly as it appears on your ID proof"
                  />

                  <div className="grid md:grid-cols-2 gap-6">
                    <InputField
                      control={form.control}
                      name="email"
                      label="Email Address"
                      type="email"
                      placeholder="yourname@example.com"
                      isRequired
                      description="We'll use this to send your certificate and updates"
                    />
                    <InputField
                      control={form.control}
                      name="mobileNumber"
                      label="Mobile Number"
                      placeholder="9876543210"
                      isRequired
                      description="10-digit Indian mobile number (without +91)"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <EnhancedDatePickerField
                      control={form.control}
                      name="dateOfBirth"
                      label="Date of Birth"
                      description="Enter your date of birth (DD/MM/YYYY format)"
                      isRequired
                      captionLayout="dropdown"
                      fromYear={1950}
                      toYear={new Date().getFullYear()}
                    />
                    <SelectField
                      control={form.control}
                      name="state"
                      label="State"
                      placeholder="Select your state"
                      items={indianStates.map((state) => ({
                        value: state,
                        label: state,
                      }))}
                      isRequired
                    />
                  </div>

                  <InputField
                    control={form.control}
                    name="address"
                    label="Full Address"
                    placeholder="House/Flat No., Street, Area, City, PIN Code"
                    isRequired
                    description="Complete postal address including PIN code"
                  />

                  <SelectField
                    control={form.control}
                    name="vehicleType"
                    label="Vehicle Type"
                    placeholder={
                      isCoursesLoading
                        ? "Loading courses..."
                        : "Choose a vehicle type..."
                    }
                    items={courses.map((c) => ({
                      value: c.value,
                      label: c.title,
                    }))}
                    isRequired
                  />
                  <InputField
                    control={form.control}
                    name="documentId"
                    label="Document ID Number (Optional)"
                    placeholder="e.g., Aadhaar, PAN, or other ID number"
                    description="This can help admins verify your identity faster."
                  />

                  <div className="grid md:grid-cols-2 gap-6 items-start">
                    <FileField
                      control={form.control}
                      name="idProof"
                      label="ID Proof Upload"
                      description="PDF, JPG, PNG. Max 10MB."
                      isRequired
                    />
                    <EnhancedPhotoUpload
                      onPhotoSelect={handlePhotoSelect}
                      photoUrl={form.watch("photoCropped")}
                      onRemove={() => {
                        form.setValue("photoOriginal", "");
                        form.setValue("photoCropped", "");
                      }}
                      isRequired
                      label="Photo Upload"
                      description="JPG, PNG. Max 10MB. Your photo will be cropped to fit ID requirements."
                      error={
                        form.formState.errors.photoCropped?.message ||
                        form.formState.errors.photoOriginal?.message
                      }
                      disabled={isLoading || isCoursesLoading}
                    />
                  </div>
                </fieldset>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading || isCoursesLoading}
                >
                  {isLoading || isCoursesLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : isFreeCourse ? (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Submit Enrollment
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay & Enroll
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
