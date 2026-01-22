"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import {
  Button,
  Badge,
  Card,
  CardContent,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui";
import { Upload, Package, Clock, Truck, ChevronDown, ChevronUp, Download } from "lucide-react";
import api from "@/lib/api";
import { DensityToggle } from "@/components/portal/DensityToggle";
import { useLoadingCursor } from "@/hooks/useLoadingCursor";

type ImportStatus = "PROCESSING" | "SUCCEEDED" | "FAILED" | "SUCCEEDED_WITH_ERRORS";
type ImportType =
  | "PRODUCTS_MIXED"
  | "PRODUCTS_GENUINE"
  | "PRODUCTS_AFTERMARKET"
  | "BACKORDERS"
  | "BACKORDER_UPDATE"
  | "SUPERSESSION"
  | "SPECIAL_PRICES"
  | "FULFILLMENT_STATUS";

interface ImportBatch {
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

interface UploadTemplate {
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

export default function ImportsPage() {
  const [statusFilter, setStatusFilter] = useState<ImportStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<ImportType | "ALL">("ALL");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });
  const [density, setDensity] = useState<"comfortable" | "dense">("comfortable");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<ImportType>("PRODUCTS_MIXED");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [specialStartDate, setSpecialStartDate] = useState("");
  const [specialEndDate, setSpecialEndDate] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["imports", statusFilter, typeFilter],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (typeFilter !== "ALL") params.type = typeFilter;

      const response = await api.get("/admin/imports", { params });
      return response.data.batches as ImportBatch[];
    },
    refetchInterval: 5000,
  });

  const { data: templates } = useQuery({
    queryKey: ["import-templates"],
    queryFn: async () => {
      const response = await api.get("/admin/templates");
      return response.data as UploadTemplate[];
    },
  });

  useLoadingCursor(isLoading);

  const activeTemplate = templates?.find((template) => template.importType === uploadType) || null;

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
    try {
      if (!uploadFile) {
        alert("Please select a file to upload.");
        return;
      }
      if (uploadType === "SPECIAL_PRICES" && (!specialStartDate || !specialEndDate)) {
        alert("Start Date and End Date are required for special price imports.");
        return;
      }

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("importType", uploadType);
      if (uploadType === "SPECIAL_PRICES") {
        formData.append("startsAt", specialStartDate);
        formData.append("endsAt", specialEndDate);
      }

      await api.post("/admin/imports/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setSpecialStartDate("");
      setSpecialEndDate("");
      alert("Import started successfully!");
    } catch (e: any) {
      alert("Upload failed: " + e.message);
    } finally {
      setIsUploading(false);
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

  const getTypeLabel = (type: ImportType) => {
    if (type.startsWith("PRODUCTS")) return "PRODUCTS";
    return type;
  };

  const columns: ColumnDef<ImportBatch>[] = [
    {
      id: "expand",
      cell: ({ row }) => {
        const isExpanded = expandedRows.has(row.original.id);
        return row.original.invalidRows && row.original.invalidRows > 0 ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleRow(row.original.id)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
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
          <Badge variant="outline" className="bg-slate-100 text-slate-700">
            <Icon className="h-3 w-3 mr-1" />
            {typeLabel}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={`${statusColors[row.original.status]} ${
            row.original.status === "PROCESSING" ? "animate-pulse" : ""
          }`}
        >
          {row.original.status.replace(/_/g, " ")}
        </Badge>
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
            <div className="w-20 bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${rate >= 95 ? "bg-green-500" : rate >= 80 ? "bg-amber-500" : "bg-red-500"}`}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Import Management</h2>
          <p className="text-slate-500">Monitor and manage data import processes</p>
        </div>
        <div className="flex items-center gap-3">
          <DensityToggle value={density} onChange={setDensity} />
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-[400px] shadow-2xl">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-xl font-bold">Import Data</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium">Import Type</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as any)}
                >
                  <option value="PRODUCTS_MIXED">Product Catalog (Net 1-7)</option>
                  <option value="SUPERSESSION">Supersessions</option>
                  <option value="SPECIAL_PRICES">Special Prices</option>
                  <option value="BACKORDER_UPDATE">Backorder Updates</option>
                </select>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {activeTemplate
                      ? activeTemplate.templateName
                      : "No template available for this import."}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTemplateDownload}
                    disabled={!activeTemplate}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Template
                  </Button>
                </div>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center bg-slate-50 space-y-3">
                <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">Click to select or drag and drop XLSX file</p>
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-600 hover:file:bg-blue-100"
                />
              </div>
              {uploadType === "SPECIAL_PRICES" && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="date"
                      value={specialStartDate}
                      onChange={(event) => setSpecialStartDate(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="date"
                      value={specialEndDate}
                      onChange={(event) => setSpecialEndDate(event.target.value)}
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleUpload}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Start Import"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="shadow-sm border-slate-200">
        <CardContent className="pt-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Status Filter</label>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="SUCCEEDED">Success</TabsTrigger>
                <TabsTrigger value="FAILED">Failed</TabsTrigger>
                <TabsTrigger value="PROCESSING">Processing</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Type Filter</label>
            <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="PRODUCTS_MIXED">Products</TabsTrigger>
                <TabsTrigger value="SUPERSESSION">Supersessions</TabsTrigger>
                <TabsTrigger value="SPECIAL_PRICES">Special Prices</TabsTrigger>
                <TabsTrigger value="BACKORDER_UPDATE">Backorder Updates</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className={density === "dense" ? "py-2" : "py-4"}>
                        {!header.isPlaceholder &&
                          flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Loading imports...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Upload className="h-10 w-10 text-slate-300" />
                        <span className="font-medium text-slate-700">
                          {statusFilter !== "ALL" || typeFilter !== "ALL"
                            ? "No imports match your filters"
                            : "No imports yet"}
                        </span>
                        <span className="text-sm text-slate-500">
                          {statusFilter !== "ALL" || typeFilter !== "ALL"
                            ? "Try adjusting your filter criteria."
                            : "Click \"Upload File\" to start your first data import."}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <>
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={density === "dense" ? "py-2" : "py-4"}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                      {expandedRows.has(row.original.id) && (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="bg-slate-50 p-6">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-sm">Import Errors</h4>
                              <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <p className="text-sm text-slate-500">
                                  Error details would be displayed here.
                                </p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
