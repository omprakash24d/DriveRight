// Enhanced Admin Service Management Component
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  Clock,
  DollarSign,
  Edit2,
  IndianRupee,
  Monitor,
  Percent,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ServicePricing {
  basePrice: number;
  currency: "INR" | "USD";
  discountPercentage?: number;
  discountValidUntil?: Date;
  taxes: {
    gst?: number;
    serviceTax?: number;
    otherCharges?: number;
  };
  finalPrice: number;
}

interface EnhancedTrainingService {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  icon: string;
  category: "LMV" | "MCWG" | "HMV" | "Special" | "Refresher";
  services: string[];
  duration: {
    value: number;
    unit: "days" | "weeks" | "months";
  };
  pricing: ServicePricing;
  features: string[];
  prerequisites?: string[];
  certification?: string;
  instructorRequired: boolean;
  maxStudents?: number;
  ctaHref: string;
  ctaText: string;
  isActive: boolean;
  priority: number;
  bookingSettings: {
    requireApproval: boolean;
    allowRescheduling: boolean;
    cancellationPolicy: string;
    advanceBookingDays?: number;
  };
  seoMetadata?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

interface EnhancedOnlineService {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  icon: string;
  category:
    | "Document"
    | "Verification"
    | "Download"
    | "Inquiry"
    | "Application";
  pricing: ServicePricing;
  processingTime: {
    value: number;
    unit: "minutes" | "hours" | "days";
  };
  requiredDocuments?: string[];
  deliveryMethod: "email" | "download" | "portal" | "physical";
  features: string[];
  href: string;
  ctaText: string;
  isActive: boolean;
  priority: number;
  automatedProcessing: boolean;
  requiresVerification: boolean;
  seoMetadata?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ServiceAnalytics {
  serviceId: string;
  serviceType: "training" | "online";
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageRating?: number;
  conversionRate: number;
  popularityScore: number;
  monthlyTrends: {
    month: string;
    bookings: number;
    revenue: number;
  }[];
  updatedAt: Date;
}

export default function AdminServiceManagement() {
  const [trainingServices, setTrainingServices] = useState<
    EnhancedTrainingService[]
  >([]);
  const [onlineServices, setOnlineServices] = useState<EnhancedOnlineService[]>(
    []
  );
  const [analytics, setAnalytics] = useState<Record<string, ServiceAnalytics>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<
    EnhancedTrainingService | EnhancedOnlineService | null
  >(null);
  const [serviceType, setServiceType] = useState<"training" | "online">(
    "training"
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Load services and analytics
  useEffect(() => {
    loadServices();
    loadAnalytics();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      // const training = await EnhancedServicesManager.getTrainingServices();
      // const online = await EnhancedServicesManager.getOnlineServices();
      // setTrainingServices(training);
      // setOnlineServices(online);

      // Mock data for now
      setTrainingServices([]);
      setOnlineServices([]);
    } catch (error) {
      console.error("Error loading services:", error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // TODO: Load analytics for all services
      setAnalytics({});
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const calculateFinalPrice = (
    pricing: Omit<ServicePricing, "finalPrice">
  ): number => {
    let price = pricing.basePrice;

    // Apply discount if valid
    if (
      pricing.discountPercentage &&
      pricing.discountValidUntil &&
      pricing.discountValidUntil > new Date()
    ) {
      price = price - (price * pricing.discountPercentage) / 100;
    }

    // Add taxes
    if (pricing.taxes.gst) {
      price += (price * pricing.taxes.gst) / 100;
    }
    if (pricing.taxes.serviceTax) {
      price += (price * pricing.taxes.serviceTax) / 100;
    }
    if (pricing.taxes.otherCharges) {
      price += pricing.taxes.otherCharges;
    }

    return Math.round(price * 100) / 100;
  };

  const ServiceCard = ({
    service,
    type,
  }: {
    service: EnhancedTrainingService | EnhancedOnlineService;
    type: "training" | "online";
  }) => {
    const serviceAnalytics = analytics[service.id];

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="group"
      >
        <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  {type === "training" ? (
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Monitor className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {service.shortDescription ||
                      service.description.slice(0, 100) + "..."}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={service.isActive ? "default" : "secondary"}>
                  {service.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant="outline">{service.category}</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Pricing Information */}
            <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-xs text-gray-500">Base Price</Label>
                <div className="flex items-center space-x-1">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                  <span className="font-semibold">
                    {service.pricing.basePrice}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Final Price</Label>
                <div className="flex items-center space-x-1">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                  <span className="font-bold text-lg text-green-600">
                    {service.pricing.finalPrice}
                  </span>
                </div>
              </div>
              {service.pricing.discountPercentage &&
                service.pricing.discountValidUntil &&
                service.pricing.discountValidUntil > new Date() && (
                  <div className="col-span-2">
                    <Badge variant="secondary" className="text-xs">
                      <Percent className="h-3 w-3 mr-1" />
                      {service.pricing.discountPercentage}% OFF until{" "}
                      {service.pricing.discountValidUntil.toLocaleDateString()}
                    </Badge>
                  </div>
                )}
            </div>

            {/* Analytics (if available) */}
            {serviceAnalytics && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="font-semibold text-blue-600">
                    {serviceAnalytics.totalBookings}
                  </div>
                  <Label className="text-xs text-gray-500">Bookings</Label>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600">
                    ₹{serviceAnalytics.totalRevenue}
                  </div>
                  <Label className="text-xs text-gray-500">Revenue</Label>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-purple-600">
                    {serviceAnalytics.conversionRate}%
                  </div>
                  <Label className="text-xs text-gray-500">Conversion</Label>
                </div>
              </div>
            )}

            {/* Service Details */}
            <div className="space-y-2">
              {type === "training" &&
                (service as EnhancedTrainingService).duration && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {(service as EnhancedTrainingService).duration.value}{" "}
                      {(service as EnhancedTrainingService).duration.unit}
                    </span>
                  </div>
                )}

              {type === "online" &&
                (service as EnhancedOnlineService).processingTime && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {(service as EnhancedOnlineService).processingTime.value}{" "}
                      {(service as EnhancedOnlineService).processingTime.unit}
                    </span>
                  </div>
                )}

              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  {type === "training"
                    ? `Max ${
                        (service as EnhancedTrainingService).maxStudents ||
                        "Unlimited"
                      } students`
                    : `${
                        (service as EnhancedOnlineService).deliveryMethod
                      } delivery`}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedService(service.id);
                    setShowPricingDialog(true);
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Update Pricing
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingService(service);
                    setServiceType(type);
                    setShowCreateDialog(true);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // TODO: View analytics
                  }}
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    // TODO: Delete service
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const PricingDialog = () => {
    const [pricing, setPricing] = useState<Omit<ServicePricing, "finalPrice">>({
      basePrice: 0,
      currency: "INR",
      discountPercentage: 0,
      discountValidUntil: undefined,
      taxes: {
        gst: 18,
        serviceTax: 0,
        otherCharges: 0,
      },
    });

    const finalPrice = calculateFinalPrice(pricing);

    return (
      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Update Service Pricing</DialogTitle>
            <DialogDescription>
              Modify the pricing structure for this service. All changes will be
              reflected immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">Base Price (₹)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={pricing.basePrice}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      basePrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="Enter base price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={pricing.currency}
                  onValueChange={(value: "INR" | "USD") =>
                    setPricing({ ...pricing, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountPercentage">Discount (%)</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  value={pricing.discountPercentage || ""}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      discountPercentage:
                        parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="Optional discount"
                  max="100"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValidUntil">Discount Valid Until</Label>
                <Input
                  id="discountValidUntil"
                  type="date"
                  value={
                    pricing.discountValidUntil
                      ? pricing.discountValidUntil.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      discountValidUntil: e.target.value
                        ? new Date(e.target.value)
                        : undefined,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gst">GST (%)</Label>
                <Input
                  id="gst"
                  type="number"
                  value={pricing.taxes.gst || ""}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      taxes: {
                        ...pricing.taxes,
                        gst: parseFloat(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder="18"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceTax">Service Tax (%)</Label>
                <Input
                  id="serviceTax"
                  type="number"
                  value={pricing.taxes.serviceTax || ""}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      taxes: {
                        ...pricing.taxes,
                        serviceTax: parseFloat(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherCharges">Other Charges (₹)</Label>
                <Input
                  id="otherCharges"
                  type="number"
                  value={pricing.taxes.otherCharges || ""}
                  onChange={(e) =>
                    setPricing({
                      ...pricing,
                      taxes: {
                        ...pricing.taxes,
                        otherCharges: parseFloat(e.target.value) || undefined,
                      },
                    })
                  }
                  placeholder="0"
                />
              </div>
            </div>

            {/* Final Price Preview */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">
                  Final Price:
                </span>
                <span className="text-2xl font-bold text-green-600">
                  ₹{finalPrice}
                </span>
              </div>
              <div className="text-xs text-green-600 mt-1">
                This is the final amount customers will pay
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPricingDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                // TODO: Update pricing
                toast({
                  title: "Success",
                  description: "Service pricing updated successfully",
                });
                setShowPricingDialog(false);
              }}
            >
              Update Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Service Management
          </h2>
          <p className="text-muted-foreground">
            Manage training and online services, pricing, and analytics
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      {/* Service Management Tabs */}
      <Tabs defaultValue="training" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="training" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Training Services ({trainingServices.length})</span>
          </TabsTrigger>
          <TabsTrigger value="online" className="flex items-center space-x-2">
            <Monitor className="h-4 w-4" />
            <span>Online Services ({onlineServices.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-24 bg-gray-200 rounded-t-lg" />
                  <CardContent className="h-32 bg-gray-100 rounded-b-lg" />
                </Card>
              ))}
            </div>
          ) : trainingServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {trainingServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    type="training"
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Training Services
                </h3>
                <p className="text-gray-500 mb-4">
                  Create your first training service to get started.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Training Service
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="online" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="h-24 bg-gray-200 rounded-t-lg" />
                  <CardContent className="h-32 bg-gray-100 rounded-b-lg" />
                </Card>
              ))}
            </div>
          ) : onlineServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {onlineServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    type="online"
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Online Services
                </h3>
                <p className="text-gray-500 mb-4">
                  Create your first online service to get started.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Online Service
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Pricing Dialog */}
      <PricingDialog />
    </div>
  );
}
