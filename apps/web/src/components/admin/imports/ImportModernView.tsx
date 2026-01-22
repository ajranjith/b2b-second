"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/ui";
import {
  Upload,
  Download,
  FileSpreadsheet,
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadDropZone } from "./UploadDropZone";
import { ImportStepper } from "./ImportStepper";
import type {
  ImportBatch,
  ImportType,
  ImportStatus,
  UploadStep,
  UploadState,
  UploadTemplate,
} from "@/hooks/useImportProcessor";

// Status badge styles with glassmorphism effect
const statusStyles: Record<ImportStatus, { bg: string; text: string; icon: React.ElementType }> = {
  PROCESSING: {
    bg: "bg-blue-50/80 border-blue-200/50",
    text: "text-blue-700",
    icon: Loader2,
  },
  SUCCEEDED: {
    bg: "bg-emerald-50/80 border-emerald-200/50",
    text: "text-emerald-700",
    icon: CheckCircle2,
  },
  FAILED: {
    bg: "bg-red-50/80 border-red-200/50",
    text: "text-red-700",
    icon: XCircle,
  },
  SUCCEEDED_WITH_ERRORS: {
    bg: "bg-amber-50/80 border-amber-200/50",
    text: "text-amber-700",
    icon: AlertCircle,
  },
};

const typeIcons: Record<string, React.ElementType> = {
  PRODUCTS_MIXED: Package,
  PRODUCTS_GENUINE: Package,
  PRODUCTS_AFTERMARKET: Package,
  BACKORDERS: Clock,
  BACKORDER_UPDATE: Clock,
  SUPERSESSION: Package,
  SPECIAL_PRICES: FileSpreadsheet,
  FULFILLMENT_STATUS: Truck,
};

interface ImportModernViewProps {
  // Data
  batches: ImportBatch[];
  templates: UploadTemplate[];
  isLoading: boolean;

  // Upload state
  uploadState: UploadState;
  isUploading: boolean;

  // Filters
  statusFilter: ImportStatus | "ALL";
  typeFilter: ImportType | "ALL";
  onStatusFilterChange: (value: ImportStatus | "ALL") => void;
  onTypeFilterChange: (value: ImportType | "ALL") => void;

  // Actions
  onUpload: (
    file: File,
    importType: ImportType,
    options?: { startsAt?: string; endsAt?: string }
  ) => Promise<{ success: boolean; error?: string; batchId?: string }>;
  onResetUpload: () => void;
  onDownloadTemplate: (template: UploadTemplate) => void;
  getTemplate: (importType: ImportType) => UploadTemplate | null;

  // Utilities
  getSuccessRate: (batch: ImportBatch) => number;
  getTypeLabel: (type: ImportType) => string;
}

export function ImportModernView({
  batches,
  templates,
  isLoading,
  uploadState,
  isUploading,
  statusFilter,
  typeFilter,
  onStatusFilterChange,
  onTypeFilterChange,
  onUpload,
  onResetUpload,
  onDownloadTemplate,
  getTemplate,
  getSuccessRate,
  getTypeLabel,
}: ImportModernViewProps) {
  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<ImportType>("PRODUCTS_MIXED");
  const [specialStartDate, setSpecialStartDate] = useState("");
  const [specialEndDate, setSpecialEndDate] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const activeTemplate = getTemplate(uploadType);

  const handleUploadClick = async () => {
    if (!selectedFile) return;

    const options =
      uploadType === "SPECIAL_PRICES"
        ? { startsAt: specialStartDate, endsAt: specialEndDate }
        : undefined;

    const result = await onUpload(selectedFile, uploadType, options);

    if (result.success) {
      setSelectedFile(null);
      setSpecialStartDate("");
      setSpecialEndDate("");
      // Keep panel open to show success state briefly
      setTimeout(() => {
        setIsUploadPanelOpen(false);
        onResetUpload();
      }, 2000);
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

  const handleOpenUploadPanel = () => {
    setIsUploadPanelOpen(true);
    onResetUpload();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Import Management
          </h1>
          <p className="mt-1 text-slate-500">
            Upload and monitor your data imports
          </p>
        </div>
        <Button
          onClick={handleOpenUploadPanel}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
        >
          <Upload className="mr-2 h-4 w-4" />
          New Import
        </Button>
      </div>

      {/* Upload Panel - Glassmorphism Container */}
      {isUploadPanelOpen && (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-xl backdrop-blur-md">
          {/* Decorative gradient */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br from-indigo-400/20 to-violet-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-tr from-indigo-400/10 to-blue-400/10 blur-2xl" />

          <div className="relative space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Upload Import File</h3>
              <button
                onClick={() => setIsUploadPanelOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Import Type Selection */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Import Type</label>
                <Select
                  value={uploadType}
                  onValueChange={(v) => setUploadType(v as ImportType)}
                >
                  <SelectTrigger className="bg-white/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRODUCTS_MIXED">Product Catalog (Net 1-7)</SelectItem>
                    <SelectItem value="SUPERSESSION">Supersessions</SelectItem>
                    <SelectItem value="SPECIAL_PRICES">Special Prices</SelectItem>
                    <SelectItem value="BACKORDER_UPDATE">Backorder Updates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => activeTemplate && onDownloadTemplate(activeTemplate)}
                  disabled={!activeTemplate}
                  className="w-full bg-white/60 hover:bg-white/80"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {activeTemplate ? "Download Template" : "No Template Available"}
                </Button>
              </div>
            </div>

            {/* Date Range for Special Prices */}
            {uploadType === "SPECIAL_PRICES" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Start Date</label>
                  <Input
                    type="date"
                    value={specialStartDate}
                    onChange={(e) => setSpecialStartDate(e.target.value)}
                    className="bg-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">End Date</label>
                  <Input
                    type="date"
                    value={specialEndDate}
                    onChange={(e) => setSpecialEndDate(e.target.value)}
                    className="bg-white/80"
                  />
                </div>
              </div>
            )}

            {/* Drop Zone */}
            <UploadDropZone
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
              onClearFile={() => setSelectedFile(null)}
              disabled={isUploading}
            />

            {/* Stepper Progress */}
            {uploadState.step !== "idle" && (
              <ImportStepper
                currentStep={uploadState.step}
                progress={uploadState.progress}
                error={uploadState.error}
              />
            )}

            {/* Upload Button */}
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setIsUploadPanelOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUploadClick}
                disabled={!selectedFile || isUploading || uploadState.step === "complete"}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : uploadState.step === "complete" ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Done!
                  </>
                ) : (
                  "Start Import"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters - Glassmorphism */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-5 shadow-md backdrop-blur-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Tabs
              value={statusFilter}
              onValueChange={(v) => onStatusFilterChange(v as ImportStatus | "ALL")}
            >
              <TabsList className="bg-slate-100/80">
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="SUCCEEDED">Success</TabsTrigger>
                <TabsTrigger value="FAILED">Failed</TabsTrigger>
                <TabsTrigger value="PROCESSING">Processing</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Type</label>
            <Tabs
              value={typeFilter}
              onValueChange={(v) => onTypeFilterChange(v as ImportType | "ALL")}
            >
              <TabsList className="bg-slate-100/80">
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="PRODUCTS_MIXED">Products</TabsTrigger>
                <TabsTrigger value="SUPERSESSION">Supersession</TabsTrigger>
                <TabsTrigger value="SPECIAL_PRICES">Special</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Import History Table - Glassmorphism */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 shadow-md backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-200/60 bg-slate-50/50">
              <TableHead className="w-10" />
              <TableHead>File</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Rows</TableHead>
              <TableHead className="text-right">Success Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32">
                  <div className="flex items-center justify-center gap-3 text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading imports...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64">
                  <EmptyState onUploadClick={handleOpenUploadPanel} />
                </TableCell>
              </TableRow>
            ) : (
              batches.map((batch, index) => {
                const StatusIcon = statusStyles[batch.status].icon;
                const TypeIcon = typeIcons[batch.importType] || Package;
                const successRate = getSuccessRate(batch);
                const isExpanded = expandedRows.has(batch.id);
                const hasErrors = batch.invalidRows && batch.invalidRows > 0;

                return (
                  <>
                    <TableRow
                      key={batch.id}
                      className={cn(
                        "transition-colors",
                        index % 2 === 0 ? "bg-white/40" : "bg-slate-50/40",
                        "hover:bg-indigo-50/30"
                      )}
                    >
                      <TableCell className="w-10">
                        {hasErrors && (
                          <button
                            onClick={() => toggleRow(batch.id)}
                            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                            <FileSpreadsheet className="h-4 w-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{batch.fileName}</p>
                            <p className="text-xs text-slate-500">{batch.uploadedBy?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-slate-50/80 border-slate-200/50"
                        >
                          <TypeIcon className="mr-1.5 h-3 w-3" />
                          {getTypeLabel(batch.importType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border",
                            statusStyles[batch.status].bg,
                            statusStyles[batch.status].text
                          )}
                        >
                          <StatusIcon
                            className={cn(
                              "mr-1.5 h-3 w-3",
                              batch.status === "PROCESSING" && "animate-spin"
                            )}
                          />
                          {batch.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(batch.startedAt).toLocaleDateString()}
                        <span className="ml-1.5 text-slate-400">
                          {new Date(batch.startedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-mono text-sm">
                          <span className="text-emerald-600">{batch.validRows ?? 0}</span>
                          <span className="text-slate-400"> / </span>
                          <span className="text-slate-600">{batch.totalRows ?? 0}</span>
                        </div>
                        {batch.invalidRows ? (
                          <div className="text-xs text-red-500">
                            {batch.invalidRows} errors
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                successRate >= 95
                                  ? "bg-emerald-500"
                                  : successRate >= 80
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                              )}
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                          <span className="w-10 text-right font-mono text-sm font-medium">
                            {successRate}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-slate-50/60">
                        <TableCell colSpan={7} className="p-4">
                          <div className="rounded-xl border border-slate-200/60 bg-white/80 p-4">
                            <h4 className="mb-3 font-semibold text-slate-900">Import Errors</h4>
                            <p className="text-sm text-slate-500">
                              Error details would be displayed here for batch {batch.id}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100">
          <Upload className="h-10 w-10 text-indigo-500" />
        </div>
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
          <FileSpreadsheet className="h-4 w-4" />
        </div>
      </div>

      <h3 className="mb-2 text-lg font-semibold text-slate-900">No imports yet</h3>
      <p className="mb-6 max-w-sm text-center text-sm text-slate-500">
        Start by uploading your first data file. We support product catalogs, supersessions, special
        prices, and more.
      </p>

      <Button
        onClick={onUploadClick}
        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/25"
      >
        <Upload className="mr-2 h-4 w-4" />
        Upload Your First File
      </Button>
    </div>
  );
}

export default ImportModernView;
