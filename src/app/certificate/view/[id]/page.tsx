import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCertificate } from "@/services/certificatesService";
import { getSiteSettings } from "@/services/settingsService";
import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CertificateView } from "./_components/CertificateView";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const certificate = await getCertificate(params.id);

  if (!certificate) {
    return {
      title: "Certificate Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `Certificate for ${certificate.studentName}`,
    description: `Completion certificate for the ${certificate.course} course issued to ${certificate.studentName}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CertificateViewPage({
  params,
}: {
  params: { id: string };
}) {
  const certificate = await getCertificate(params.id);
  const settings = await getSiteSettings();

  if (!certificate || certificate.status !== "Issued") {
    return (
      <div className="container mx-auto px-4 md:px-6 py-16 md:py-24 flex flex-col items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center p-8">
          <CardHeader className="items-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <CardTitle className="text-3xl font-bold mt-4">
              Certificate Not Found
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              The certificate ID you provided is invalid, does not exist, or has
              not been issued yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="mt-4">
              <Link href="/certificate/download">Try Again</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Serialize the certificate data to avoid toJSON warnings
  const serializedCertificate = {
    ...certificate,
    issueDate: certificate.issueDate.toDate().toISOString(),
  };

  return (
    <CertificateView certificate={serializedCertificate} settings={settings} />
  );
}
