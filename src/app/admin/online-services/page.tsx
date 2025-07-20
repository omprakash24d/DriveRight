
"use client";

import { useEffect, useState, useCallback, type ElementType } from "react";
import { 
    Trash2, Edit, PlusCircle, FileCheck2
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
import { getOnlineServices, deleteOnlineService, type OnlineService } from "@/services/quickServicesService";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOnlineServicesPage() {
  const [services, setServices] = useState<OnlineService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
        const fetchedServices = await getOnlineServices();
        setServices(fetchedServices);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch online services.",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleDelete = useCallback(async (serviceId: string) => {
    try {
        await deleteOnlineService(serviceId);
        setServices(currentServices => currentServices.filter((service) => service.id !== serviceId));
        toast({
            title: "Service Deleted",
            description: "The online service has been successfully removed.",
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
            <FileCheck2 className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Online Services</h1>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild>
            <Link href="/admin/online-services/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Service
            </Link>
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Homepage Online Tool Cards</CardTitle>
          <CardDescription>Manage the online tool cards that appear on the homepage under the &quot;Online Tools & Resources&quot; section.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table role="table">
            <TableHeader>
              <TableRow role="row">
                <TableHead role="columnheader">Icon</TableHead>
                <TableHead role="columnheader">Title</TableHead>
                <TableHead role="columnheader">Description</TableHead>
                <TableHead className="text-right" role="columnheader">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={index} role="row">
                        <TableCell role="cell"><Skeleton className="h-6 w-6" /></TableCell>
                        <TableCell role="cell"><Skeleton className="h-6 w-48" /></TableCell>
                        <TableCell role="cell"><Skeleton className="h-6 w-72" /></TableCell>
                        <TableCell className="text-right" role="cell"><div className="flex gap-2 justify-end"><Skeleton className="h-8 w-8" /><Skeleton className="h-8 w-8" /></div></TableCell>
                    </TableRow>
                ))
              ) : services.length > 0 ? (
                services.map((service) => {
                    const IconComponent = (icons[service.icon as keyof typeof icons] || FileCheck2) as ElementType;
                    return (
                        <TableRow key={service.id} role="row">
                        <TableCell role="cell">
                            <IconComponent className="h-6 w-6 text-primary" />
                        </TableCell>
                        <TableCell className="font-medium" role="cell">{service.title}</TableCell>
                        <TableCell className="max-w-xs truncate" role="cell">{service.description}</TableCell>
                        <TableCell className="text-right space-x-2" role="cell">
                            <Button variant="outline" size="icon" asChild>
                                <Link href={`/admin/online-services/${service.id}/edit`}>
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
                                    This will permanently delete this online service card from the homepage.
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
                    <TableCell colSpan={5} className="py-12 text-center">
                         <Card className="w-full max-w-md mx-auto">
                            <CardHeader>
                                <CardTitle>No Services Found</CardTitle>
                                <CardDescription>
                                    There are no online service cards yet. Add your first one to display it on the homepage.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild>
                                    <Link href="/admin/online-services/new">
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add a Service
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
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
