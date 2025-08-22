"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { getPriceInfo } from "@/lib/priceUtils";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { ArrowRight, CreditCard, Loader2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

interface CourseEnrollButtonProps {
  courseId: string;
  courseTitle: string;
  coursePrice: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function CourseEnrollButton({
  courseId,
  courseTitle,
  coursePrice,
}: CourseEnrollButtonProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Use the utility function for consistent price handling
  const priceInfo = getPriceInfo(coursePrice);
  const isFree = priceInfo.isFree;

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      setIsChecking(false);
      return;
    }

    async function checkEnrollment() {
      setIsChecking(true);
      try {
        const enrollmentRef = doc(
          db,
          "users",
          user!.uid,
          "enrolledCourses",
          courseId
        );
        const docSnap = await getDoc(enrollmentRef);
        setIsEnrolled(docSnap.exists());
      } catch (e) {
        console.error("Failed to check enrollment status", e);
        setIsEnrolled(false);
      } finally {
        setIsChecking(false);
      }
    }
    checkEnrollment();
  }, [user, courseId, isAuthLoading]);

  const enrollUserInDb = async (paymentId?: string) => {
    if (!user) return;
    try {
      const enrollmentRef = doc(
        db,
        "users",
        user.uid,
        "enrolledCourses",
        courseId
      );
      await setDoc(enrollmentRef, {
        title: courseTitle,
        description: courseTitle, // Using title as description since we don't have full course data
        enrolledAt: Timestamp.now(),
        price: priceInfo.isFree ? "Free" : String(priceInfo.numericPrice),
        paymentId: paymentId || "N/A",
      });
      setIsEnrolled(true);
      router.refresh();
    } catch (error) {
      console.error("DB enrollment failed:", error);
      throw new Error(
        "Could not update your enrollment status in our database."
      );
    }
  };

  const handleFreeEnroll = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      await enrollUserInDb();
      toast({
        title: "Enrollment Successful!",
        description: `You are now enrolled in ${courseTitle}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Enrollment Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      const amountInPaise = priceInfo.numericPrice * 100;

      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountInPaise, currency: "INR" }),
      });

      if (!orderResponse.ok) throw new Error("Failed to create payment order.");

      const order = await orderResponse.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Driving School Arwal",
        description: `Payment for ${courseTitle}`,
        order_id: order.id,
        handler: async function (response: any) {
          try {
            await enrollUserInDb(response.razorpay_payment_id);
            toast({
              title: "Payment Successful!",
              description: `You are now enrolled in ${courseTitle}.`,
            });
          } catch (dbError: any) {
            toast({
              variant: "destructive",
              title: "Enrollment Update Failed",
              description: dbError.message,
            });
          }
        },
        prefill: {
          name: user.displayName || "Student",
          email: user.email,
        },
        theme: {
          color: "#2563EB",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: response.error.description || "Something went wrong.",
        });
      });
      rzp.open();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Payment Initialization Failed",
        description: error.message || "Could not start the payment process.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isAuthLoading || isChecking || isProcessing;

  if (isLoading) {
    return (
      <Button disabled size="lg">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
      </Button>
    );
  }

  if (!user) {
    return (
      <Button asChild size="lg">
        <Link href="/signup">
          <UserPlus className="mr-2 h-4 w-4" />
          Sign Up to Enroll
        </Link>
      </Button>
    );
  }

  if (isEnrolled) {
    return (
      <Button asChild size="lg">
        <Link href={`/courses/${courseId}`}>
          <ArrowRight className="mr-2 h-4 w-4" />
          Go to Course
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Script
        id="razorpay-checkout-js"
        src="https://checkout.razorpay.com/v1/checkout.js"
      />
      {isFree ? (
        <Button onClick={handleFreeEnroll} disabled={isLoading} size="lg">
          <UserPlus className="mr-2 h-4 w-4" />
          Enroll for Free
        </Button>
      ) : (
        <Button onClick={handlePayment} disabled={isLoading} size="lg">
          <CreditCard className="mr-2 h-4 w-4" />
          Pay and Enroll
        </Button>
      )}
    </>
  );
}
