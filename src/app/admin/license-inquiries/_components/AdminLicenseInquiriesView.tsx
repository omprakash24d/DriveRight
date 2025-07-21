
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Printer, Loader2, Send } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { updateLicensePrintInquiry, type LicensePrintInquiry, type LicensePrintInquiryStatus } from "@/services/licensePrintInquiriesService";
import { sendLicensePrintStatusUpdateEmail } from "@/app/license-print/_lib/email-service";
import { useToast } from "@/hooks/use-toast";

interface AdminLicenseInquiriesViewProps {
    initialInquiries: any[]; // Expect serialized date
}

export function AdminLicenseInquiriesView({ initialInquiries }: AdminLicenseInquiriesViewProps) {
  const [inquiries, setInquiries] = useState<any[]>(initialInquiries);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentInquiry, setCurrentInquiry] = useState<any | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<LicensePrintInquiryStatus | "">("");
  const { toast } = useToast();

  const handleOpenDialog = (inquiry: any) => {
    setCurrentInquiry(inquiry);
    setNotes(inquiry.notes || "");
    setStatus(inquiry.status);
  };
  
  const handleUpdate = async () => {
    if (!currentInquiry || !status) return;
    setIsUpdating(true);
    
    try {
      await updateLicensePrintInquiry(currentInquiry.id, { status, notes });
      
      if (status === 'Processed' || status === 'Not Found') {
        await sendLicensePrintStatusUpdateEmail({
          to: currentInquiry.email,
          name: currentInquiry.name,
          status,
          notes,
        });
        toast({ title: "Success", description: `Inquiry updated and notification sent to ${currentInquiry.name}.` });
      } else {
        toast({ title: "Success", description: "Inquiry has been updated." });
      }

      setInquiries(inquiries.map(i => i.id === currentInquiry.id ? { ...i, status, notes } : i));
      setCurrentInquiry(null);

    } catch (error) {
      console.error("Failed to update inquiry:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update inquiry." });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const getStatusVariant = (status: LicensePrintInquiryStatus) => {
    switch (status) {
      case 'New': return 'secondary';
      case 'Processed': return 'default';
      case 'Not Found': return 'destructive';
      default: return 'secondary';
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
          <Printer className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Driving License Inquiries</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All License Print Requests</CardTitle>
           <CardDescription>Manage user requests for driving license documents.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant Name</TableHead>
                <TableHead>DL Number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.length > 0 ? (
                inquiries.map((inquiry) => {
                  const inquiryDate = parseISO(inquiry.timestamp);
                  const dobDate = parseISO(inquiry.dob);
                  return (
                  <TableRow key={inquiry.id}>
                    <TableCell>{inquiry.name}</TableCell>
                    <TableCell>{inquiry.dlNumber}</TableCell>
                    <TableCell>{inquiry.email}</TableCell>
                    <TableCell>{isValid(inquiryDate) ? format(inquiryDate, "PPP p") : "Invalid Date"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(inquiry.status)}>{inquiry.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Dialog open={currentInquiry?.id === inquiry.id} onOpenChange={(isOpen) => !isOpen && setCurrentInquiry(null)}>
                        <DialogTrigger asChild>
                            <Button variant="outline" onClick={() => handleOpenDialog(inquiry)}>Manage</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Manage Request from {inquiry.name}</DialogTitle>
                                <DialogDescription>Update status, add notes, and notify the applicant.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Applicant Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1 text-sm pt-4">
                                        <p><strong>DL No.:</strong> {inquiry.dlNumber}</p>
                                        <p><strong>DOB:</strong> {isValid(dobDate) ? format(dobDate, "PPP") : "Invalid Date"}</p>
                                        <p><strong>Email:</strong> {inquiry.email}</p>
                                    </CardContent>
                                </Card>
                                <div className="space-y-2">
                                  <Label htmlFor="status">Status</Label>
                                  <Select value={status} onValueChange={(value) => setStatus(value as LicensePrintInquiryStatus)}>
                                      <SelectTrigger id="status"><SelectValue placeholder="Set a status" /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="New">New</SelectItem>
                                          <SelectItem value="Processed">Processed</SelectItem>
                                          <SelectItem value="Not Found">Not Found</SelectItem>
                                      </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="notes">Admin Notes (will be sent to user)</Label>
                                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add comments here..." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCurrentInquiry(null)}>Cancel</Button>
                                <Button onClick={handleUpdate} disabled={isUpdating}>
                                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  {status === 'Processed' || status === 'Not Found' ? <><Send className="mr-2 h-4 w-4" /> Save & Notify</> : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No inquiries yet.
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
