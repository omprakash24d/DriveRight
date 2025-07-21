
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileSearch, Loader2, Send, Download, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { updateLlInquiry, type LlInquiry, type LlInquiryStatus } from "@/services/llInquiriesService";
import { sendLlStatusUpdateEmail } from "@/app/ll-exam-pass/_lib/email-service";
import { useToast } from "@/hooks/use-toast";

interface AdminLlInquiriesViewProps {
    initialInquiries: LlInquiry[];
}

export function AdminLlInquiriesView({ initialInquiries }: AdminLlInquiriesViewProps) {
  const [inquiries, setInquiries] = useState<LlInquiry[]>(initialInquiries);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentInquiry, setCurrentInquiry] = useState<LlInquiry | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<LlInquiryStatus | "">("");
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isExporting, setIsExporting] = useState(false);
  
  const filteredInquiries = useMemo(() => {
    return inquiries.filter(inquiry => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = searchTermLower === '' ||
        inquiry.name.toLowerCase().includes(searchTermLower) ||
        inquiry.applicationNo.toLowerCase().includes(searchTermLower);
      
      const matchesStatus = statusFilter === 'All' || inquiry.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [inquiries, searchTerm, statusFilter]);

  const handleOpenDialog = (inquiry: LlInquiry) => {
    setCurrentInquiry(inquiry);
    setNotes(inquiry.notes || "");
    setStatus(inquiry.status);
  };
  
  const handleUpdate = async () => {
    if (!currentInquiry || !status) return;
    setIsUpdating(true);
    
    try {
      await updateLlInquiry(currentInquiry.id, { status, notes });
      
      if (status === 'Approved' || status === 'Declined') {
        await sendLlStatusUpdateEmail({
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

  const handleExport = () => {
    if (filteredInquiries.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data to Export",
        description: "There are no inquiries matching the current filters.",
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

    const headers = ["Name", "Application No", "Email", "Mobile Number", "Date of Birth", "State", "Status", "Submission Date", "Admin Notes"];
    const csvContent = [
      headers.join(','),
      ...filteredInquiries.map(i => [
        sanitizeForCsv(i.name),
        sanitizeForCsv(i.applicationNo),
        sanitizeForCsv(i.email),
        sanitizeForCsv(i.mobileNumber),
        sanitizeForCsv(format(new Date(i.dob), "yyyy-MM-dd")),
        sanitizeForCsv(i.state),
        sanitizeForCsv(i.status),
        sanitizeForCsv(format(new Date(i.timestamp.seconds * 1000), "yyyy-MM-dd HH:mm:ss")),
        sanitizeForCsv(i.notes),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ll-inquiries-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsExporting(false);
    toast({
        title: "Export Complete",
        description: "Inquiry data has been downloaded as a CSV file.",
    });
  };

  const getStatusVariant = (status: LlInquiryStatus) => {
    switch (status) {
      case 'New': return 'secondary';
      case 'Contacted': return 'outline';
      case 'Approved': return 'default';
      case 'Declined': return 'destructive';
      case 'Archived': return 'outline';
      default: return 'secondary';
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <FileSearch className="h-8 w-8" />
            <h1 className="text-3xl font-bold">LL Exam Inquiries</h1>
        </div>
        <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Export to CSV
        </Button>
      </div>
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or application no..."
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
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Contacted">Contacted</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Declined">Declined</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant Name</TableHead>
                <TableHead>Application No.</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInquiries.length > 0 ? (
                filteredInquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell>{inquiry.name}</TableCell>
                    <TableCell>{inquiry.applicationNo}</TableCell>
                    <TableCell>{inquiry.email}</TableCell>
                    <TableCell>{format(new Date(inquiry.timestamp.seconds * 1000), "PPP p")}</TableCell>
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
                                <DialogTitle>Manage Inquiry from {inquiry.name}</DialogTitle>
                                <DialogDescription>Update status, add notes, and notify the applicant.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Applicant Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-1 text-sm pt-4">
                                        <p><strong>Application No.:</strong> {inquiry.applicationNo}</p>
                                        <p><strong>DOB:</strong> {format(new Date(inquiry.dob), "PPP")}</p>
                                        <p><strong>Mobile:</strong> {inquiry.mobileNumber}</p>
                                        <p><strong>Email:</strong> {inquiry.email}</p>
                                    </CardContent>
                                </Card>
                                <div className="space-y-2">
                                  <Label htmlFor="status">Status</Label>
                                  <Select value={status} onValueChange={(value) => setStatus(value as LlInquiryStatus)}>
                                      <SelectTrigger id="status"><SelectValue placeholder="Set a status" /></SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="New">New</SelectItem>
                                          <SelectItem value="Contacted">Contacted</SelectItem>
                                          <SelectItem value="Approved">Approved</SelectItem>
                                          <SelectItem value="Declined">Declined</SelectItem>
                                          <SelectItem value="Archived">Archived</SelectItem>
                                      </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="notes">Admin Notes (will be sent to user if status is Approved/Declined)</Label>
                                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add comments here..." />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCurrentInquiry(null)}>Cancel</Button>
                                <Button onClick={handleUpdate} disabled={isUpdating}>
                                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  {status === 'Approved' || status === 'Declined' ? <><Send className="mr-2 h-4 w-4" /> Save & Notify</> : "Save Changes"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {inquiries.length > 0 ? "No inquiries match your filters." : "No inquiries yet."}
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
