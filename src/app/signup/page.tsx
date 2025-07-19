
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Car, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile, type AuthError } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { createStudentUserInDb } from "@/services/studentsService";
import { InputField } from "@/components/form/input-field";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character."),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function StudentSignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    useEffect(() => {
        form.setFocus("name");
    }, [form]);

    const onSubmit: SubmitHandler<SignupFormValues> = async (data) => {
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
            
            await updateProfile(userCredential.user, { displayName: data.name });

            await createStudentUserInDb(userCredential.user, data.name);

            toast({ title: "Account Created!", description: "You have been successfully registered." });
            router.push('/dashboard');
            
        } catch (error: any) {
            const authError = error as AuthError;
            console.error("Signup error:", authError.code);
            
            if (authError.code === 'auth/email-already-in-use') {
                form.setError("email", {
                    type: "manual",
                    message: "This email is already registered. Please log in instead.",
                });
                form.setFocus("email");
            } else {
                 toast({
                    variant: "destructive",
                    title: "Signup Failed",
                    description: "An unexpected error occurred. Please try again.",
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Car className="h-10 w-10 text-primary" />
            </div>
          <CardTitle className="text-2xl">Create Student Account</CardTitle>
          <CardDescription>
            Join Driving School Arwal to access courses and track your progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <InputField
                control={form.control}
                name="name"
                label="Full Name"
                placeholder="Enter Your Name"
                isRequired
              />
              <InputField
                control={form.control}
                name="email"
                label="Email"
                type="email"
                placeholder="student@example.com"
                isRequired
              />
              <InputField
                control={form.control}
                name="password"
                label="Password"
                type="password"
                placeholder="••••••••"
                description="8+ characters, with uppercase, lowercase, number, and special character."
                isRequired
              />
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !form.formState.isDirty || !form.formState.isValid}
              >
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?&nbsp;
              <Link href="/login" className="underline hover:text-primary">
                  Login
              </Link>
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
