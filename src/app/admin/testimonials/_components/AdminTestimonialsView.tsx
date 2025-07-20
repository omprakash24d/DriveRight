
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, User, MessageSquarePlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { generateAvatarColor } from "@/lib/utils";
import { deleteTestimonial, type Testimonial } from "@/services/testimonialsService";

interface AdminTestimonialsViewProps {
    initialTestimonials: Testimonial[];
}

export function AdminTestimonialsView({ initialTestimonials }: AdminTestimonialsViewProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const { toast } = useToast();

  const handleDelete = async (testimonialId: string) => {
    try {
        await deleteTestimonial(testimonialId);
        setTestimonials(testimonials.filter((testimonial) => testimonial.id !== testimonialId));
        toast({
            title: "Testimonial Deleted",
            description: "The testimonial has been successfully removed.",
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete testimonial.",
        });
    }
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Testimonials</h1>
         <div className="flex items-center gap-2">
            <Button asChild>
            <Link href="/admin/testimonials/new">
                <MessageSquarePlus className="mr-2 h-4 w-4" />
                Add New Testimonial
            </Link>
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Testimonials</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Quote</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
             {testimonials.length > 0 ? (
                testimonials.map((testimonial) => (
                    <TableRow key={testimonial.id}>
                    <TableCell className="flex items-center gap-4 font-medium">
                        <Avatar>
                        <AvatarImage src={testimonial.avatar} alt={testimonial.name} data-ai-hint="person portrait" />
                        <AvatarFallback style={{ backgroundColor: generateAvatarColor(testimonial.name) }}>
                            <User className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                        </Avatar>
                        <span>{testimonial.name}</span>
                    </TableCell>
                    <TableCell>{testimonial.course}</TableCell>
                    <TableCell className="max-w-xs truncate">{testimonial.quote}</TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={`/admin/testimonials/${testimonial.id}/edit`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                            </Link>
                        </Button>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete this testimonial. This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(testimonial.id)}>
                                Continue
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">No testimonials found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
