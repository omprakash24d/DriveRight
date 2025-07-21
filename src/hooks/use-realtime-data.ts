
"use client";

import { useState, useEffect } from 'react';
import { onSnapshot, query, type DocumentData, type Query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface RealtimeData<T> {
  data: T[] | null;
  loading: boolean;
  error: string | null;
}

// Custom hook to subscribe to Firestore collection in real-time
export function useRealtimeData<T>(q: Query<DocumentData>): RealtimeData<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db.app) {
        setError("Firebase not initialized.");
        setLoading(false);
        return;
    }

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        try {
          const documents = snapshot.docs.map(doc => {
            const docData = doc.data();
            // Convert any Timestamps to JS Dates for client-side use
            const processedData = Object.fromEntries(
              Object.entries(docData).map(([key, value]) => 
                value instanceof Timestamp ? [key, value.toDate()] : [key, value]
              )
            );
            return { id: doc.id, ...processedData } as T;
          });
          setData(documents);
          setError(null);
        } catch(err: any) {
           setError(err.message || 'Failed to process data.');
        } finally {
            setLoading(false);
        }
      }, 
      (err) => {
        console.error("Firestore onSnapshot error:", err);
        setError(err.message || 'Failed to fetch real-time data.');
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [q]);

  return { data, loading, error };
}
