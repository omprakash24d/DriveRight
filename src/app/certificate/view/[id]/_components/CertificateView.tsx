
'use client';

import { useRef, useState, useEffect, useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, Loader2, ImageIcon, Award } from 'lucide-react';
import { format, isValid } from 'date-fns';
import type { SiteSettings } from '@/services/settingsService';
import type { Certificate } from '@/services/certificatesService';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CertificateViewProps {
    certificate: Certificate;
    settings: SiteSettings;
}

function CertificateViewComponent({ certificate, settings }: CertificateViewProps) {
    const certificateRef = useRef<HTMLDivElement>(null);
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [isDownloadingImage, setIsDownloadingImage] = useState(false);
    const { toast } = useToast();

    const verificationDomain = useMemo(() => {
        if (certificate.certificateUrl && certificate.certificateUrl !== '#') {
            try {
                return new URL(certificate.certificateUrl).hostname;
            } catch (e) {
                console.error("Invalid certificate URL for domain extraction", e);
                return typeof window !== 'undefined' ? window.location.hostname : '';
            }
        }
        return '';
    }, [certificate.certificateUrl]);

    const qrCodeUrl = useMemo(() => {
        if (certificate.certificateUrl && certificate.certificateUrl !== '#') {
            const verificationUrl = certificate.certificateUrl;
            return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}&qzone=1&color=000000`;
        }
        return '';
    }, [certificate.certificateUrl]);


    const handleDownload = useCallback(async (formatType: 'pdf' | 'png') => {
        if (!certificateRef.current) return;
        
        if (formatType === 'pdf') setIsDownloadingPdf(true);
        if (formatType === 'png') setIsDownloadingImage(true);

        try {
            const element = certificateRef.current;
            const canvas = await html2canvas(element, {
                scale: 3,
                useCORS: true, 
                backgroundColor: '#ffffff',
                allowTaint: true,
                proxy: '/api/cors-proxy' // Added this line
            });

            if (formatType === 'pdf') {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'px',
                    format: [canvas.width, canvas.height],
                });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save(`Certificate-${certificate.certNumber}.pdf`);
            } else {
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = `Certificate-${certificate.certNumber}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
             toast({
                title: 'Download Started',
                description: `Your certificate is being downloaded as a ${formatType.toUpperCase()}.`,
            });
        } catch (error) {
            console.error(`Failed to download ${formatType}:`, error);
            toast({
                variant: 'destructive',
                title: 'Download Failed',
                description: `Could not generate the ${formatType}. Please try again.`,
            });
        } finally {
            if (formatType === 'pdf') setIsDownloadingPdf(false);
            if (formatType === 'png') setIsDownloadingImage(false);
        }
    }, [certificate.certNumber, toast]);


    const dateFromTimestamp = useMemo(() => {
        // @ts-ignore - issueDate can be a plain object after serialization from server components
        if (certificate.issueDate && certificate.issueDate.seconds) {
            // @ts-ignore
            return new Date(certificate.issueDate.seconds * 1000);
        }
        return null;
    }, [certificate.issueDate]);

    const formattedDate = dateFromTimestamp && isValid(dateFromTimestamp)
        ? format(dateFromTimestamp, "MMMM d, yyyy")
        : "Date Not Available";

    const directorName = "Urmila devi";

    return (
        <div className="w-full flex flex-col items-center p-4">
            <div className="w-full overflow-auto">
                <div
                    ref={certificateRef}
                    className={cn(
                        "relative font-serif bg-white shadow-2xl border border-gray-300 mx-auto",
                        "w-[842px] h-[595px] min-w-[842px] min-h-[595px] p-[24px] print:w-full print:h-full overflow-hidden"
                    )}
                >
                    <div className="w-full h-full border-[2px] border-[#1e3a8a] p-[10px] box-border">
                        <div className="w-full h-full border-[3px] border-[#facc15] bg-white p-[20px] flex flex-col justify-between relative">

                            <div className="absolute inset-0 flex items-center justify-center z-0 opacity-5">
                                <Award className="h-3/4 w-3/4 text-gray-400" />
                            </div>

                            <div className="w-full grid grid-cols-2 z-10">
                                <div className="text-left">
                                    <p className="text-[12px] text-gray-600">Certificate No.</p>
                                    <p className="font-sans font-bold text-[14px] text-gray-800 tracking-wider mt-1">{certificate.certNumber}</p>
                                </div>
                                <div className="flex justify-end items-start">
                                    <div className="h-[70px] w-[70px] relative rounded-full overflow-hidden border-2 border-[#facc15]">
                                        <Image src="/images/logo.jpg" alt={`${settings.schoolName} Logo`} layout="fill" className="object-cover" data-ai-hint="logo" />
                                    </div>
                                </div>
                            </div>

                            <div className="text-center z-10 py-2">
                                <p className="text-[14px] font-sans font-semibold tracking-[0.2em] text-gray-500">DRIVING SCHOOL</p>
                                <h1 className="text-[36px] font-bold tracking-[0.1em] text-[#1e3a8a] mt-1">CERTIFICATE</h1>
                                <p className="text-[14px] font-sans font-semibold tracking-[0.2em] text-gray-500 mt-1">OF COMPLETION</p>
                            </div>

                            <div className="text-center z-10 py-2">
                                <p className="text-[14px] text-gray-700">This certificate is proudly presented to</p>
                                <p className="text-[48px] text-[#1e3a8a] my-2 font-cursive">
                                    {certificate.studentName}
                                </p>
                                <p className="text-[14px] text-gray-700 max-w-2xl mx-auto">
                                    for successfully completing the <span className="font-bold">{certificate.course} ({certificate.type})</span> course with {settings.schoolName}.
                                </p>
                            </div>

                            <div className="w-full flex flex-col items-center z-10 pt-4">
                                <div className="w-full flex items-end justify-between mt-2">
                                    <div className="text-center w-1/3">
                                        <p className="text-[20px] font-cursive text-gray-800 h-[30px]">{directorName}</p>
                                        <hr className="border-gray-600 my-1 w-4/5 mx-auto" />
                                        <p className="text-[10px] font-sans font-semibold text-gray-600 tracking-wider">DIRECTOR</p>
                                    </div>

                                    <div className="text-center w-1/3 flex flex-col items-center justify-end h-full">
                                         {qrCodeUrl ? (
                                            <div className="relative" style={{ width: '60px', height: '60px' }}>
                                                <Image src={qrCodeUrl} alt="QR code for certificate verification" width={60} height={60} crossOrigin="anonymous" />
                                            </div>
                                        ) : <Loader2 className="h-14 w-14 animate-spin" />}
                                        <p className="text-[9px] text-gray-600 font-sans mt-1">Verify at: {verificationDomain}</p>
                                    </div>

                                    <div className="text-center w-1/3">
                                        <p className="text-[14px] font-semibold text-gray-800 h-[30px]">{formattedDate}</p>
                                        <hr className="border-gray-600 my-1 w-4/5 mx-auto" />
                                        <p className="text-[10px] font-sans font-semibold text-gray-600 tracking-wider">DATE OF ISSUE</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center gap-4 print:hidden">
                <Button onClick={() => handleDownload('pdf')} disabled={isDownloadingPdf || isDownloadingImage} aria-label="Download certificate as PDF">
                    {isDownloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Download as PDF
                </Button>
                <Button onClick={() => handleDownload('png')} disabled={isDownloadingPdf || isDownloadingImage} variant="outline" aria-label="Download certificate as Image">
                    {isDownloadingImage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2 h-4 w-4" />}
                    Download as Image
                </Button>
            </div>
        </div>
    );
}

export const CertificateView = memo(CertificateViewComponent);
