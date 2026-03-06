import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Package, Clock, Truck, ChevronDown, ChevronUp } from "lucide-react";

import api from "@/lib/api";
import { useLoadingCursor } from "@/hooks/useLoadingCursor";

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

const statusColors: Record<ImportStatus, string> = {
  PROCESSING: "bg-blue-100 text-blue-700 border-blue-200",
  SUCCEEDED: "bg-green-100 text-green-700 border-green-200",
  FAILED: "bg-red-100 text-red-700 border-red-200",
  SUCCEEDED_WITH_ERRORS: "bg-amber-100 text-amber-700 border-amber-200",
};

const typeIcons: Record<string, any> = {
  PRODUCTS: Package,
  BACKORDERS: Clock,
  BACKORDER_UPDATE: Clock,
  SUPERSESSION: Package,
  SPECIAL_PRICES: Package,
  FULFILLMENT_STATUS: Truck,
};

const getTypeLabel = (type: ImportType) => {
  if (type.startsWith("PRODUCTS")) return "PRODUCTS";
  return type;
};

export type UploadStage = "idle" | "uploading" | "validating" | "finalizing" | "done";

export const useImportProcessor = () => {
  const [statusFilter, setStatusFilter] = useState<ImportStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<ImportType | "ALL">("ALL");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [density, setDensity] = useState<"comfortable" | "dense">("comfortable");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<ImportType>("PRODUCTS_MIXED");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [specialStartDate, setSpecialStartDate] = useState("");
  const [specialEndDate, setSpecialEndDate] = useState("");
  const uploadTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["imports", statusFilter, typeFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (typeFilter !== "ALL") params.importType = typeFilter;

      const response = await api.get("/admin/imports", { params });
      return response.data.batches as ImportBatch[];
    },
    refetchInterval: 5000,
  });

  const { data: templateData } = useQuery({
    queryKey: ["import-template", uploadType],
    queryFn: async () => {
      const response = await api.get(`/admin/imports/templates/${uploadType}`);
      return response.data.template as UploadTemplate;
    },
    enabled: Boolean(uploadType),
  });

  useLoadingCursor(isLoading || isUploading);

  const activeTemplate = templateData ?? null;

  const clearUploadTimers = () => {
    uploadTimers.current.forEach((timer) => clearTimeout(timer));
    uploadTimers.current = [];
  };

  const scheduleUploadStep = (stage: UploadStage, delayMs: number) => {
    const timer = setTimeout(() => setUploadStage(stage), delayMs);
    uploadTimers.current.push(timer);
  };

  const handleTemplateDownload = async () => {
    if (!activeTemplate) return;
    const response = await api.get(activeTemplate.downloadUrl, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = activeTemplate.templateName || "template";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadStage("uploading");
    clearUploadTimers();
    scheduleUploadStep("validating", 700);
    scheduleUploadStep("finalizing", 1600);

    try {
      if (uploadType === "SPECIAL_PRICES" && (!specialStartDate || !specialEndDate)) {
        alert("Start Date and End Date are required for special price imports.");
        return;
      }

      await api.post("/admin/imports/run", {
        importType: uploadType,
        startsAt: uploadType === "SPECIAL_PRICES" ? specialStartDate || undefined : undefined,
        endsAt: uploadType === "SPECIAL_PRICES" ? specialEndDate || undefined : undefined,
      });
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setSpecialStartDate("");
      setSpecialEndDate("");
      setUploadStage("done");
      alert("Import started successfully!");
    } catch (error: any) {
      alert("Upload failed: " + error.message);
      setUploadStage("idle");
    } finally {
      setIsUploading(false);
      clearUploadTimers();
      if (uploadStage !== "idle") {
        scheduleUploadStep("idle", 1200);
      }
    }
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getSuccessRate = (batch: ImportBatch) => {
    if (!batch.totalRows || batch.totalRows === 0) return 0;
    return Math.round(((batch.validRows || 0) / batch.totalRows) * 100);
  };

  const columns: ColumnDef<ImportBatch>[] = [
    {
      id: "expand",
      cell: ({ row }) => {
        const isExpanded = expandedRows.has(row.original.id);
        return row.original.invalidRows && row.original.invalidRows > 0 ? (
          <button
            type="button"
            onClick={() => toggleRow(row.original.id)}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-slate-800"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        ) : null;
      },
    },
    {
      accessorKey: "fileName",
      header: "File Name",
      cell: ({ row }) => <div className="font-medium">{row.original.fileName}</div>,
    },
    {
      accessorKey: "importType",
      header: "Type",
      cell: ({ row }) => {
        const typeLabel = getTypeLabel(row.original.importType);
        const Icon = typeIcons[typeLabel] || Package;
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
            <Icon className="h-3.5 w-3.5" />
            {typeLabel}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
            statusColors[row.original.status]
          } ${row.original.status === "PROCESSING" ? "animate-pulse" : ""}`}
        >
          {row.original.status.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      accessorKey: "startedAt",
      header: "Uploaded At",
      cell: ({ row }) => (
        <div className="text-sm text-slate-600">
          {new Date(row.original.startedAt).toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "totalRows",
      header: "Total Rows",
      cell: ({ row }) => (
        <div className="text-sm font-mono">{row.original.totalRows?.toLocaleString() || "-"}</div>
      ),
    },
    {
      accessorKey: "validRows",
      header: "Valid",
      cell: ({ row }) => (
        <div className="text-sm font-mono text-green-600">
          {row.original.validRows?.toLocaleString() || "-"}
        </div>
      ),
    },
    {
      accessorKey: "invalidRows",
      header: "Invalid",
      cell: ({ row }) => (
        <div className="text-sm font-mono text-red-600">
          {row.original.invalidRows?.toLocaleString() || "-"}
        </div>
      ),
    },
    {
      id: "successRate",
      header: "Success Rate",
      cell: ({ row }) => {
        const rate = getSuccessRate(row.original);
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-20 rounded-full bg-slate-200">
              <div
                className={`h-2 rounded-full ${
                  rate >= 95 ? "bg-green-500" : rate >= 80 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${rate}%` }}
              />
            </div>
            <span className="text-sm font-medium">{rate}%</span>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data || [],
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return {
    activeTemplate,
    columns,
    data,
    density,
    expandedRows,
    handleTemplateDownload,
    handleUpload,
    isLoading,
    isUploadModalOpen,
    isUploading,
    pagination,
    setDensity,
    setIsUploadModalOpen,
    setPagination,
    setStatusFilter,
    setTypeFilter,
    setUploadFile,
    setUploadType,
    setSpecialEndDate,
    setSpecialStartDate,
    sorting,
    statusFilter,
    table,
    toggleRow,
    typeFilter,
    uploadFile,
    uploadStage,
    uploadType,
    specialEndDate,
    specialStartDate,
  };
};

export type UseImportProcessorReturn = ReturnType<typeof useImportProcessor>;
