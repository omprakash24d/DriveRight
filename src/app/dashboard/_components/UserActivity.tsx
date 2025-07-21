
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, CheckCircle, XCircle } from 'lucide-react';
import { useRealtimeData } from '@/hooks/use-realtime-data';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { TestResult } from '@/services/resultsService';
import type { Certificate } from '@/services/certificatesService';

interface UserActivityProps {
    userId: string;
}

export function UserActivity({ userId }: UserActivityProps) {
  const { data: results, loading: resultsLoading, error: resultsError } = useRealtimeData<TestResult>(
    query(collection(db, "testResults"), where("studentId", "==", userId), orderBy("date", "desc"))
  );
  
  const { data: certificates, loading: certsLoading, error: certsError } = useRealtimeData<Certificate>(
    query(collection(db, "certificates"), where("studentId", "==", userId), orderBy("issueDate", "desc"))
  );

  const isLoading = resultsLoading || certsLoading;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-4">My Test Results</h2>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
                <div className="p-6 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            ) : resultsError ? (
                <p className="p-6 text-destructive text-center">Could not load test results: {resultsError}</p>
            ) : results && results.length > 0 ? (
                <ul className="divide-y">
                    {results.map(result => (
                        <li key={result.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                           <div className="flex-1 space-y-1">
                                <p className="font-semibold">{result.testType}</p>
                                <p className="text-sm text-muted-foreground">Taken on {format((result.date as Timestamp).toDate(), 'PPP')}</p>
                           </div>
                           <div className="flex items-center gap-4">
                                <Badge variant={result.status === 'Pass' ? 'default' : 'destructive'} className="text-base py-1 px-3">
                                    {result.status === 'Pass' ? <CheckCircle className="mr-2" /> : <XCircle className="mr-2" />}
                                    {result.score}/100
                                </Badge>
                                <Button asChild variant="outline" size="sm">
                                    <Link href="/results">View Details</Link>
                                </Button>
                           </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="p-6 text-muted-foreground text-center">You have no test results yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">My Certificates</h2>
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
                <div className="p-6 space-y-4"><Skeleton className="h-10 w-full" /></div>
            ) : certsError ? (
                <p className="p-6 text-destructive text-center">Could not load certificates: {certsError}</p>
            ) : certificates && certificates.length > 0 ? (
                <ul className="divide-y">
                    {certificates.map(cert => (
                        <li key={cert.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Award className="h-6 w-6 text-amber-500" />
                                <div className="flex-1 space-y-1">
                                    <p className="font-semibold">{cert.course} ({cert.type})</p>
                                    <p className="text-sm text-muted-foreground">Issued on {format((cert.issueDate as Timestamp).toDate(), 'PPP')}</p>
                                </div>
                            </div>
                            <Button asChild variant="secondary" size="sm">
                                <Link href={cert.certificateUrl}>View & Download</Link>
                            </Button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="p-6 text-muted-foreground text-center">You have no certificates yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
