
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Phone, Mail, MapPin, Calendar, Clock, Download, Loader2, FileCheck, Save, MessageSquare, AlertTriangle } from "lucide-react";
import { updateEnrollmentStatus, type Enrollment, type EnrollmentStatus } from "@/services/enrollmentsService";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const isValidHttpUrl = (string: string | undefined): boolean => {
  if (!string) return false;
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
};

interface AdminEnrollmentsViewProps {
    initialEnrollments: Enrollment[];
}


export function AdminEnrollmentsView({ initialEnrollments }: AdminEnrollmentsViewProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>(initialEnrollments);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
  const [currentInquiry, setCurrentInquiry] = useState<Enrollment | null>(null);
  const [adminRemarks, setAdminRemarks] = useState('');

  const handleStatusChange = async (id: string, newStatus: EnrollmentStatus) => {
    setIsUpdating(true);
    const originalEnrollments = [...enrollments];
    
    setEnrollments(currentEnrollments =>
      currentEnrollments.map(e => (e.id === id ? { ...e, status: newStatus } : e))
    );
    
    if (currentInquiry?.id === id) {
        setCurrentInquiry(null);
    }

    try {
        await updateEnrollmentStatus(id, newStatus, adminRemarks);
        toast({
            title: "Status Updated",
            description: `Enrollment status has been changed to ${newStatus}.`,
        });
        // Optimistically update, but a full refresh might be better if other data changes
        // For now, this is fine.
    } catch (error) {
        setEnrollments(originalEnrollments);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not update the enrollment status.",
        });
    } finally {
        setIsUpdating(false);
    }
  };

  const handleSaveRemarks = async () => {
    if (!currentInquiry) return;
    setIsUpdating(true);
     try {
        await updateEnrollmentStatus(currentInquiry.id, currentInquiry.status, adminRemarks);
        setEnrollments(enrollments.map(e => e.id === currentInquiry.id ? {...e, adminRemarks} : e));
        toast({
            title: "Remarks Saved",
            description: `Remarks for ${currentInquiry.fullName} have been updated.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: "Could not save remarks.",
        });
    } finally {
        setIsUpdating(false);
    }
  }
  
  const handleExport = () => {
    if (enrollments.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data to Export",
        description: "There are no enrollments to export.",
      });
      return;
    }

    setIsExporting(true);
    
    const sanitizeForCsv = (field: any): string => {
      let str = String(field ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      if (['=', '+', '-', '@'].includes(str[0])) {
        str = `\t${str}`;
      }
      return str;
    };


    const headers = ["Reference ID", "Full Name", "Email", "Mobile Number", "Document ID", "Date of Birth", "Address", "State", "Course", "Status", "Application Date", "Admin Remarks"];
    const csvContent = [
      headers.join(','),
      ...enrollments.map(e => [
        sanitizeForCsv(e.refId),
        sanitizeForCsv(e.fullName),
        sanitizeForCsv(e.email),
        sanitizeForCsv(e.mobileNumber),
        sanitizeForCsv(e.documentId),
        sanitizeForCsv(e.dateOfBirth),
        sanitizeForCsv(e.address),
        sanitizeForCsv(e.state),
        sanitizeForCsv(e.vehicleType.toUpperCase()),
        sanitizeForCsv(e.status),
        sanitizeForCsv(format(new Date(e.createdAt.seconds * 1000), "yyyy-MM-dd HH:mm:ss")),
        sanitizeForCsv(e.adminRemarks)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `enrollments-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);
    toast({
        title: "Export Complete",
        description: "Enrollment data has been downloaded.",
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Enrollment Requests</h1>
        <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export to CSV
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Enrollments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref ID</TableHead>
                <TableHead>Name & Phone</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.length > 0 ? (
                enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                    <TableCell>{enrollment.refId}</TableCell>
                    <TableCell>
                        <div>{enrollment.fullName}</div>
                        <div className="text-sm text-muted-foreground">{enrollment.mobileNumber}</div>
                    </TableCell>
                    <TableCell>{enrollment.vehicleType.toUpperCase()}</TableCell>
                    <TableCell>{format(new Date(enrollment.createdAt.seconds * 1000), "PPP")}</TableCell>
                    <TableCell>
                        <Badge variant={enrollment.status === 'Approved' ? 'default' : enrollment.status === 'Pending' ? 'secondary' : 'destructive'}>
                        {enrollment.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                        <Dialog open={currentInquiry?.id === enrollment.id} onOpenChange={(isOpen) => !isOpen && setCurrentInquiry(null)}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => { setCurrentInquiry(enrollment); setAdminRemarks(enrollment.adminRemarks || ''); }}>View</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-4xl">
                            <DialogHeader>
                            <DialogTitle>Enrollment Details for {enrollment.fullName}</DialogTitle>
                            <DialogDescription>
                                Review the applicant's information before making a decision.
                            </DialogDescription>
                            </DialogHeader>
                            <div className="grid md:grid-cols-2 gap-6 py-4">
                                <div>
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-lg">Applicant Information</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> <span>{enrollment.fullName}</span></div>
                                            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <span>{enrollment.email}</span></div>
                                            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <span>{enrollment.mobileNumber}</span></div>
                                            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> <span>{enrollment.dateOfBirth}</span></div>
                                        </div>
                                         <div className="text-sm">
                                             <p className="font-semibold flex items-center gap-2"><FileCheck className="h-4 w-4 text-muted-foreground" /> Document ID</p>
                                             <p className="pl-6">{enrollment.documentId || <span className="text-muted-foreground italic">Not provided</span>}</p>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /> <span>{enrollment.address}, {enrollment.state}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4 mt-6">
                                            <h4 className="font-semibold text-lg">Course Details</h4>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div><span className="text-muted-foreground">Course:</span> <span className="font-medium">{enrollment.vehicleType.toUpperCase()}</span></div>
                                            </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-lg">Uploaded Documents</h4>
                                        <Card>
                                            <CardContent className="pt-6 text-sm">
                                                <div className="grid grid-cols-2 gap-4">
                                                    
                                                    <div className="space-y-2">
                                                        <p className="font-semibold">Photograph</p>
                                                        {isValidHttpUrl(enrollment.photoCroppedUrl) ? (
                                                            <Link href={enrollment.photoCroppedUrl} target="_blank" rel="noopener noreferrer">
                                                                <Image
                                                                    src={enrollment.photoCroppedUrl}
                                                                    alt="Applicant's cropped photo"
                                                                    width={128}
                                                                    height={128}
                                                                    className="rounded-lg border object-cover aspect-square hover:opacity-80 transition-opacity"
                                                                />
                                                            </Link>
                                                        ) : (
                                                            <div className="h-[128px] w-[128px] bg-muted rounded-lg flex flex-col items-center justify-center text-center p-2">
                                                                <AlertTriangle className="h-6 w-6 text-destructive mb-1"/>
                                                                <p className="text-xs text-destructive">Invalid URL</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                     <div className="space-y-2">
                                                        <p className="font-semibold">ID Proof</p>
                                                         {isValidHttpUrl(enrollment.idProofUrl) ? (
                                                            <Link href={enrollment.idProofUrl} target="_blank" rel="noopener noreferrer">
                                                                <Image
                                                                    src={enrollment.idProofUrl}
                                                                    alt="Applicant's ID proof"
                                                                    width={128}
                                                                    height={128}
                                                                    className="rounded-lg border object-contain aspect-square hover:opacity-80 transition-opacity"
                                                                />
                                                             </Link>
                                                         ) : (
                                                            <div className="h-[128px] w-[128px] bg-muted rounded-lg flex flex-col items-center justify-center text-center p-2">
                                                                <AlertTriangle className="h-6 w-6 text-destructive mb-1"/>
                                                                <p className="text-xs text-destructive">Invalid URL</p>
                                                            </div>
                                                         )}
                                                    </div>
                                                </div>
                                                <p className="text-muted-foreground mt-4">
                                                    The applicant's full documents are also attached to the notification email. Use the button below to quickly find it in your Gmail inbox.
                                                </p>
                                                <Button asChild className="mt-4 w-full">
                                                    <Link 
                                                        href={`https://mail.google.com/mail/u/0/#search/subject%3A(New+Enrollment+Application%3A+${encodeURIComponent(enrollment.fullName)}+%28Ref%3A+${encodeURIComponent(enrollment.refId)}%29)`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Mail className="mr-2 h-4 w-4" />
                                                        Find Notification Email
                                                    </Link>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                        <div className="space-y-2">
                                            <Label htmlFor="adminRemarks" className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-muted-foreground" /> Admin Remarks (Private)</Label>
                                            <Textarea id="adminRemarks" value={adminRemarks} onChange={(e) => setAdminRemarks(e.target.value)} placeholder="Add internal notes here..." />
                                            <Button size="sm" variant="secondary" onClick={handleSaveRemarks} disabled={isUpdating}><Save className="mr-2 h-4 w-4" /> Save Remarks</Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button size="sm" variant="outline" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleStatusChange(enrollment.id, 'Approved')} disabled={isUpdating}>Approve</Button>
                                <Button variant="destructive" size="sm" onClick={() => handleStatusChange(enrollment.id, 'Declined')} disabled={isUpdating}>Decline</Button>
                            </DialogFooter>
                        </DialogContent>
                        </Dialog>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">No enrollment requests found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
