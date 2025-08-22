// Enhanced Transaction Dashboard for Admin
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Filter,
  Globe,
  IndianRupee,
  RefreshCw,
  Search,
  Smartphone,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Transaction {
  id: string;
  bookingId: string;
  serviceId: string;
  serviceType: "training" | "online";
  serviceName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  transactionType: "payment" | "refund" | "partial_refund";
  amount: number;
  currency: "INR" | "USD";
  status: "pending" | "success" | "failed" | "cancelled";
  paymentGateway: "razorpay" | "upi" | "card" | "netbanking";
  gatewayTransactionId?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ServiceBooking {
  id: string;
  serviceId: string;
  serviceType: "training" | "online";
  serviceName: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  bookingDate: Date;
  scheduledDate?: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "refunded";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentDetails?: {
    transactionId: string;
    paymentMethod: string;
    paidAmount: number;
    paymentDate: Date;
  };
}

interface DashboardMetrics {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  refundedAmount: number;
  averageTransactionValue: number;
  conversionRate: number;
  monthlyRevenue: { month: string; revenue: number; transactions: number }[];
  paymentMethodBreakdown: { method: string; count: number; amount: number }[];
  serviceTypeRevenue: { type: string; revenue: number; transactions: number }[];
}

export default function TransactionDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load data
  useEffect(() => {
    loadTransactions();
    loadBookings();
    loadMetrics();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/admin/transactions');
      // const data = await response.json();
      // setTransactions(data.transactions);

      // Mock data for now
      setTransactions([]);
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      // TODO: Replace with actual API call
      setBookings([]);
    } catch (error) {
      console.error("Error loading bookings:", error);
    }
  };

  const loadMetrics = async () => {
    try {
      // TODO: Replace with actual API call
      // Mock metrics for now
      const mockMetrics: DashboardMetrics = {
        totalRevenue: 125000,
        totalTransactions: 156,
        successfulTransactions: 142,
        pendingTransactions: 8,
        failedTransactions: 6,
        refundedAmount: 3500,
        averageTransactionValue: 801.28,
        conversionRate: 91.03,
        monthlyRevenue: [
          { month: "Jan", revenue: 25000, transactions: 32 },
          { month: "Feb", revenue: 30000, transactions: 38 },
          { month: "Mar", revenue: 35000, transactions: 42 },
          { month: "Apr", revenue: 35000, transactions: 44 },
        ],
        paymentMethodBreakdown: [
          { method: "UPI", count: 85, amount: 68000 },
          { method: "Card", count: 45, amount: 45000 },
          { method: "Net Banking", count: 12, amount: 12000 },
        ],
        serviceTypeRevenue: [
          { type: "Training", revenue: 95000, transactions: 95 },
          { type: "Online", revenue: 30000, transactions: 61 },
        ],
      };
      setMetrics(mockMetrics);
    } catch (error) {
      console.error("Error loading metrics:", error);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.customerName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.customerEmail
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.serviceName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || transaction.status === statusFilter;
    const matchesServiceType =
      serviceTypeFilter === "all" ||
      transaction.serviceType === serviceTypeFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const now = new Date();
      const transactionDate = transaction.createdAt;

      switch (dateFilter) {
        case "today":
          matchesDate = transactionDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = transactionDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesServiceType && matchesDate;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case "upi":
        return <Smartphone className="h-4 w-4 text-blue-500" />;
      case "card":
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      case "netbanking":
        return <Globe className="h-4 w-4 text-green-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const exportTransactions = () => {
    // TODO: Implement CSV export
    toast({
      title: "Export Started",
      description: "Your transaction report is being prepared for download.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Transaction Dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor payments, bookings, and financial metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={exportTransactions}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button
            onClick={() => {
              loadTransactions();
              loadBookings();
              loadMetrics();
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <IndianRupee className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{metrics.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 inline mr-1" />
                  +12.5% from last month
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Transactions
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.totalTransactions}
                </div>
                <p className="text-xs text-muted-foreground">
                  <ArrowUpRight className="h-3 w-3 inline mr-1" />
                  {metrics.successfulTransactions} successful
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Success Rate
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {metrics.conversionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.pendingTransactions} pending,{" "}
                  {metrics.failedTransactions} failed
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Transaction
                </CardTitle>
                <DollarSign className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ₹{metrics.averageTransactionValue.toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  ₹{metrics.refundedAmount.toLocaleString()} refunded
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Tabs for different views */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Service Type</label>
                  <Select
                    value={serviceTypeFilter}
                    onValueChange={setServiceTypeFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Date Range</label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 days</SelectItem>
                      <SelectItem value="month">Last 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    Apply Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Showing {paginatedTransactions.length} of{" "}
                {filteredTransactions.length} transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-12 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : paginatedTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono text-xs">
                            {transaction.id.slice(-8)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {transaction.customerName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {transaction.customerEmail}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {transaction.serviceName}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {transaction.serviceType}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">
                              ₹{transaction.amount}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getPaymentMethodIcon(
                                transaction.paymentMethod ||
                                  transaction.paymentGateway
                              )}
                              <span className="text-sm">
                                {transaction.paymentMethod ||
                                  transaction.paymentGateway}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(transaction.status)}
                              <Badge
                                variant={
                                  transaction.status === "success"
                                    ? "default"
                                    : transaction.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {transaction.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {transaction.createdAt.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.createdAt.toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Transactions Found
                  </h3>
                  <p className="text-gray-500">
                    No transactions match your current filters.
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredTransactions.length
                    )}{" "}
                    of {filteredTransactions.length} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Bookings</CardTitle>
              <CardDescription>
                Manage customer bookings and scheduling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Bookings Dashboard
                </h3>
                <p className="text-gray-500">
                  Booking management interface will be displayed here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Analytics</CardTitle>
              <CardDescription>
                Detailed insights into payment patterns and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Analytics Dashboard
                </h3>
                <p className="text-gray-500">
                  Advanced analytics and reporting will be displayed here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
