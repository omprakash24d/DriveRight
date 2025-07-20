
"use client";

import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, UserPlus, User } from "lucide-react";
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
import { deleteInstructor, type Instructor } from "@/services/instructorsService";

interface DisplayInstructor extends Omit<Instructor, 'specialties'> {
    specialties: string[];
}

interface AdminInstructorsViewProps {
    initialInstructors: Instructor[];
}

export function AdminInstructorsView({ initialInstructors }: AdminInstructorsViewProps) {
  const displayInstructors = useMemo(() => initialInstructors.map(i => ({
    ...i,
    specialties: i.specialties.split(',').map(s => s.trim()).filter(Boolean)
  })), [initialInstructors]);

  const [instructors, setInstructors] = useState<DisplayInstructor[]>(displayInstructors);
  const { toast } = useToast();

  const handleDelete = async (instructorId: string) => {
    try {
        await deleteInstructor(instructorId);
        setInstructors(instructors.filter((instructor) => instructor.id !== instructorId));
        toast({
            title: "Instructor Deleted",
            description: "The instructor record has been successfully removed.",
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete instructor.",
        });
    }
  };
  
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Instructors</h1>
        <div className="flex items-center gap-2">
            <Button asChild>
            <Link href="/admin/instructors/new">
                <UserPlus className="mr-2 h-4 w-4" />
                Add New Instructor
            </Link>
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Instructors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Instructor</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Specialties</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instructors.length > 0 ? (
                instructors.map((instructor) => (
                    <TableRow key={instructor.id}>
                    <TableCell className="flex items-center gap-4 font-medium">
                        <Avatar>
                        <AvatarImage src={instructor.avatar} alt={instructor.name} />
                        <AvatarFallback style={{ backgroundColor: generateAvatarColor(instructor.name) }}>
                            <User className="h-5 w-5 text-primary" />
                        </AvatarFallback>
                        </Avatar>
                        <span>{instructor.name}</span>
                    </TableCell>
                    <TableCell>{instructor.experience}</TableCell>
                    <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {instructor.specialties.map(spec => <Badge key={spec} variant="secondary">{spec}</Badge>)}
                        </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={`/admin/instructors/${instructor.id}/edit`}>
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
                                This will permanently delete the instructor profile. This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(instructor.id)}>
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
                    <TableCell colSpan={4} className="h-24 text-center">No instructors found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
