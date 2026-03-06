"use client";

import { useState } from "react";
import { ImportModernView } from "@/components/admin/imports";
import { useImportProcessor, type ImportStatus, type ImportType } from "@/hooks/useImportProcessor";
import { useLoadingCursor } from "@/hooks/useLoadingCursor";

export default function ImportsPage() {
  const [statusFilter, setStatusFilter] = useState<ImportStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<ImportType | "ALL">("ALL");

  const {
    batches,
    templates,
    isLoading,
    uploadState,
    isUploading,
    uploadFile,
    resetUpload,
    downloadTemplate,
    getTemplate,
    getSuccessRate,
    getTypeLabel,
  } = useImportProcessor({
    statusFilter,
    typeFilter,
    refetchInterval: 5000,
  });

  useLoadingCursor(isLoading);

  return (
    <ImportModernView
      batches={batches}
      templates={templates}
      isLoading={isLoading}
      uploadState={uploadState}
      isUploading={isUploading}
      statusFilter={statusFilter}
      typeFilter={typeFilter}
      onStatusFilterChange={setStatusFilter}
      onTypeFilterChange={setTypeFilter}
      onUpload={uploadFile}
      onResetUpload={resetUpload}
      onDownloadTemplate={downloadTemplate}
      getTemplate={getTemplate}
      getSuccessRate={getSuccessRate}
      getTypeLabel={getTypeLabel}
    />
  );
}
