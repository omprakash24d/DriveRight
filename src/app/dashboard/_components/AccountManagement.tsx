
"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Trash2, Download } from 'lucide-react';
import type { User } from 'firebase/auth';
import { requestDataExportAction, deleteUserAccountAction } from '../actions';

interface AccountManagementProps {
    user: User;
}

export function AccountManagement({ user }: AccountManagementProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const result = await requestDataExportAction();
            if (result.success) {
                toast({
                    title: "Export Request Sent",
                    description: "Your data export is being processed. You will receive an email with your data shortly.",
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Export Failed", description: error.message });
        } finally {
            setIsExporting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
         try {
            const result = await deleteUserAccountAction();
            if (result.success) {
                toast({
                    title: "Account Deleted",
                    description: "Your account and all associated data have been permanently deleted.",
                });
                // The onAuthStateChanged listener in AuthContext will handle the redirect.
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Deletion Failed", description: error.message });
        } finally {
            setIsDeleting(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Account Management</CardTitle>
                <CardDescription>Manage your personal data and account settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button onClick={handleExport} disabled={isExporting} className="w-full">
                    {isExporting ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2" />}
                    Export My Data
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                            <Trash2 className="mr-2" /> Delete My Account
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                {isDeleting ? <Loader2 className="mr-2 animate-spin" /> : null}
                                Yes, Delete My Account
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}
