
"use client";
import { useEffect, useRef } from 'react';
import { Html5Qrcode, type QrcodeSuccessCallback } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export function QrScanner({ onScanSuccess }: QrScannerProps) {
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  useEffect(() => {
    const scanner = new Html5Qrcode('reader');
    scannerRef.current = scanner;

    const qrCodeSuccessCallback: QrcodeSuccessCallback = (decodedText, decodedResult) => {
        scanner.stop().then(() => {
            onScanSuccess(decodedText);
        }).catch(err => {
            console.error("Failed to stop scanner", err);
            onScanSuccess(decodedText); // Proceed even if stop fails
        });
    };

    const startScanner = async () => {
        try {
            await scanner.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                qrCodeSuccessCallback,
                undefined // Optional error callback
            );
        } catch (err) {
            console.log("Failed to start with back camera, trying front.", err);
            try {
                 await scanner.start(
                    {}, // Default camera
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    qrCodeSuccessCallback,
                    undefined
                );
            } catch (error) {
                 toast({
                    variant: "destructive",
                    title: "Camera Error",
                    description: "Could not start camera. Please check permissions and refresh the page.",
                });
            }
        }
    };
    
    startScanner();

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(err => {
                console.error("Failed to stop scanner on cleanup", err);
            });
        }
    };
  }, [onScanSuccess, toast]);

  return (
      <div id="reader" className="w-full aspect-square bg-muted rounded-md overflow-hidden"></div>
  );
}
