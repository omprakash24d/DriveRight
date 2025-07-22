// src/app/admin/monitoring/page.tsx - Production Monitoring Dashboard
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
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface HealthStatus {
  timestamp: string;
  status: "healthy" | "degraded" | "unhealthy";
  checks: {
    database: boolean;
    redis: boolean;
    external_apis: boolean;
    storage: boolean;
    auth: boolean;
  };
  performance: {
    uptime: number;
    response_time_ms: number;
  };
  errors?: string[];
}

interface Metrics {
  timestamp: string;
  system: {
    uptime_seconds: number;
    memory: {
      usage_percentage: number;
      used_mb: number;
    };
  };
  business: {
    total_students?: number;
    active_enrollments?: number;
    completed_courses?: number;
    pending_inquiries?: number;
  };
  performance: {
    avg_response_time_ms?: number;
    requests_per_minute?: number;
    error_rate_percentage?: number;
  };
}

export default function MonitoringDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch health status
  const fetchHealthStatus = async () => {
    try {
      const response = await fetch("/api/monitoring/health");
      const data = await response.json();
      setHealthStatus(data);
    } catch (error) {
      console.error("Error fetching health status:", error);
    }
  };

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/monitoring/metrics");
      const data = await response.json();
      setMetrics(data);

      // Add to historical data for charts
      setHistoricalData((prev) => {
        const newData = [
          ...prev,
          {
            time: new Date().toLocaleTimeString(),
            responseTime: data.performance?.avg_response_time_ms || 0,
            memoryUsage: data.system?.memory?.usage_percentage || 0,
            requestsPerMinute: data.performance?.requests_per_minute || 0,
            errorRate: data.performance?.error_rate_percentage || 0,
          },
        ];

        // Keep only last 20 data points
        return newData.slice(-20);
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  // Auto-refresh data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchHealthStatus(), fetchMetrics()]);
      setLastUpdated(new Date());
      setIsLoading(false);
    };

    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "healthy":
        return { color: "bg-green-500", icon: CheckCircle, text: "Healthy" };
      case "degraded":
        return {
          color: "bg-yellow-500",
          icon: AlertTriangle,
          text: "Degraded",
        };
      case "unhealthy":
        return { color: "bg-red-500", icon: AlertTriangle, text: "Unhealthy" };
      default:
        return { color: "bg-gray-500", icon: AlertTriangle, text: "Unknown" };
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            System Monitoring
          </h1>
          <p className="text-muted-foreground">
            Production health and performance dashboard
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button
            onClick={() => {
              fetchHealthStatus();
              fetchMetrics();
              setLastUpdated(new Date());
            }}
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overall Status
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {healthStatus && (
              <div className="flex items-center space-x-2">
                {(() => {
                  const {
                    color,
                    icon: Icon,
                    text,
                  } = getStatusDisplay(healthStatus.status);
                  return (
                    <>
                      <div className={`w-3 h-3 rounded-full ${color}`} />
                      <span className="text-2xl font-bold">{text}</span>
                    </>
                  );
                })()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              System operational status
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatUptime(metrics.system.uptime_seconds) : "0m"}
            </div>
            <p className="text-xs text-muted-foreground">System uptime</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? `${metrics.system.memory.usage_percentage}%` : "0%"}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics
                ? `${metrics.system.memory.used_mb}MB used`
                : "Memory usage"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatus
                ? `${healthStatus.performance.response_time_ms}ms`
                : "0ms"}
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health Checks</CardTitle>
          <CardDescription>Individual service component status</CardDescription>
        </CardHeader>
        <CardContent>
          {healthStatus && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(healthStatus.checks).map(
                ([service, isHealthy]) => (
                  <div key={service} className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isHealthy ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm capitalize">
                      {service.replace("_", " ")}
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          {healthStatus?.errors && healthStatus.errors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Active Issues:
              </h4>
              <ul className="text-sm text-red-700 space-y-1">
                {healthStatus.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Response Time Trend</CardTitle>
            <CardDescription>Average response time over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Memory Usage</CardTitle>
            <CardDescription>System memory utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="memoryUsage"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Business Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Business Metrics</CardTitle>
          <CardDescription>Key business performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics?.business && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.business.total_students || 0}
                </div>
                <p className="text-sm text-muted-foreground">Total Students</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {metrics.business.active_enrollments || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Active Enrollments
                </p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.business.completed_courses || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Completed Courses
                </p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {metrics.business.pending_inquiries || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Pending Inquiries
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      {metrics?.performance && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>Application performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {metrics.performance.requests_per_minute || 0}
                </div>
                <p className="text-sm text-muted-foreground">Requests/Minute</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold">
                  {metrics.performance.avg_response_time_ms || 0}ms
                </div>
                <p className="text-sm text-muted-foreground">
                  Avg Response Time
                </p>
              </div>

              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    (metrics.performance.error_rate_percentage || 0) < 1
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {(metrics.performance.error_rate_percentage || 0).toFixed(2)}%
                </div>
                <p className="text-sm text-muted-foreground">Error Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
