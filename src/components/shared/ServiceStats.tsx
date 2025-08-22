// Service statistics and seeding component
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
import { Skeleton } from "@/components/ui/skeleton";
import { SeedingStatus, Service } from "@/hooks/admin/useAdminServices";
import {
  AlertCircle,
  Car,
  CheckCircle,
  Database,
  Globe,
  RefreshCw,
  Target,
} from "lucide-react";

export interface ServiceStatsProps {
  trainingServices: Service[];
  onlineServices: Service[];
  seedingStatus: SeedingStatus;
  isSeedingLoading: boolean;
  onExecuteSeedingAction: (action: string, force?: boolean) => Promise<void>;
  loading?: boolean;
}

export function ServiceStats({
  trainingServices,
  onlineServices,
  seedingStatus,
  isSeedingLoading,
  onExecuteSeedingAction,
  loading = false,
}: ServiceStatsProps) {
  // Calculate statistics
  const trainingStats = {
    total: trainingServices.length,
    active: trainingServices.filter((s) => s.isActive).length,
    inactive: trainingServices.filter((s) => !s.isActive).length,
    categories: [...new Set(trainingServices.map((s) => s.category))].length,
  };

  const onlineStats = {
    total: onlineServices.length,
    active: onlineServices.filter((s) => s.isActive).length,
    inactive: onlineServices.filter((s) => !s.isActive).length,
    categories: [...new Set(onlineServices.map((s) => s.category))].length,
  };

  const overallStats = {
    total: trainingStats.total + onlineStats.total,
    active: trainingStats.active + onlineStats.active,
    inactive: trainingStats.inactive + onlineStats.inactive,
    categories: trainingStats.categories + onlineStats.categories,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Seeding Status Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Services
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {trainingStats.total} training + {onlineStats.total} online
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Services
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {overallStats.active}
            </div>
            <p className="text-xs text-muted-foreground">
              {((overallStats.active / overallStats.total) * 100 || 0).toFixed(
                1
              )}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inactive Services
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {overallStats.inactive}
            </div>
            <p className="text-xs text-muted-foreground">
              {(
                (overallStats.inactive / overallStats.total) * 100 || 0
              ).toFixed(1)}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.categories}</div>
            <p className="text-xs text-muted-foreground">
              Unique service categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Services Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              Training Services
            </CardTitle>
            <CardDescription>
              Professional driving training programs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Services</span>
                <Badge variant="outline">{trainingStats.total}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active</span>
                <Badge variant="default" className="bg-green-600">
                  {trainingStats.active}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Inactive</span>
                <Badge variant="secondary">{trainingStats.inactive}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Categories</span>
                <Badge variant="outline">{trainingStats.categories}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Online Services Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-600" />
              Online Services
            </CardTitle>
            <CardDescription>
              Digital tools and online solutions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Total Services</span>
                <Badge variant="outline">{onlineStats.total}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Active</span>
                <Badge variant="default" className="bg-green-600">
                  {onlineStats.active}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Inactive</span>
                <Badge variant="secondary">{onlineStats.inactive}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Categories</span>
                <Badge variant="outline">{onlineStats.categories}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seeding Status and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-purple-600" />
            Database Seeding Status
          </CardTitle>
          <CardDescription>
            Initialize your database with default services and sample data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Current Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Training Services
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Count: {seedingStatus.training.count}</div>
                  <div>
                    Last Seeded:{" "}
                    {seedingStatus.training.lastSeeded
                      ? new Date(
                          seedingStatus.training.lastSeeded
                        ).toLocaleString()
                      : "Never"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Online Services
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Count: {seedingStatus.online.count}</div>
                  <div>
                    Last Seeded:{" "}
                    {seedingStatus.online.lastSeeded
                      ? new Date(
                          seedingStatus.online.lastSeeded
                        ).toLocaleString()
                      : "Never"}
                  </div>
                </div>
              </div>
            </div>

            {/* Seeding Actions */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => onExecuteSeedingAction("seed-training")}
                disabled={isSeedingLoading}
                size="sm"
                variant="outline"
              >
                {isSeedingLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Car className="h-4 w-4 mr-2" />
                )}
                Seed Training Services
              </Button>

              <Button
                onClick={() => onExecuteSeedingAction("seed-online")}
                disabled={isSeedingLoading}
                size="sm"
                variant="outline"
              >
                {isSeedingLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Globe className="h-4 w-4 mr-2" />
                )}
                Seed Online Services
              </Button>

              <Button
                onClick={() => onExecuteSeedingAction("seed-all")}
                disabled={isSeedingLoading}
                size="sm"
                variant="default"
              >
                {isSeedingLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Seed All Services
              </Button>

              <Button
                onClick={() => onExecuteSeedingAction("reset-all", true)}
                disabled={isSeedingLoading}
                size="sm"
                variant="destructive"
              >
                {isSeedingLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                Reset All Data
              </Button>
            </div>

            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Note:</strong> Seeding will add default services to your
              database. Use &quot;Reset All Data&quot; to clear existing
              services and start fresh. This action cannot be undone.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ServiceStats;
