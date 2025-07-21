
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
import { deleteStudent, type Student } from "@/services/studentsService";
import { format, parseISO, isValid } from "date-fns";
import { useRealtimeData } from "@/hooks/use-realtime-data";
import { collection, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminStudentsView() {
  const { data: students, loading, error } = useRealtimeData<Student>(
    query(collection(db, 'students'), orderBy('name'))
  );
  
  const { toast } = useToast();

  const handleDelete = async (studentId: string) => {
    try {
      await deleteStudent(studentId);
      toast({
        title: "Student Deleted",
        description: "The student record has been successfully removed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete the student.",
      });
    }
  };

  if (error) {
    return <p className="text-destructive">Error loading students: {error}</p>;
  }


  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Students</h1>
        <div className="flex items-center gap-2">
            <Button asChild>
            <Link href="/admin/students/new">
                <UserPlus className="mr-2 h-4 w-4" />
                Add New Student
            </Link>
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Students</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Date Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {loading ? (
                 Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right space-x-2">
                            <Skeleton className="h-8 w-8 inline-block" />
                            <Skeleton className="h-8 w-8 inline-block" />
                        </TableCell>
                    </TableRow>
                 ))
              ) : students && students.length > 0 ? (
                students.map((student) => {
                  const joinedDate = student.joined instanceof Date ? student.joined : null;
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="flex items-center gap-4 font-medium">
                        <Avatar>
                          <AvatarImage src={student.avatar} alt={student.name} data-ai-hint="person portrait" />
                          <AvatarFallback style={{ backgroundColor: generateAvatarColor(student.name) }}>
                            <User className="h-5 w-5 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        <span>{student.name}</span>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.phone}</TableCell>
                      <TableCell>{joinedDate && isValid(joinedDate) ? format(joinedDate, 'PPP') : 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" asChild>
                          <Link href={`/admin/students/${student.id}/edit`}>
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
                                This action cannot be undone. This will permanently delete the student account and remove their data from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(student.id)}>
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No students found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
