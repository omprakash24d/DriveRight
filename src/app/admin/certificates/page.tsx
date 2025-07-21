
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, FilePlus, Search, Loader2 } from "lucide-react";
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
import { getCertificates, type Certificate } from "@/services/certificatesService";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isValid } from "date-fns";

function toDateSafely(timestamp: any): Date | null {
  if (!timestamp) {
    return null;
  }
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }
  if (typeof timestamp === "object" && "seconds" in timestamp && "nanoseconds" in timestamp) {
    const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    return isValid(date) ? date : null;
  }
  const date = new Date(timestamp);
  return isValid(date) ? date : null;
}

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchCertificates = async () => {
    setIsLoading(true);
    try {
      const fetchedCerts = await getCertificates();
      setCertificates(fetchedCerts);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching certificates",
        description: "Could not fetch certificate data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCertificates = useMemo(() => {
    return certificates.filter((cert) => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTermLower === "" ||
        cert.studentName.toLowerCase().includes(searchTermLower) ||
        (cert.certNumber && cert.certNumber.toLowerCase().includes(searchTermLower));

      const matchesStatus = statusFilter === "All" || cert.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [certificates, searchTerm, statusFilter]);

  const handleDelete = async (certificateId: string) => {
    try {
      // The secure session cookie is automatically sent by the browser.
      const response = await fetch(`/api/admin/certificates?id=${certificateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || "Failed to delete certificate");
      }

      setCertificates(certificates.filter((cert) => cert.id !== certificateId));
      toast({
        title: "Certificate Deleted",
        description: "The certificate record has been successfully removed.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error.message || "Could not delete the certificate. Please try again.",
      });
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Manage Certificates</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/admin/certificates/new">
              <FilePlus className="mr-2 h-4 w-4" />
              Generate New Certificate
            </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Certificates</CardTitle>
          <CardDescription>
            Certificates are automatically generated when a test result is marked as &apos;Pass&apos;. Use the &apos;Seed Prerequisites&apos; button on the Settings page to add sample students and results if this list is empty.
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or cert no..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Issued">Issued</SelectItem>
                <SelectItem value="Pending Generation">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Certificate No.</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredCertificates.length > 0 ? (
                filteredCertificates.map((cert) => {
                  const safeDate = toDateSafely(cert.issueDate);
                  return (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">{cert.certNumber}</TableCell>
                      <TableCell>{cert.studentName}</TableCell>
                      <TableCell>{cert.course}</TableCell>
                      <TableCell>{cert.type}</TableCell>
                      <TableCell>{safeDate ? format(safeDate, "PPP") : "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={cert.status === "Issued" ? "default" : "secondary"}>
                          {cert.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="icon" asChild disabled={cert.status !== "Issued"}>
                          <Link href={cert.certificateUrl} target="_blank">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
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
                                This action cannot be undone. This will permanently delete this certificate record.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(cert.id)}>
                                Continue
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    {certificates.length > 0
                      ? "No certificates match your filters."
                      : "No certificates found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
