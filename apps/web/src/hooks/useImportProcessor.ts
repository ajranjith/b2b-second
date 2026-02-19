"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type ImportStatus = "PROCESSING" | "SUCCEEDED" | "FAILED" | "SUCCEEDED_WITH_ERRORS";
export type ImportType =
  | "PRODUCTS_MIXED"
  | "PRODUCTS_GENUINE"
  | "PRODUCTS_AFTERMARKET"
  | "BACKORDERS"
  | "BACKORDER_UPDATE"
  | "SUPERSESSION"
  | "SPECIAL_PRICES"
  | "FULFILLMENT_STATUS";

export type UploadStep = "idle" | "uploading" | "validating" | "finalizing" | "complete" | "error";

export interface ImportBatch {
  id: string;
  fileName: string;
  importType: ImportType;
  status: ImportStatus;
  startedAt: string;
  uploadedBy: {
    email: string;
  };
  totalRows?: number;
  validRows?: number;
  invalidRows?: number;
}

export interface UploadTemplate {
  id: string;
  templateName: string;
  importType: string;
  downloadUrl: string;
}

export interface UploadState {
  step: UploadStep;
  progress: number;
  error: string | null;
  batchId: string | null;
}

export interface UseImportProcessorOptions {
  statusFilter?: ImportStatus | "ALL";
  typeFilter?: ImportType | "ALL";
  refetchInterval?: number;
}

export function useImportProcessor(options: UseImportProcessorOptions = {}) {
  const { statusFilter = "ALL", typeFilter = "ALL", refetchInterval = 5000 } = options;

  const queryClient = useQueryClient();

  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>({
    step: "idle",
    progress: 0,
    error: null,
    batchId: null,
  });

  // Fetch import batches
  const {
    data: batches,
    isLoading: isLoadingBatches,
    refetch: refetchBatches,
  } = useQuery({
    queryKey: ["imports", statusFilter, typeFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (typeFilter !== "ALL") params.type = typeFilter;

      const response = await api.get("/admin/imports", { params });
      return response.data.batches as ImportBatch[];
    },
    refetchInterval,
  });

  // Templates are fetched on-demand per import type
  const [templates, setTemplates] = useState<UploadTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Get template for a specific import type (fetches from API)
  const getTemplate = useCallback(
    async (importType: ImportType): Promise<UploadTemplate | null> => {
      try {
        const response = await api.get(`/admin/imports/templates/${importType}`);
        const template = response.data?.template as UploadTemplate | undefined;
        if (template) {
          setTemplates((prev) => {
            const exists = prev.some((t) => t.importType === template.importType);
            if (exists) return prev;
            return [...prev, template];
          });
          return template;
        }
        return null;
      } catch {
        return null;
      }
    },
    []
  );

  // Download template
  const downloadTemplate = useCallback(async (template: UploadTemplate) => {
    try {
      const response = await api.get(template.downloadUrl, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = template.templateName || "template.xlsx";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download template:", error);
    }
  }, []);

  // Run import (triggers server-side import processing)
  // Note: File is selected for validation but actual import reads from server-side configured paths
  const uploadFile = useCallback(
    async (
      file: File,
      importType: ImportType,
      options?: { startsAt?: string; endsAt?: string }
    ): Promise<{ success: boolean; error?: string; batchId?: string }> => {
      setUploadState({ step: "uploading", progress: 20, error: null, batchId: null });

      try {
        setUploadState((prev) => ({ ...prev, step: "validating", progress: 50 }));

        // Call the import/run endpoint with JSON payload
        const response = await api.post("/admin/imports/run", {
          importType,
          fileName: file.name,
          ...(importType === "SPECIAL_PRICES" && options?.startsAt && options?.endsAt
            ? { startsAt: options.startsAt, endsAt: options.endsAt }
            : {}),
        });

        setUploadState((prev) => ({ ...prev, step: "finalizing", progress: 80 }));

        // Short delay to show finalizing step
        await new Promise((resolve) => setTimeout(resolve, 500));

        const batchId = response.data?.batch?.batchId || response.data?.batchId || response.data?.id;

        setUploadState({
          step: "complete",
          progress: 100,
          error: null,
          batchId,
        });

        // Refresh the batches list
        queryClient.invalidateQueries({ queryKey: ["imports"] });

        return { success: true, batchId };
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || "Import failed";
        setUploadState({
          step: "error",
          progress: 0,
          error: errorMessage,
          batchId: null,
        });
        return { success: false, error: errorMessage };
      }
    },
    [queryClient]
  );

  // Reset upload state
  const resetUpload = useCallback(() => {
    setUploadState({
      step: "idle",
      progress: 0,
      error: null,
      batchId: null,
    });
  }, []);

  // Calculate success rate for a batch
  const getSuccessRate = useCallback((batch: ImportBatch): number => {
    if (!batch.totalRows || batch.totalRows === 0) return 0;
    return Math.round(((batch.validRows || 0) / batch.totalRows) * 100);
  }, []);

  // Get type label
  const getTypeLabel = useCallback((type: ImportType): string => {
    const labels: Record<ImportType, string> = {
      PRODUCTS_MIXED: "Products",
      PRODUCTS_GENUINE: "Genuine Parts",
      PRODUCTS_AFTERMARKET: "Aftermarket",
      BACKORDERS: "Backorders",
      BACKORDER_UPDATE: "Backorder Updates",
      SUPERSESSION: "Supersessions",
      SPECIAL_PRICES: "Special Prices",
      FULFILLMENT_STATUS: "Fulfillment",
    };
    return labels[type] || type;
  }, []);

  return {
    // Data
    batches: batches || [],
    templates: templates || [],
    isLoading: isLoadingBatches || isLoadingTemplates,
    isLoadingBatches,
    isLoadingTemplates,

    // Upload state
    uploadState,
    isUploading: uploadState.step !== "idle" && uploadState.step !== "complete" && uploadState.step !== "error",

    // Actions
    uploadFile,
    resetUpload,
    downloadTemplate,
    getTemplate,
    refetchBatches,

    // Utilities
    getSuccessRate,
    getTypeLabel,
  };
}
