"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Database, Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";

export function DatabaseManagement() {
  const [loading, setLoading] = useState(false);
  const [collectionsStatus, setCollectionsStatus] = useState<{
    exist: boolean;
    collections: string[];
  } | null>(null);
  const { toast } = useToast();

  const checkCollections = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/seed-collections", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setCollectionsStatus({
          exist: data.collectionsExist,
          collections: data.collections,
        });

        toast({
          title: "Collections Checked",
          description: data.message,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check collections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const seedCollections = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/seed-collections", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "seed" }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Collections Seeded",
          description:
            "Firebase collections have been seeded with sample data.",
        });

        // Refresh status
        await checkCollections();
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to seed collections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Management
        </CardTitle>
        <CardDescription>
          Manage Firebase collections and seed sample data for testing the
          enhanced About section.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Button
            onClick={checkCollections}
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Check Collections
          </Button>

          <Button onClick={seedCollections} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            Seed Sample Data
          </Button>
        </div>

        {collectionsStatus && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Collections Status:</span>
              <Badge
                variant={collectionsStatus.exist ? "default" : "secondary"}
              >
                {collectionsStatus.exist ? "Exist" : "Need Seeding"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {collectionsStatus.collections.map((collection) => (
                <div key={collection} className="p-2 bg-muted rounded text-sm">
                  {collection}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>What this does:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Creates <code>students</code> collection with sample student
              records
            </li>
            <li>
              Creates <code>enrollments</code> collection with enrollment data
            </li>
            <li>
              Creates <code>testResults</code> collection with test outcomes
            </li>
            <li>
              Creates <code>courses</code> collection with course information
            </li>
          </ul>

          <p className="mt-4">
            <strong>Note:</strong> This will enable real-time statistics in the
            About section.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
