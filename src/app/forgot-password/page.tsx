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
import { Car, Loader2, Send, MailCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail, type AuthError } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { InputField } from "@/components/form/input-field";

const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function StudentForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { toast } = useToast();

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    });

    useEffect(() => {
        form.setFocus("email");
    }, [form]);

    const onSubmit: SubmitHandler<ForgotPasswordFormValues> = async (data) => {
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, data.email);
            setIsSubmitted(true);
        } catch (error: any) {
            const authError = error as AuthError;
            console.error("Password reset error:", authError.code);

            // Prevent email enumeration
            if (authError.code === "auth/user-not-found") {
                setIsSubmitted(true);
            } else {
                toast({
                    variant: "destructive",
                    title: "Request Failed",
                    description:
                        "Could not send the password reset email. Please check your connection and try again.",
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
                    <CardTitle className="text-2xl">Forgot Your Password?</CardTitle>
                    <CardDescription>
                        {isSubmitted
                            ? "Check your inbox for a reset link."
                            : "No problem. Enter your email to receive a password reset link."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSubmitted ? (
                        <div className="flex flex-col items-center text-center p-4" aria-live="polite">
                            <MailCheck className="mb-4 h-16 w-16 text-green-500" />
                            <h3 className="mb-2 text-xl font-semibold">Check Your Email</h3>
                            <p className="text-sm text-muted-foreground">
                                If an account with that email exists, we&apos;ve sent instructions to reset your password.
                            </p>
                        </div>
                    ) : (
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
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading || !form.formState.isDirty || !form.formState.isValid}
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    Send Reset Link
                                </Button>
                            </form>
                        </Form>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center text-xs">
                    <Link href="/login" className="underline hover:text-primary">
                        Return to login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
