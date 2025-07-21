
"use client";

import { useState, useCallback, type ElementType } from "react";
import { 
    Trash2, Edit, PlusCircle, Car, ConciergeBell
} from "lucide-react";
import * as icons from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { deleteTrainingService, type TrainingService } from "@/services/quickServicesService";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminTrainingServicesViewProps {
  initialServices: TrainingService[];
}

export function AdminTrainingServicesView({ initialServices }: AdminTrainingServicesViewProps) {
  const [services, setServices] = useState<TrainingService[]>(initialServices);
  const { toast } = useToast();

  const handleDelete = useCallback(async (serviceId: string) => {
    try {
        await deleteTrainingService(serviceId);
        setServices(currentServices => currentServices.filter((service) => service.id !== serviceId));
        toast({
            title: "Service Deleted",
            description: "The service has been successfully removed.",
        });
    } catch (error) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete the service.",
        });
    }
  }, [toast]);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
            <ConciergeBell className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Training Services</h1>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild>
            <Link href="/admin/training-services/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Service
            </Link>
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Homepage Training Service Cards</CardTitle>
          <CardDescription>Manage the service cards that appear on the homepage under the &quot;Our Driving Services&quot; section.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Icon</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length > 0 ? (
                services.map((service) => {
                    const IconComponent = (icons[service.icon as keyof typeof icons] || Car) as ElementType;
                    return (
                        <TableRow key={service.id}>
                        <TableCell>
                            <IconComponent className="h-6 w-6 text-primary" />
                        </TableCell>
                        <TableCell className="font-medium">{service.title}</TableCell>
                        <TableCell className="max-w-xs truncate">{service.description}</TableCell>
                        <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="icon" asChild>
                                <Link href={`/admin/training-services/${service.id}/edit`}>
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
                                    This will permanently delete this service card from the homepage.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(service.id)}>
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
                    <TableCell colSpan={5} className="h-24 text-center">No services found. Add one or seed the defaults from Settings.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
