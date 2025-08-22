// Custom hook for admin data management
"use client";

import { useRealtimeData } from "@/hooks/use-realtime-data";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, orderBy, query, where } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

export interface AdminDataState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  total: number;
  selected: T | null;
  filters: Record<string, any>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface AdminDataActions<T> {
  setData: (data: T[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelected: (item: T | null) => void;
  setFilters: (filters: Record<string, any>) => void;
  setSorting: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  refresh: () => Promise<void>;
  create: (data: Omit<T, 'id'>) => Promise<string>;
  update: (id: string, data: Partial<T>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  exportData: () => void;
}

export interface UseAdminDataOptions<T> {
  collectionName: string;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  realtime?: boolean;
  pageSize?: number;
  createFunction?: (data: Omit<T, 'id'>) => Promise<string>;
  updateFunction?: (id: string, data: Partial<T>) => Promise<void>;
  deleteFunction?: (id: string) => Promise<void>;
  bulkDeleteFunction?: (ids: string[]) => Promise<void>;
}

export function useAdminData<T extends { id: string }>(
  options: UseAdminDataOptions<T>
): AdminDataState<T> & AdminDataActions<T> {
  const {
    collectionName,
    defaultSortBy = 'createdAt',
    defaultSortOrder = 'desc',
    realtime = true,
    pageSize = 50,
    createFunction,
    updateFunction,
    deleteFunction,
    bulkDeleteFunction
  } = options;

  const [state, setState] = useState<AdminDataState<T>>({
    data: [],
    loading: true,
    error: null,
    total: 0,
    selected: null,
    filters: {},
    sortBy: defaultSortBy,
    sortOrder: defaultSortOrder,
  });

  const { toast } = useToast();

  // Build query based on current state
  const buildQuery = useCallback(() => {
    let q = query(collection(db, collectionName));

    // Apply filters
    Object.entries(state.filters).forEach(([field, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        q = query(q, where(field, '==', value));
      }
    });

    // Apply sorting
    q = query(q, orderBy(state.sortBy, state.sortOrder));

    return q;
  }, [collectionName, state.filters, state.sortBy, state.sortOrder]);

  // Use realtime data hook if enabled
  const realtimeQuery = realtime ? buildQuery() : undefined;
  const { data: realtimeData, loading: realtimeLoading, error: realtimeError } = useRealtimeData(
    realtimeQuery!
  );

  // Update state when realtime data changes
  useEffect(() => {
    if (realtime && realtimeData) {
      const transformedData = realtimeData.map((doc: any) => ({ 
        id: doc.id, 
        ...doc.data() 
      } as T));
      
      setState(prev => ({
        ...prev,
        data: transformedData,
        loading: realtimeLoading,
        error: realtimeError,
        total: transformedData.length
      }));
    }
  }, [realtime, realtimeData, realtimeLoading, realtimeError]);

  // Actions
  const setData = useCallback((data: T[]) => {
    setState(prev => ({ ...prev, data, total: data.length }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [toast]);

  const setSelected = useCallback((item: T | null) => {
    setState(prev => ({ ...prev, selected: item }));
  }, []);

  const setFilters = useCallback((filters: Record<string, any>) => {
    setState(prev => ({ ...prev, filters }));
  }, []);

  const setSorting = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setState(prev => ({ ...prev, sortBy, sortOrder }));
  }, []);

  const refresh = useCallback(async () => {
    if (realtime) return; // Data is already refreshed automatically
    
    setLoading(true);
    try {
      // Manual refresh logic for non-realtime mode
      // This would typically involve calling your service functions
      // For now, we'll just clear the error
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [realtime, setLoading, setError]);

  const create = useCallback(async (data: Omit<T, 'id'>): Promise<string> => {
    if (!createFunction) {
      throw new Error('Create function not provided');
    }

    setLoading(true);
    try {
      const id = await createFunction(data);
      
      toast({
        title: "Success",
        description: "Item created successfully",
      });
      
      return id;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create item';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [createFunction, setLoading, setError, toast]);

  const update = useCallback(async (id: string, data: Partial<T>): Promise<void> => {
    if (!updateFunction) {
      throw new Error('Update function not provided');
    }

    setLoading(true);
    try {
      await updateFunction(id, data);
      
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update item';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [updateFunction, setLoading, setError, toast]);

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    if (!deleteFunction) {
      throw new Error('Delete function not provided');
    }

    setLoading(true);
    try {
      await deleteFunction(id);
      
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete item';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [deleteFunction, setLoading, setError, toast]);

  const bulkDelete = useCallback(async (ids: string[]): Promise<void> => {
    if (!bulkDeleteFunction) {
      throw new Error('Bulk delete function not provided');
    }

    setLoading(true);
    try {
      await bulkDeleteFunction(ids);
      
      toast({
        title: "Success",
        description: `${ids.length} items deleted successfully`,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete items';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [bulkDeleteFunction, setLoading, setError, toast]);

  const exportData = useCallback(() => {
    try {
      const dataToExport = state.data.map(item => {
        // Remove internal fields and format for export
        const { id, ...exportItem } = item;
        return { id, ...exportItem };
      });

      const csv = convertToCSV(dataToExport);
      downloadCSV(csv, `${collectionName}-export-${Date.now()}.csv`);

      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    } catch (error: any) {
      setError('Failed to export data');
    }
  }, [state.data, collectionName, setError, toast]);

  return {
    // State
    ...state,
    // Actions
    setData,
    setLoading,
    setError,
    setSelected,
    setFilters,
    setSorting,
    refresh,
    create,
    update,
    delete: deleteItem,
    bulkDelete,
    exportData,
  };
}

// Helper functions for CSV export
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value?.toString() || '';
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}

function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default useAdminData;
