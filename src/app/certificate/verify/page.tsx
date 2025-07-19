
"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, Loader2, QrCode, FileSearch, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form } from "@/components/ui/form";
import { verifyCertificate, type VerificationResult } from './actions';
import { QrScanner } from './_components/QrScanner';
import { InputField } from '@/components/form/input-field';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

const verificationSchema = z.object({
  code: z.string().min(1, "Certificate ID is required."),
});

type VerificationFormValues = z.infer<typeof verificationSchema>;

function VerificationResultDisplay({ result }: { result: VerificationResult }) {
    if (result.status === 'error') {
        return (
             <Card className="w-full max-w-md border-destructive border-2">
                <CardHeader className="items-center text-center">
                    <AlertCircle className="h-16 w-16 text-destructive" />
                    <CardTitle className="mt-4 text-2xl">Verification Error</CardTitle>
                    <CardDescription>{result.message || "An unexpected error occurred."}</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md border-destructive border-2">
            <CardHeader className="items-center text-center">
                <XCircle className="h-16 w-16 text-destructive" />
                <CardTitle className="mt-4 text-2xl">Verification Failed</CardTitle>
                <CardDescription>{result.message || "This certificate code could not be found."}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-muted-foreground">Please double-check the code or contact the issuing authority if you believe this is an error.</p>
            </CardContent>
        </Card>
    );
}

function VerifyPageComponent() {
    const [isLoading, setIsLoading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<VerificationFormValues>({
        resolver: zodResolver(verificationSchema),
        defaultValues: { code: "" },
    });
    
    const handleVerify = useCallback(async (code: string) => {
        if (!code) return;
        setIsLoading(true);
        setVerificationResult(null);

        const result = await verifyCertificate(code);
        
        if (result.status === 'valid' && result.certificateId) {
            toast({ title: "Certificate Found!", description: "Redirecting you to the certificate page." });
            router.push(`/certificate/view/${result.certificateId}`);
        } else {
            setVerificationResult(result);
            setIsLoading(false);
        }
    }, [router, toast]);
    
    useEffect(() => {
      const codeFromQuery = searchParams.get('code');
      if (codeFromQuery) {
          form.setValue('code', codeFromQuery);
          handleVerify(codeFromQuery);
      }
    }, [searchParams, form, handleVerify]);

    const onSubmit: SubmitHandler<VerificationFormValues> = (data) => {
        handleVerify(data.code);
    };
    
    const handleScanSuccess = (decodedText: string) => {
        setShowScanner(false);
        try {
            const url = new URL(decodedText);
            const pathParts = url.pathname.split('/');
            const viewIndex = pathParts.indexOf('view');

            if (url.pathname.includes('/certificate/view/') && viewIndex !== -1 && pathParts[viewIndex + 1]) {
                const certId = pathParts[viewIndex + 1];
                toast({ title: "QR Code Valid", description: "Redirecting to certificate..." });
                router.push(`/certificate/view/${certId}`);
            } else {
                throw new Error("QR code does not point to a valid certificate URL.");
            }
        } catch (e) {
             toast({ variant: 'destructive', title: "Invalid QR Code", description: "The scanned QR code is not a valid certificate link."})
        }
    };

    return (
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 flex items-start justify-center">
            <div className="w-full max-w-md space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Verify Certificate Authenticity</CardTitle>
                    <CardDescription>Enter the certificate ID below or use the QR scanner to verify a document.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <InputField
                          control={form.control}
                          name="code"
                          label="Certificate Number"
                          placeholder="e.g., DL-A1B2C3D4"
                          isRequired
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSearch className="mr-2 h-4 w-4" />}
                              Verify Manually
                            </Button>
                             <Button type="button" variant="outline" className="w-full" onClick={() => setShowScanner(!showScanner)}>
                              <QrCode className="mr-2 h-4 w-4" />
                              {showScanner ? 'Close Scanner' : 'Scan QR Code'}
                            </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                {showScanner && (
                  <Card>
                    <CardContent className="p-2">
                       <QrScanner onScanSuccess={handleScanSuccess} />
                    </CardContent>
                  </Card>
                )}

                {isLoading && (
                   <Card className="w-full max-w-md text-center p-8">
                     <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                     <CardTitle className="mt-4">Verifying...</CardTitle>
                   </Card>
                )}

                {verificationResult && !isLoading && (
                  <VerificationResultDisplay result={verificationResult} />
                )}
            </div>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 flex items-start justify-center">
            <div className="w-full max-w-md space-y-6">
                <Skeleton className="h-[250px] w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}


export default function VerifyPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <VerifyPageComponent />
        </Suspense>
    );
}
