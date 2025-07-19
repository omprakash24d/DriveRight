
"use client";

import { useEffect, useState } from "react";
import { 
    Trash2, Edit, PlusCircle, Car
} from "lucide-react";
import * as icons from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
import { getCourses, deleteCourse, type Course } from "@/services/coursesService";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCourses = async () => {
    setIsLoading(true);
    try {
        const fetchedCourses = await getCourses();
        setCourses(fetchedCourses);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch courses.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (courseId: string) => {
    try {
        await deleteCourse(courseId);
        setCourses(courses.filter((course) => course.id !== courseId));
        toast({
            title: "Course Deleted",
            description: "The course has been successfully removed.",
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete the course.",
        });
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Courses</h1>
        <div className="flex items-center gap-2">
            <Button asChild>
            <Link href="/admin/courses/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Course
            </Link>
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Enroll Link Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index}>
                        <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                        <TableCell className="text-right"><div className="flex gap-2 justify-end"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
                    </TableRow>
                ))
              ) : courses.length > 0 ? (
                courses.map((course) => {
                    const IconComponent = icons[course.icon as keyof typeof icons] || Car;
                    return (
                        <TableRow key={course.id}>
                        <TableCell>
                            <IconComponent className="h-6 w-6 text-primary" />
                        </TableCell>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{course.price}</TableCell>
                        <TableCell><code>{course.value}</code></TableCell>
                        <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="icon" asChild>
                                <Link href={`/admin/courses/${course.id}/edit`}>
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
                                    This will permanently delete the course. This action cannot be undone.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(course.id)}>
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
                    <TableCell colSpan={5} className="h-24 text-center">No courses found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
