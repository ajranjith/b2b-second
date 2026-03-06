import React from "react";
import { flexRender } from "@tanstack/react-table";
import { UploadCloud, Download, CheckCircle2, Circle, XCircle } from "lucide-react";

import {
  Button,
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
} from "@repo/ui";
import { DensityToggle } from "@/components/portal/DensityToggle";
import { type UseImportProcessorReturn } from "@/hooks/useImportProcessor";

const stageMeta = {
  uploading: { label: "Uploading", icon: Circle },
  validating: { label: "Validating", icon: Circle },
  finalizing: { label: "Finalizing", icon: Circle },
  done: { label: "Completed", icon: CheckCircle2 },
} as const;

export function ImportModernView({
  activeTemplate,
  columns,
  density,
  expandedRows,
  handleTemplateDownload,
  handleUpload,
  isLoading,
  isUploadModalOpen,
  isUploading,
  setDensity,
  setIsUploadModalOpen,
  setStatusFilter,
  setTypeFilter,
  setUploadFile,
  setUploadType,
  setSpecialEndDate,
  setSpecialStartDate,
  statusFilter,
  table,
  toggleRow,
  typeFilter,
  uploadFile,
  uploadStage,
  uploadType,
  specialEndDate,
  specialStartDate,
}: UseImportProcessorReturn) {
  const stageOrder = ["uploading", "validating", "finalizing"] as const;
  const activeStageIndex = Math.max(0, stageOrder.indexOf(uploadStage as any));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Import Management</h2>
          <p className="text-slate-500">Monitor and manage data import processes</p>
        </div>
        <div className="flex items-center gap-3">
          <DensityToggle value={density} onChange={setDensity} />
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <UploadCloud className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <Card className="w-full max-w-3xl bg-white/70 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Start an Import</h3>
                  <p className="text-sm text-slate-500">
                    Upload spreadsheets and track progress in real time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="text-slate-500 hover:text-slate-900"
                  aria-label="Close import dialog"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Import Type</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={uploadType}
                      onChange={(event) => setUploadType(event.target.value as any)}
                    >
                      <option value="PRODUCTS_MIXED">Product Catalog (Net 1-7)</option>
                      <option value="SUPERSESSION">Supersessions</option>
                      <option value="SPECIAL_PRICES">Special Prices</option>
                      <option value="BACKORDER_UPDATE">Backorder Updates</option>
                    </select>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
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
                        Template
                      </Button>
                    </div>
                  </div>

                  <div
                    className="group relative flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/80 px-6 py-10 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      const file = event.dataTransfer.files?.[0] || null;
                      setUploadFile(file);
                    }}
                  >
                    <UploadCloud className="h-10 w-10 text-indigo-400 group-hover:animate-pulse" />
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Drag and drop your XLSX file
                    </p>
                    <p className="text-xs text-slate-500">or click to browse files</p>
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    {uploadFile && (
                      <div className="mt-3 text-xs text-slate-600">Selected: {uploadFile.name}</div>
                    )}
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
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/80 p-5">
                  <h4 className="text-sm font-semibold text-slate-700">Import Progress</h4>
                  <div className="mt-4 space-y-4">
                    {stageOrder.map((stage, index) => {
                      const isActive = uploadStage !== "idle" && index <= activeStageIndex;
                      const Icon = isActive ? CheckCircle2 : Circle;
                      return (
                        <div key={stage} className="flex items-center gap-3 text-sm text-slate-600">
                          <Icon
                            className={`h-5 w-5 ${isActive ? "text-green-500" : "text-slate-300"}`}
                          />
                          <span className={isActive ? "text-slate-900 font-medium" : ""}>
                            {stageMeta[stage].label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 text-xs text-slate-500">
                    {isUploading
                      ? "We are processing your file. You can close this window and monitor status below."
                      : "Ready to import. Uploading will start immediately after confirmation."}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
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

      <Card className="bg-white/70 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl">
        <CardContent className="pt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Status Filter</label>
              <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
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
              <Tabs value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
                <TabsList>
                  <TabsTrigger value="ALL">All</TabsTrigger>
                  <TabsTrigger value="PRODUCTS_MIXED">Products</TabsTrigger>
                  <TabsTrigger value="SUPERSESSION">Supersessions</TabsTrigger>
                  <TabsTrigger value="SPECIAL_PRICES">Special Prices</TabsTrigger>
                  <TabsTrigger value="BACKORDER_UPDATE">Backorder Updates</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
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
                    <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                      Loading imports...
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                        <UploadCloud className="h-10 w-10 text-indigo-300" />
                        <div className="text-sm font-medium">Start your first import</div>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-500">
                          Use “Upload File” above
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row, rowIndex) => (
                    <React.Fragment key={row.id}>
                      <TableRow className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
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
                    </React.Fragment>
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
