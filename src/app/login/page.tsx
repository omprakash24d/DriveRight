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
import { signInWithEmailAndPassword, type AuthError } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { InputField } from "@/components/form/input-field";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function StudentLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    form.setFocus("email");
  }, [form]);

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({ title: "Login Successful", description: "Welcome back!" });
      router.push("/dashboard");
    } catch (error: any) {
      const authError = error as AuthError;
      console.error("Login error:", authError.code);

      let errorMessage = "An unexpected error occurred. Please try again.";
      if (
        authError.code === "auth/invalid-credential" ||
        authError.code === "auth/wrong-password" ||
        authError.code === "auth/user-not-found"
      ) {
        errorMessage = "Invalid credentials. Please check your email and password.";
        form.setError("email", { type: "manual", message: " " });
        form.setError("password", { type: "manual", message: errorMessage });
        form.setFocus("password");
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: errorMessage,
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
          <div className="mb-4 flex justify-center">
            <Car className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Student Login</CardTitle>
          <CardDescription>Access your dashboard and courses.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                isRequired
              />
              <div className="text-right text-sm">
                <Link href="/forgot-password" className="underline hover:text-primary">
                  Forgot Password?
                </Link>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !form.formState.isDirty || !form.formState.isValid}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline hover:text-primary">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
