// Reusable service form component
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Service, ServiceFormData } from "@/hooks/admin/useAdminServices";
import { Loader2, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

// Constants
const CATEGORY_OPTIONS = [
  { value: "driving", label: "Driving Training" },
  { value: "license", label: "License Services" },
  { value: "certificate", label: "Certificate Services" },
  { value: "consultation", label: "Consultation" },
  { value: "refresher", label: "Refresher Courses" },
  { value: "specialized", label: "Specialized Training" },
];

const ICON_OPTIONS = [
  { value: "Car", label: "Car" },
  { value: "Truck", label: "Truck" },
  { value: "Bike", label: "Motorcycle" },
  { value: "FileText", label: "Document" },
  { value: "Download", label: "Download" },
  { value: "Shield", label: "Shield" },
  { value: "Award", label: "Award" },
  { value: "BookOpen", label: "Book" },
  { value: "Monitor", label: "Monitor" },
  { value: "Globe", label: "Globe" },
];

export interface ServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: ServiceFormData,
    type: "training" | "online"
  ) => Promise<void>;
  editingService?: Service | null;
  serviceType: "training" | "online";
  loading?: boolean;
}

export function ServiceForm({
  isOpen,
  onClose,
  onSubmit,
  editingService,
  serviceType,
  loading = false,
}: ServiceFormProps) {
  const [formData, setFormData] = useState<ServiceFormData>({
    title: "",
    description: "",
    icon: "Car",
    category: "driving",
    price: "",
    features: [],
    isActive: true,
  });

  const [newFeature, setNewFeature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens/closes or editing service changes
  useEffect(() => {
    if (isOpen) {
      if (editingService) {
        setFormData({
          title: editingService.title,
          description: editingService.description,
          icon: editingService.icon,
          category: editingService.category,
          price: editingService.price,
          features: [...editingService.features],
          isActive: editingService.isActive,
        });
      } else {
        setFormData({
          title: "",
          description: "",
          icon: "Car",
          category: "driving",
          price: "",
          features: [],
          isActive: true,
        });
      }
      setNewFeature("");
    }
  }, [isOpen, editingService]);

  const handleInputChange = (field: keyof ServiceFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData((prev) => ({
        ...prev,
        features: [...prev.features, newFeature.trim()],
      }));
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData, serviceType);
      onClose();
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.title.trim() &&
    formData.description.trim() &&
    formData.price.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingService ? "Edit" : "Add"}{" "}
            {serviceType === "training" ? "Training" : "Online"} Service
          </DialogTitle>
          <DialogDescription>
            {editingService
              ? "Update the service details below."
              : `Create a new ${serviceType} service for your driving school.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Service Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter service title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the service"
              rows={3}
              required
            />
          </div>

          {/* Icon and Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => handleInputChange("icon", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select icon" />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
            <Input
              id="price"
              value={formData.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              placeholder="e.g., ₹15,000 or Free"
              required
            />
          </div>

          {/* Features */}
          <div className="space-y-2">
            <Label>Features</Label>

            {/* Add new feature */}
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Add a feature"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addFeature())
                }
              />
              <Button
                type="button"
                onClick={addFeature}
                size="sm"
                disabled={!newFeature.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Existing features */}
            {formData.features.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1">
                    {feature}
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isActive">Service Status</Label>
              <div className="text-sm text-muted-foreground">
                {formData.isActive
                  ? "Service is active and visible"
                  : "Service is inactive and hidden"}
              </div>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                handleInputChange("isActive", checked)
              }
            />
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting || loading}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingService ? "Updating..." : "Creating..."}
                </>
              ) : editingService ? (
                "Update Service"
              ) : (
                "Create Service"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ServiceForm;
