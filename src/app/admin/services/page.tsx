// Admin services management page
"use client";

import {
  AdminTable,
  AdminTableAction,
  AdminTableColumn,
} from "@/components/shared/AdminTable";
import { ServiceStats } from "@/components/shared/ServiceStats";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Service, useAdminServices } from "@/hooks/admin/useAdminServices";
import { zodResolver } from "@hookform/resolvers/zod";
import { Car, Database, Edit, Globe, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

// Validation schema
const serviceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  icon: z.string().min(1, "Icon is required"),
  category: z.string().min(1, "Category is required"),
  price: z.string().min(1, "Price is required"),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

// Categories
const TRAINING_CATEGORIES = [
  "Basic Training",
  "Advanced Driving",
  "Defensive Driving",
  "Highway Training",
  "Night Driving",
  "Winter Driving",
  "Parking Skills",
  "Test Preparation",
];

const ONLINE_CATEGORIES = [
  "Theory Courses",
  "Practice Tests",
  "Video Tutorials",
  "Interactive Modules",
  "Assessment Tools",
  "Progress Tracking",
  "Digital Resources",
  "Mobile Apps",
];

export default function AdminServicesView() {
  const {
    trainingServices,
    onlineServices,
    seedingStatus,
    isLoading,
    isSeedingLoading,
    createService,
    updateService,
    deleteService,
    executeSeedingAction,
  } = useAdminServices();

  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOnlineService, setIsOnlineService] = useState(false);

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: "",
      description: "",
      icon: "",
      category: "",
      price: "",
      features: [],
      isActive: true,
    },
  });

  const handleSaveService = async (data: ServiceFormData) => {
    try {
      if (editingService) {
        await updateService(editingService.id, data);
      } else {
        await createService(data, isOnlineService ? "online" : "training");
      }
      setIsDialogOpen(false);
      setEditingService(null);
      form.reset();
    } catch (error) {
      console.error("Error saving service:", error);
    }
  };

  const handleDeleteService = async (service: Service) => {
    await deleteService(service.id);
  };

  const openEditDialog = (service: Service) => {
    setEditingService(service);
    setIsOnlineService(
      service.category !== undefined &&
        ONLINE_CATEGORIES.includes(service.category)
    );
    form.reset({
      title: service.title,
      description: service.description,
      icon: service.icon,
      category: service.category,
      price: service.price,
      features: service.features,
      isActive: service.isActive,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = (isOnline = false) => {
    setEditingService(null);
    setIsOnlineService(isOnline);
    form.reset({
      title: "",
      description: "",
      icon: "",
      category: "",
      price: "",
      features: [],
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  // Table configurations
  const trainingColumns: AdminTableColumn<Service>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (value, service) => (
        <div>
          <div className="font-medium">{service.title}</div>
          <div className="text-sm text-muted-foreground">
            {service.category}
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (value, service) => (
        <div className="font-medium">{service.price}</div>
      ),
    },
    {
      key: "features",
      header: "Features",
      render: (value, service) => (
        <div className="text-sm">{service.features.length} features</div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (value, service) => (
        <Badge variant={service.isActive ? "default" : "secondary"}>
          {service.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const onlineColumns: AdminTableColumn<Service>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      render: (value, service) => (
        <div>
          <div className="font-medium">{service.title}</div>
          <div className="text-sm text-muted-foreground">
            {service.category}
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (value, service) => (
        <div className="font-medium">{service.price}</div>
      ),
    },
    {
      key: "features",
      header: "Features",
      render: (value, service) => (
        <div className="text-sm">{service.features.length} features</div>
      ),
    },
    {
      key: "isActive",
      header: "Status",
      render: (value, service) => (
        <Badge variant={service.isActive ? "default" : "secondary"}>
          {service.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  const actions: AdminTableAction<Service>[] = [
    {
      label: "Edit",
      icon: Edit,
      onClick: openEditDialog,
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: handleDeleteService,
      variant: "destructive",
      requiresConfirmation: true,
      confirmationTitle: "Delete Service",
      confirmationDescription:
        "Are you sure you want to delete this service? This action cannot be undone.",
    },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Statistics Overview */}
      <ServiceStats
        trainingServices={trainingServices}
        onlineServices={onlineServices}
        seedingStatus={seedingStatus}
        isSeedingLoading={isSeedingLoading}
        onExecuteSeedingAction={executeSeedingAction}
        loading={isLoading}
      />

      {/* Main Content */}
      <Tabs defaultValue="training" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Training Services ({trainingServices.length})
            </TabsTrigger>
            <TabsTrigger value="online" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Online Services ({onlineServices.length})
            </TabsTrigger>
            <TabsTrigger value="seeding" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database Seeding
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="training">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Training Services</CardTitle>
                  <CardDescription>
                    Manage in-person driving instruction services
                  </CardDescription>
                </div>
                <Button onClick={() => openCreateDialog(false)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Training Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AdminTable
                data={trainingServices}
                columns={trainingColumns}
                actions={actions}
                title="Training Services"
                description="In-person driving instruction services"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="online">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Online Services</CardTitle>
                  <CardDescription>
                    Manage digital learning tools and online courses
                  </CardDescription>
                </div>
                <Button onClick={() => openCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Online Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <AdminTable
                data={onlineServices}
                columns={onlineColumns}
                actions={actions}
                title="Online Services"
                description="Digital learning tools and online courses"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seeding">
          <ServiceStats
            trainingServices={trainingServices}
            onlineServices={onlineServices}
            seedingStatus={seedingStatus}
            isSeedingLoading={isSeedingLoading}
            onExecuteSeedingAction={executeSeedingAction}
            loading={isLoading}
          />
        </TabsContent>
      </Tabs>

      {/* Service Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Create New Service"}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? "Update the service information below."
                : "Fill in the service details to create a new service."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSaveService)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Service title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., $60 or $30/month"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Car, Globe, Book"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(isOnlineService
                            ? ONLINE_CATEGORIES
                            : TRAINING_CATEGORIES
                          ).map((category: string) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed service description"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Service is available for booking
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
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
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
