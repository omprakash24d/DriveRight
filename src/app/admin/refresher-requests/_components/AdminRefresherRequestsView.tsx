"use client";

// import {
//   suggestRefresherPlan,
//   type SuggestRefresherPlanOutput,
// } from "@/ai/flows/suggest-refresher-plan";

// Temporary fallback for deployment
const suggestRefresherPlan = async (data: any) => ({
  plan: "Standard refresher course recommended based on the request details. This includes 2 weeks of comprehensive training focusing on basic driving skills, traffic rules review, and parking practice.",
  refresherPlan:
    "Standard refresher course recommended based on the request details.",
  duration: "2 weeks",
  focusAreas: [
    "Basic driving skills",
    "Traffic rules review",
    "Parking practice",
  ],
});

type SuggestRefresherPlanOutput = {
  plan: string;
  refresherPlan: string;
  duration: string;
  focusAreas: string[];
};

import { sendRefresherStatusUpdateEmail } from "@/app/refresher/_lib/email-service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  deleteRefresherRequest,
  updateRefresherRequestStatus,
  type RefresherRequestStatus,
} from "@/services/refresherRequestsService";
import { format, isValid, parseISO } from "date-fns";
import { Lightbulb, Loader2, Mail, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

// Helper function to safely parse dates from various formats
const parseDate = (date: any): Date => {
  try {
    // Handle Firestore Timestamp format
    if (date && typeof date === "object" && "seconds" in date) {
      return new Date(date.seconds * 1000);
    }
    // Handle Date objects
    if (date instanceof Date) {
      return date;
    }
    // Handle ISO strings
    if (typeof date === "string") {
      return parseISO(date);
    }
    // Handle timestamp numbers
    if (typeof date === "number") {
      return new Date(date);
    }
    // Fallback to current date
    return new Date();
  } catch (error) {
    console.warn("Invalid date format:", date);
    return new Date(); // Return current date as fallback
  }
};

interface AdminRefresherRequestsViewProps {
  initialRequests: any[]; // Expect serialized date
}

export function AdminRefresherRequestsView({
  initialRequests,
}: AdminRefresherRequestsViewProps) {
  const [requests, setRequests] = useState<any[]>(initialRequests);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [isUpdating, setIsUpdating] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<any | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<RefresherRequestStatus | "">("");

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestion, setSuggestion] =
    useState<SuggestRefresherPlanOutput | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/refresher-requests", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch refresher requests");
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch refresher requests:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Failed to load refresher requests. Please refresh the page.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Fetch data if not provided via server-side rendering
  useEffect(() => {
    if (initialRequests.length === 0) {
      fetchRequests();
    }
  }, [initialRequests.length, fetchRequests]);

  const handleOpenDialog = (request: any) => {
    setCurrentRequest(request);
    setSuggestion(null);
    setNotes(request.notes || "");
    setStatus(request.status);
  };

  const handleCloseDialog = () => {
    setCurrentRequest(null);
  };

  const handleUpdate = async () => {
    if (!currentRequest || !status) return;
    setIsUpdating(true);

    try {
      await updateRefresherRequestStatus(currentRequest.id, { status, notes });

      if (status === "Approved" || status === "Declined") {
        await sendRefresherStatusUpdateEmail({
          to: currentRequest.email,
          name: currentRequest.name,
          status,
          notes,
        });
        toast({
          title: "Success",
          description: `Request updated and notification sent to ${currentRequest.name}.`,
        });
      } else {
        toast({ title: "Success", description: "Request has been updated." });
      }

      setRequests(
        requests.map((r) =>
          r.id === currentRequest.id ? { ...r, status, notes } : r
        )
      );
      handleCloseDialog();
    } catch (error) {
      console.error("Failed to update request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update the request.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRefresherRequest(id);
      setRequests(requests.filter((r) => r.id !== id));
      toast({
        title: "Request Deleted",
        description: "The refresher request has been removed.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Could not delete the request.",
      });
    }
  };

  const handleSuggestPlan = async (reason: string) => {
    setIsAiLoading(true);
    setSuggestion(null);
    try {
      const result = await suggestRefresherPlan({ reason });
      setSuggestion(result);
    } catch (error) {
      console.error("AI suggestion error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not generate a lesson plan. Please try again.",
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const formattedRequests = useMemo(() => {
    return requests.map((req) => {
      const createdAtDate = parseDate(req.createdAt);
      const dobDate = parseISO(req.dob);
      return {
        ...req,
        formattedCreatedAt: isValid(createdAtDate)
          ? format(createdAtDate, "PPP")
          : "Invalid Date",
        formattedDob: isValid(dobDate)
          ? format(dobDate, "PPP")
          : "Invalid Date",
      };
    });
  }, [requests]);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Refresher Requests</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Refresher Course Requests</CardTitle>
          <CardDescription>
            Review and manage all submitted requests for refresher courses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ref ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email & Phone</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formattedRequests.length > 0 ? (
                formattedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.refId}</TableCell>
                    <TableCell>{request.name}</TableCell>
                    <TableCell>
                      <div>{request.email}</div>
                      <div className="text-muted-foreground text-xs">
                        {request.mobileNo}
                      </div>
                    </TableCell>
                    <TableCell>{request.formattedCreatedAt}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          request.status === "Approved"
                            ? "default"
                            : request.status === "Pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog
                        open={currentRequest?.id === request.id}
                        onOpenChange={(isOpen) =>
                          !isOpen && handleCloseDialog()
                        }
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(request)}
                          >
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>
                              Manage Request from {request.name}
                            </DialogTitle>
                            <DialogDescription>
                              Review details, suggest a lesson plan, update
                              status, and notify the applicant.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid md:grid-cols-2 gap-6 py-4">
                            <div className="space-y-4">
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg">
                                    Applicant&apos;s Reason
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-muted-foreground">
                                    {request.reason}
                                  </p>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg">
                                    AI Lesson Plan
                                  </CardTitle>
                                  <CardDescription>
                                    Suggest a plan based on the applicant&apos;s
                                    reason.
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <Button
                                    onClick={() =>
                                      handleSuggestPlan(request.reason)
                                    }
                                    disabled={isAiLoading}
                                    className="w-full"
                                  >
                                    {isAiLoading ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="mr-2 h-4 w-4" />
                                    )}
                                    Suggest a Plan
                                  </Button>
                                  {isAiLoading && (
                                    <Skeleton className="h-20 w-full mt-4" />
                                  )}
                                  {suggestion && (
                                    <Alert className="mt-4">
                                      <Lightbulb className="h-4 w-4" />
                                      <AlertTitle>Suggested Plan</AlertTitle>
                                      <AlertDescription>
                                        <p className="whitespace-pre-wrap">
                                          {suggestion.plan}
                                        </p>
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                            <div className="space-y-4">
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg">
                                    Contact & Documents
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                  <p>
                                    <strong>Email:</strong> {request.email}
                                  </p>
                                  <p>
                                    <strong>Mobile:</strong> {request.mobileNo}
                                  </p>
                                  <p>
                                    <strong>DOB:</strong> {request.formattedDob}
                                  </p>
                                  <Button asChild className="w-full mt-4">
                                    <Link
                                      href={`https://mail.google.com/mail/u/0/#search/subject%3A(New+Refresher+Course+Request%3A+${encodeURIComponent(
                                        request.name
                                      )}+%28Ref%3A+${encodeURIComponent(
                                        request.refId
                                      )}%29)`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Mail className="mr-2 h-4 w-4" />
                                      Find License in Email
                                    </Link>
                                  </Button>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-lg">
                                    Update Status
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                      value={status}
                                      onValueChange={(value) =>
                                        setStatus(
                                          value as RefresherRequestStatus
                                        )
                                      }
                                    >
                                      <SelectTrigger id="status">
                                        <SelectValue placeholder="Set a status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Pending">
                                          Pending
                                        </SelectItem>
                                        <SelectItem value="Approved">
                                          Approved
                                        </SelectItem>
                                        <SelectItem value="Declined">
                                          Declined
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="notes">
                                      Admin Notes (sent to user)
                                    </Label>
                                    <Textarea
                                      id="notes"
                                      value={notes}
                                      onChange={(e) => setNotes(e.target.value)}
                                      placeholder="Add comments for the applicant..."
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={handleCloseDialog}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleUpdate}
                              disabled={isUpdating}
                            >
                              {isUpdating && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              {status === "Approved" || status === "Declined"
                                ? "Save & Notify Applicant"
                                : "Save Changes"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete this refresher request.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(request.id)}
                            >
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
                  <TableCell colSpan={6} className="h-24 text-center">
                    No refresher requests found.
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
