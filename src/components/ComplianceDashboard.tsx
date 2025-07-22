// src/components/ComplianceDashboard.tsx - GDPR Compliance Dashboard
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Shield,
  Trash2,
  Users,
  UserX,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface GDPRRequest {
  id: string;
  userId: string;
  userEmail: string;
  requestType: string;
  status: string;
  requestDate: string;
  completionDate?: string;
}

interface DataBreach {
  id: string;
  description: string;
  riskLevel: string;
  status: string;
  reportDate: string;
  affectedUsers: string[];
  authorityNotified: boolean;
  usersNotified: boolean;
}

interface ConsentRecord {
  purpose: string;
  consentGiven: boolean;
  consentDate: string;
  isActive: boolean;
}

export default function ComplianceDashboard() {
  const [gdprRequests, setGdprRequests] = useState<GDPRRequest[]>([]);
  const [dataBreaches, setDataBreaches] = useState<DataBreach[]>([]);
  const [consentOverview, setConsentOverview] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  const loadComplianceData = useCallback(async () => {
    try {
      setLoading(true);

      // Load GDPR requests
      const requestsResponse = await fetch("/api/gdpr/data-subject-request");
      const requestsData = await requestsResponse.json();
      setGdprRequests(requestsData.requests || []);

      // Load data breaches
      const breachResponse = await fetch("/api/gdpr/data-breach");
      const breachData = await breachResponse.json();
      setDataBreaches(breachData.breaches || []);

      // Load consent overview
      setConsentOverview(generateConsentOverview());
    } catch (error) {
      console.error("Failed to load compliance data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadComplianceData();
  }, [loadComplianceData]);

  const generateConsentOverview = () => {
    // This would typically come from your consent API
    return {
      totalUsers: 1250,
      activeConsents: 980,
      withdrawnConsents: 270,
      pendingRenewals: 45,
      purposes: [
        { name: "Marketing Communications", consented: 756, total: 1250 },
        { name: "Analytics & Performance", consented: 892, total: 1250 },
        { name: "Essential Services", consented: 1250, total: 1250 },
        { name: "Third-party Integrations", consented: 234, total: 1250 },
      ],
    };
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", icon: Clock },
      processing: { variant: "default", icon: Clock },
      completed: { variant: "default", icon: CheckCircle },
      rejected: { variant: "destructive", icon: UserX },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon size={12} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getRiskBadge = (riskLevel: string) => {
    const variants: Record<string, string> = {
      low: "default",
      medium: "secondary",
      high: "destructive",
    };

    return (
      <Badge variant={variants[riskLevel] as any}>
        {riskLevel.toUpperCase()}
      </Badge>
    );
  };

  const getRequestTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      access: Eye,
      portability: Download,
      rectification: FileText,
      erasure: Trash2,
      restriction: Shield,
      objection: UserX,
    };

    const Icon = icons[type] || FileText;
    return <Icon size={16} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">
            Loading compliance data...
          </p>
        </div>
      </div>
    );
  }

  const pendingRequests = gdprRequests.filter(
    (r) => r.status === "pending"
  ).length;
  const activeBreaches = dataBreaches.filter(
    (b) => b.status !== "resolved"
  ).length;
  const overdueRequests = gdprRequests.filter((r) => {
    const requestDate = new Date(r.requestDate);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return r.status === "pending" && requestDate < thirtyDaysAgo;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            GDPR Compliance Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor data protection compliance and manage subject rights
          </p>
        </div>
        <Button onClick={loadComplianceData} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Alert for urgent items */}
      {(overdueRequests > 0 || activeBreaches > 0) && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Attention Required:</strong>
            {overdueRequests > 0 &&
              ` ${overdueRequests} overdue GDPR request(s)`}
            {overdueRequests > 0 && activeBreaches > 0 && " • "}
            {activeBreaches > 0 && ` ${activeBreaches} active data breach(es)`}
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GDPR Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gdprRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingRequests} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Breaches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataBreaches.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeBreaches} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Consents
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consentOverview.activeConsents}
            </div>
            <p className="text-xs text-muted-foreground">
              of {consentOverview.totalUsers} users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compliance Score
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">95%</div>
            <p className="text-xs text-muted-foreground">
              Excellent compliance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="requests">GDPR Requests</TabsTrigger>
          <TabsTrigger value="breaches">Data Breaches</TabsTrigger>
          <TabsTrigger value="consent">Consent Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent GDPR Requests</CardTitle>
                <CardDescription>
                  Latest data subject rights requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {gdprRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        {getRequestTypeIcon(request.requestType)}
                        <div>
                          <p className="text-sm font-medium">
                            {request.userEmail}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.requestType}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consent Analytics</CardTitle>
                <CardDescription>Consent rates by purpose</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consentOverview.purposes?.map(
                    (purpose: any, index: number) => {
                      const progressPercentage = Math.round(
                        (purpose.consented / purpose.total) * 100
                      );

                      return (
                        <div key={purpose.name}>
                          <div className="flex justify-between text-sm">
                            <span>{purpose.name}</span>
                            <span>{progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              data-progress={progressPercentage}
                            ></div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GDPR Data Subject Requests</CardTitle>
              <CardDescription>
                Manage and track all data subject rights requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gdprRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getRequestTypeIcon(request.requestType)}
                        <div>
                          <p className="font-medium">{request.userEmail}</p>
                          <p className="text-sm text-gray-500">
                            {request.requestType} •{" "}
                            {new Date(request.requestDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(request.status)}
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breaches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Breach Management</CardTitle>
              <CardDescription>
                Track and manage data security incidents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataBreaches.map((breach) => (
                  <div key={breach.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4" />
                          <h4 className="font-medium">
                            Breach #{breach.id.slice(-8)}
                          </h4>
                          {getRiskBadge(breach.riskLevel)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {breach.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>
                            {breach.affectedUsers.length} affected users
                          </span>
                          <span>
                            Reported:{" "}
                            {new Date(breach.reportDate).toLocaleDateString()}
                          </span>
                          <span>
                            Authority: {breach.authorityNotified ? "✓" : "✗"}
                          </span>
                          <span>Users: {breach.usersNotified ? "✓" : "✗"}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(breach.status)}
                        <Button variant="outline" size="sm">
                          Investigate
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Consent Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Users</span>
                    <span className="font-medium">
                      {consentOverview.totalUsers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Consents</span>
                    <span className="font-medium text-green-600">
                      {consentOverview.activeConsents}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Withdrawn Consents</span>
                    <span className="font-medium text-red-600">
                      {consentOverview.withdrawnConsents}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Renewals</span>
                    <span className="font-medium text-yellow-600">
                      {consentOverview.pendingRenewals}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions Required</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {consentOverview.pendingRenewals > 0 && (
                    <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded">
                      <Bell className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">
                        {consentOverview.pendingRenewals} consent renewals
                        required
                      </span>
                    </div>
                  )}
                  {overdueRequests > 0 && (
                    <div className="flex items-center space-x-2 p-2 bg-red-50 rounded">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm">
                        {overdueRequests} overdue GDPR requests
                      </span>
                    </div>
                  )}
                  <Button className="w-full" variant="outline">
                    Generate Compliance Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
