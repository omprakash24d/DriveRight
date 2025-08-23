// Hook for managing admin services
"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  price: string;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceFormData {
  title: string;
  description: string;
  icon: string;
  category: string;
  price: string;
  features: string[];
  isActive: boolean;
}

export interface SeedingStatus {
  training: { count: number; lastSeeded: string | null };
  online: { count: number; lastSeeded: string | null };
}

export function useAdminServices() {
  const { toast } = useToast();
  const { getIdToken } = useAuth();
  
  // State
  const [trainingServices, setTrainingServices] = useState<Service[]>([]);
  const [onlineServices, setOnlineServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [seedingStatus, setSeedingStatus] = useState<SeedingStatus>({
    training: { count: 0, lastSeeded: null },
    online: { count: 0, lastSeeded: null }
  });
  const [isSeedingLoading, setIsSeedingLoading] = useState(false);

  // Auth headers helper: only include Authorization when token exists
  const getAuthHeaders = useCallback(async () => {
    const token = await getIdToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }, [getIdToken]);

  // Add development admin token header in development (client-side only)
  const addDevAdminHeader = (headers: Record<string, string>) => {
    try {
      const devToken = process.env.NEXT_PUBLIC_DEV_ADMIN_TOKEN;
      if (devToken && process.env.NODE_ENV === "development") {
        headers["x-dev-admin-token"] = devToken;
      }
    } catch (_) {
      // ignore in non-build environments
    }
    return headers;
  };

  // Load services
  const loadServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeaders();

      const fetchHeaders = addDevAdminHeader({ ...headers });
      const [trainingResponse, onlineResponse] = await Promise.all([
        fetch("/api/admin/services?type=training", { headers: fetchHeaders, credentials: 'include' }),
        fetch("/api/admin/services?type=online", { headers: fetchHeaders, credentials: 'include' })
      ]);

      if (trainingResponse.ok) {
        const trainingData = await trainingResponse.json();
        setTrainingServices(trainingData.data || []);
      } else {
        throw new Error('Failed to load training services');
      }

      if (onlineResponse.ok) {
        const onlineData = await onlineResponse.json();
        setOnlineServices(onlineData.data || []);
      } else {
        throw new Error('Failed to load online services');
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

  // Check seeding status
  const checkSeedingStatus = useCallback(async () => {
    try {
  const headers = await getAuthHeaders();
  const fetchHeaders = addDevAdminHeader({ ...headers });
  const response = await fetch("/api/admin/seed?action=check", { headers: fetchHeaders, credentials: 'include' });

      if (response.ok) {
        const data = await response.json();
        setSeedingStatus(data.data);
      }
    } catch (error) {
      console.error("Error checking seeding status:", error);
    }
  }, [getAuthHeaders]);

  // Execute seeding action
  const executeSeedingAction = useCallback(async (
    action: string,
    force: boolean = false
  ) => {
    setIsSeedingLoading(true);
    try {
      const headers = await getAuthHeaders();
      const fetchHeaders = addDevAdminHeader({ ...headers });
      const response = await fetch("/api/admin/seed", {
        method: "POST",
        headers: fetchHeaders,
        credentials: 'include',
        body: JSON.stringify({ action, force }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        // Refresh both seeding status and services
        await Promise.all([checkSeedingStatus(), loadServices()]);
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
  }, [getAuthHeaders, toast, checkSeedingStatus, loadServices]);

  // Create service
  const createService = useCallback(async (
    serviceData: ServiceFormData,
    type: 'training' | 'online'
  ): Promise<string> => {
    try {
      const headers = await getAuthHeaders();
      const fetchHeaders = addDevAdminHeader({ ...headers });
      const response = await fetch("/api/admin/services", {
        method: "POST",
        headers: fetchHeaders,
        credentials: 'include',
        body: JSON.stringify({ ...serviceData, type }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Service created successfully",
        });
        await loadServices();
        return data.id;
      } else {
        throw new Error(data.error || "Failed to create service");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create service",
        variant: "destructive",
      });
      throw error;
    }
  }, [getAuthHeaders, toast, loadServices]);

  // Update service
  const updateService = useCallback(async (
    id: string,
    serviceData: Partial<ServiceFormData>
  ): Promise<void> => {
    try {
      const headers = await getAuthHeaders();
      const fetchHeaders = addDevAdminHeader({ ...headers });
      const response = await fetch(`/api/admin/services/${id}`, {
        method: "PUT",
        headers: fetchHeaders,
        credentials: 'include',
        body: JSON.stringify(serviceData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Service updated successfully",
        });
        await loadServices();
      } else {
        throw new Error(data.error || "Failed to update service");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update service",
        variant: "destructive",
      });
      throw error;
    }
  }, [getAuthHeaders, toast, loadServices]);

  // Delete service
  const deleteService = useCallback(async (id: string): Promise<void> => {
    try {
      const headers = await getAuthHeaders();
      const fetchHeaders = addDevAdminHeader({ ...headers });
      const response = await fetch(`/api/admin/services/${id}`, {
        method: "DELETE",
        headers: fetchHeaders,
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Service deleted successfully",
        });
        await loadServices();
      } else {
        throw new Error(data.error || "Failed to delete service");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete service",
        variant: "destructive",
      });
      throw error;
    }
  }, [getAuthHeaders, toast, loadServices]);

  // Toggle service status
  const toggleServiceStatus = useCallback(async (
    id: string,
    isActive: boolean
  ): Promise<void> => {
    await updateService(id, { isActive });
  }, [updateService]);

  // Export services
  const exportServices = useCallback(async (type: 'training' | 'online') => {
    try {
      const headers = await getAuthHeaders();
      const fetchHeaders = addDevAdminHeader({ ...headers });
      const response = await fetch(`/api/admin/services/export?type=${type}`, {
        headers: fetchHeaders,
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${type}-services-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Success",
          description: "Services exported successfully",
        });
      } else {
        throw new Error("Failed to export services");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export services",
        variant: "destructive",
      });
    }
  }, [getAuthHeaders, toast]);

  // Initialize data
  useEffect(() => {
    loadServices();
    checkSeedingStatus();
  }, [loadServices, checkSeedingStatus]);

  return {
    // State
    trainingServices,
    onlineServices,
    isLoading,
    seedingStatus,
    isSeedingLoading,
    
    // Actions
    loadServices,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    exportServices,
    executeSeedingAction,
    checkSeedingStatus,
  };
}

export default useAdminServices;
