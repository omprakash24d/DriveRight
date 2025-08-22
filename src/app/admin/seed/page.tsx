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
import { toast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Car,
  CheckCircle,
  Database,
  Download,
  Globe,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";

interface SeedingStatus {
  needsSeeding: boolean;
  existingTraining: number;
  existingOnline: number;
  recommendation?: string;
}

interface SeedingResult {
  enhancedTrainingServices: number;
  enhancedOnlineServices: number;
  legacyTrainingServices: number;
  legacyOnlineServices: number;
  testimonials: number;
  students: number;
  instructors: number;
  errors: string[];
}

export default function SeedingPage() {
  const [status, setStatus] = useState<SeedingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SeedingResult | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/admin/seed?action=check");
      const data = await response.json();

      if (data.success) {
        setStatus(data.data);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch seeding status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check seeding status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const executeSeedingAction = async (
    action: string,
    force: boolean = false
  ) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, force }),
      });

      const data = await response.json();

      if (data.success) {
        setLastResult(data.data);
        toast({
          title: "Success",
          description: data.message,
        });
        // Refresh status
        await fetchStatus();
      } else {
        toast({
          title: "Error",
          description: data.error || "Seeding operation failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute seeding operation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Database className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Database Seeding</h1>
          <p className="text-gray-600">
            Populate your database with sample data for testing and development
          </p>
        </div>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Current Status</span>
          </CardTitle>
          <CardDescription>
            Overview of existing data in your collections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Car className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">
                  {status.existingTraining}
                </div>
                <div className="text-sm text-blue-700">Training Services</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Globe className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">
                  {status.existingOnline}
                </div>
                <div className="text-sm text-green-700">Online Services</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                {status.needsSeeding ? (
                  <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                )}
                <div className="text-lg font-bold">
                  <Badge
                    variant={status.needsSeeding ? "destructive" : "default"}
                  >
                    {status.needsSeeding ? "Needs Seeding" : "Has Data"}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 mt-1">Overall Status</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">Loading status...</p>
            </div>
          )}

          {status?.recommendation && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">
                    Recommendation
                  </h4>
                  <p className="text-yellow-800">{status.recommendation}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seeding Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Enhanced Services Only */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-blue-600" />
              <span>Enhanced Services</span>
            </CardTitle>
            <CardDescription>
              Seed only the enhanced training and online services with your
              exact pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>• LMV Training (₹6,000)</p>
              <p>• HMV Training (₹11,000)</p>
              <p>• MCWG Training (₹5,000)</p>
              <p>• Refresher Course (₹3,500)</p>
              <p>• DL Printout (₹450)</p>
              <p>• License Download (Free)</p>
            </div>
            <Button
              onClick={() => executeSeedingAction("seed-enhanced-only")}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Seed Enhanced Services
            </Button>
          </CardContent>
        </Card>

        {/* Complete Seeding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-green-600" />
              <span>Complete Seeding</span>
            </CardTitle>
            <CardDescription>
              Seed all collections: services, testimonials, students,
              instructors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>• Enhanced Services</p>
              <p>• Sample Students</p>
              <p>• Sample Instructors</p>
              <p>• Sample Testimonials</p>
              <p>• Legacy Services (backup)</p>
            </div>
            <Button
              onClick={() => executeSeedingAction("seed-all")}
              disabled={loading}
              className="w-full"
              variant="default"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Seed All Collections
            </Button>
          </CardContent>
        </Card>

        {/* Force Reseed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5 text-red-600" />
              <span>Force Reseed</span>
            </CardTitle>
            <CardDescription>
              Deactivate existing services and create fresh ones (destructive)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="text-red-600 font-medium">
                ⚠️ Destructive Operation
              </p>
              <p>• Deactivates existing services</p>
              <p>• Creates fresh sample data</p>
              <p>• Cannot be undone</p>
            </div>
            <Button
              onClick={() => executeSeedingAction("force-reseed", true)}
              disabled={loading}
              className="w-full"
              variant="destructive"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Force Reseed
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Last Result */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Last Operation Result</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-xl font-bold text-blue-900">
                  {lastResult.enhancedTrainingServices}
                </div>
                <div className="text-xs text-blue-700">Enhanced Training</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-xl font-bold text-green-900">
                  {lastResult.enhancedOnlineServices}
                </div>
                <div className="text-xs text-green-700">Enhanced Online</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <div className="text-xl font-bold text-purple-900">
                  {lastResult.testimonials}
                </div>
                <div className="text-xs text-purple-700">Testimonials</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded">
                <div className="text-xl font-bold text-orange-900">
                  {lastResult.students}
                </div>
                <div className="text-xs text-orange-700">Students</div>
              </div>
            </div>

            {lastResult.errors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">
                  Errors Encountered:
                </h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {lastResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Refresh Status */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={fetchStatus} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>
    </div>
  );
}
