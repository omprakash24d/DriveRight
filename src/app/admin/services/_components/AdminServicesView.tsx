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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  Award,
  BookOpen,
  Car,
  CheckCircle,
  Clock,
  Database,
  DollarSign,
  Download,
  Edit,
  FileText,
  Globe,
  Monitor,
  Plus,
  RefreshCw,
  Shield,
  Target,
  Trash2,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// Service type definitions
interface Service {
  id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  duration: string;
  category: string;
  features: string[];
  icon: string;
  status: "active" | "inactive" | "coming_soon";
  order: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_OPTIONS = [
  "Beginner Training",
  "Advanced Training",
  "Professional Development",
  "License Preparation",
  "Safety & Compliance",
  "Online Tools",
  "Digital Resources",
  "Practice Materials",
  "Video Tutorials",
  "Assessment Tools",
];

const ICON_OPTIONS = [
  { value: "Car", label: "Car", icon: Car },
  { value: "Monitor", label: "Monitor", icon: Monitor },
  { value: "BookOpen", label: "Book", icon: BookOpen },
  { value: "Award", label: "Award", icon: Award },
  { value: "FileText", label: "Document", icon: FileText },
  { value: "Video", label: "Video", icon: Video },
  { value: "Download", label: "Download", icon: Download },
  { value: "Shield", label: "Shield", icon: Shield },
  { value: "Zap", label: "Zap", icon: Zap },
  { value: "Target", label: "Target", icon: Target },
  { value: "Users", label: "Users", icon: Users },
  { value: "Globe", label: "Globe", icon: Globe },
];

const getIconComponent = (iconName: string) => {
  const IconComponent =
    ICON_OPTIONS.find((opt) => opt.value === iconName)?.icon || FileText;
  return IconComponent;
};

export function AdminServicesView() {
  const { toast } = useToast();
  const { getIdToken } = useAuth();
  const [trainingServices, setTrainingServices] = useState<Service[]>([]);
  const [onlineServices, setOnlineServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [activeTab, setActiveTab] = useState("training");

  // Seeding state
  const [seedingStatus, setSeedingStatus] = useState<{
    needsSeeding: boolean;
    existingTraining: number;
    existingOnline: number;
  } | null>(null);
  const [isSeedingLoading, setIsSeedingLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    longDescription: "",
    price: "",
    originalPrice: "",
    discountPercent: "",
    duration: "",
    category: "",
    features: "",
    icon: "FileText",
    status: "active" as "active" | "inactive" | "coming_soon",
  });

  const getAuthHeaders = useCallback(async () => {
    const token = await getIdToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, [getIdToken]);

  const loadServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();

      // Load training services
      const trainingResponse = await fetch(
        "/api/admin/services?type=training",
        {
          headers,
        }
      );

      // Load online services
      const onlineResponse = await fetch("/api/admin/services?type=online", {
        headers,
      });

      if (trainingResponse.ok) {
        const trainingData = await trainingResponse.json();
        setTrainingServices(trainingData.data || []);
      }

      if (onlineResponse.ok) {
        const onlineData = await onlineResponse.json();
        setOnlineServices(onlineData.data || []);
      }
    } catch (error) {
      console.error("Error loading services:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load services",
      });
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, toast]);

  const checkSeedingStatus = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/admin/seed?action=check", { headers });

      if (response.ok) {
        const data = await response.json();
        setSeedingStatus(data.data);
      }
    } catch (error) {
      console.error("Error checking seeding status:", error);
    }
  }, [getAuthHeaders]);

  // Load services on component mount
  useEffect(() => {
    loadServices();
    checkSeedingStatus();
  }, [loadServices, checkSeedingStatus]);

  const executeSeedingAction = async (
    action: string,
    force: boolean = false
  ) => {
    setIsSeedingLoading(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/admin/seed", {
        method: "POST",
        headers,
        body: JSON.stringify({ action, force }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        // Refresh both seeding status and services
        await checkSeedingStatus();
        await loadServices();
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
      setIsSeedingLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      shortDescription: "",
      longDescription: "",
      price: "",
      originalPrice: "",
      discountPercent: "",
      duration: "",
      category: "",
      features: "",
      icon: "FileText",
      status: "active" as "active" | "inactive" | "coming_soon",
    });
    setEditingService(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      shortDescription: service.shortDescription,
      longDescription: service.longDescription,
      price: service.price.toString(),
      originalPrice: service.originalPrice?.toString() || "",
      discountPercent: service.discountPercent?.toString() || "",
      duration: service.duration,
      category: service.category,
      features: service.features.join(", "),
      icon: service.icon,
      status: service.status,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const headers = await getAuthHeaders();

      // Process form data
      const serviceData = {
        title: formData.title,
        shortDescription: formData.shortDescription,
        longDescription: formData.longDescription,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice
          ? parseFloat(formData.originalPrice)
          : undefined,
        discountPercent: formData.discountPercent
          ? parseFloat(formData.discountPercent)
          : undefined,
        duration: formData.duration,
        category: formData.category,
        features: formData.features
          .split(",")
          .map((f) => f.trim())
          .filter((f) => f),
        icon: formData.icon,
        status: formData.status,
        order: editingService
          ? editingService.order
          : Math.max(
              ...trainingServices.map((s) => s.order || 0),
              ...onlineServices.map((s) => s.order || 0)
            ) + 1,
      };

      const serviceType = activeTab;

      if (editingService) {
        // Update existing service
        const response = await fetch("/api/admin/services", {
          method: "PUT",
          headers,
          body: JSON.stringify({
            type: serviceType,
            id: editingService.id,
            service: serviceData,
          }),
        });

        if (!response.ok) throw new Error("Failed to update service");

        toast({
          title: "Service Updated",
          description: "Service has been successfully updated",
        });
      } else {
        // Create new service
        const response = await fetch("/api/admin/services", {
          method: "POST",
          headers,
          body: JSON.stringify({
            type: serviceType,
            service: serviceData,
          }),
        });

        if (!response.ok) throw new Error("Failed to create service");

        toast({
          title: "Service Created",
          description: "New service has been successfully created",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadServices(); // Reload the services
    } catch (error) {
      console.error("Error saving service:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save service",
      });
    }
  };

  const handleDelete = async (service: Service) => {
    if (!confirm(`Are you sure you want to delete "${service.title}"?`)) {
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const serviceType = activeTab;

      const response = await fetch(
        `/api/admin/services?type=${serviceType}&id=${service.id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) throw new Error("Failed to delete service");

      toast({
        title: "Service Deleted",
        description: "Service has been successfully deleted",
      });

      loadServices(); // Reload the services
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete service",
      });
    }
  };

  const ServiceCard = ({ service }: { service: Service }) => {
    const IconComponent = getIconComponent(service.icon);

    return (
      <Card className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconComponent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{service.title}</CardTitle>
                <CardDescription className="text-sm">
                  {service.category}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  service.status === "active"
                    ? "default"
                    : service.status === "inactive"
                    ? "secondary"
                    : "outline"
                }
              >
                {service.status === "active" && (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                {service.status === "inactive" && (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                {service.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {service.shortDescription}
          </p>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-semibold">₹{service.price}</span>
              {service.originalPrice && (
                <span className="text-muted-foreground line-through ml-1">
                  ₹{service.originalPrice}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>{service.duration}</span>
            </div>
          </div>

          {service.features.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground">Features</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {service.features.slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {service.features.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{service.features.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center">
            <div className="text-xs text-muted-foreground">
              Order: {service.order}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(service)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(service)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Setup Section */}
      {seedingStatus && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">
                Quick Setup
              </CardTitle>
            </div>
            <CardDescription className="text-blue-700">
              {seedingStatus.needsSeeding
                ? "No services found. Get started by seeding sample data with your exact pricing."
                : `Found ${seedingStatus.existingTraining} training and ${seedingStatus.existingOnline} online services.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => executeSeedingAction("seed-enhanced-only")}
                disabled={isSeedingLoading}
                size="sm"
                variant={seedingStatus.needsSeeding ? "default" : "outline"}
              >
                {isSeedingLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Add Sample Services
              </Button>

              {!seedingStatus.needsSeeding && (
                <Button
                  onClick={() => executeSeedingAction("force-reseed", true)}
                  disabled={isSeedingLoading}
                  size="sm"
                  variant="outline"
                >
                  {isSeedingLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Reset to Sample Data
                </Button>
              )}

              <Button
                onClick={checkSeedingStatus}
                disabled={isSeedingLoading}
                size="sm"
                variant="ghost"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {seedingStatus.needsSeeding && (
              <div className="text-sm text-blue-600 bg-blue-100 p-2 rounded">
                <strong>Sample services include:</strong> LMV Training (₹6,000),
                HMV Training (₹11,000), MCWG Training (₹5,000), Refresher Course
                (₹3,500), DL Printout (₹450), License Download (Free)
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Services Management</h1>
          <p className="text-muted-foreground">
            Manage your driving training services and online resources
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Training Services ({trainingServices.length})
          </TabsTrigger>
          <TabsTrigger value="online" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Online Services ({onlineServices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="training" className="space-y-4">
          {trainingServices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Car className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Training Services
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start by creating your first training service
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Training Service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trainingServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="online" className="space-y-4">
          {onlineServices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Monitor className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Online Services
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start by creating your first online service
                </p>
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Online Service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {onlineServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService
                ? "Edit Service"
                : `Add New ${
                    activeTab === "training" ? "Training" : "Online"
                  } Service`}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? "Update the service details below"
                : `Create a new ${
                    activeTab === "training" ? "training" : "online"
                  } service with pricing and features`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Service title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shortDescription: e.target.value,
                  }))
                }
                placeholder="Brief description for cards"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longDescription">Long Description</Label>
              <Textarea
                id="longDescription"
                value={formData.longDescription}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    longDescription: e.target.value,
                  }))
                }
                placeholder="Detailed description"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  placeholder="1000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="originalPrice">Original Price (₹)</Label>
                <Input
                  id="originalPrice"
                  type="number"
                  value={formData.originalPrice}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      originalPrice: e.target.value,
                    }))
                  }
                  placeholder="1500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountPercent">Discount (%)</Label>
                <Input
                  id="discountPercent"
                  type="number"
                  value={formData.discountPercent}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      discountPercent: e.target.value,
                    }))
                  }
                  placeholder="20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration: e.target.value,
                    }))
                  }
                  placeholder="2 weeks, 1 month, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, icon: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, features: e.target.value }))
                }
                placeholder="Online access, Certificate included, 24/7 support"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="coming_soon">Coming Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingService ? "Update Service" : "Create Service"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
