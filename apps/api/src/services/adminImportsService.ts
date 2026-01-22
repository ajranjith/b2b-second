import crypto from "crypto";

import {
  AdminImportStatusResponseSchema,
  AdminImportsResponseSchema,
  AdminImportTemplateResponseSchema,
  type AdminImportStatusResponseDTO,
  type AdminImportsResponseDTO,
  type AdminImportTemplateResponseDTO,
} from "@repo/lib";

import {
  fetchImportBatchById,
  fetchImportBatches,
  insertImportBatch,
  listImportTemplates,
  type ImportBatchRecord,
} from "../repositories/importRepo";

const toIsoString = (value: Date | null) => (value ? value.toISOString() : null);

const mapBatch = (batch: ImportBatchRecord) =>
  AdminImportStatusResponseSchema.shape.batch.parse({
    id: batch.id,
    fileName: batch.fileName ?? "batch-import",
    importType: batch.importType,
    status: batch.status,
    startedAt: toIsoString(batch.startedAt),
    completedAt: toIsoString(batch.completedAt),
    totalRows: batch.totalRows,
    validRows: batch.validRows,
    invalidRows: batch.invalidRows,
    uploadedBy: batch.uploadedByEmail ? { email: batch.uploadedByEmail } : null,
  });

export async function listImports(): Promise<AdminImportsResponseDTO> {
  const rows = await fetchImportBatches();
  const batches = rows.map(mapBatch);
  return AdminImportsResponseSchema.parse({ batches });
}

export async function runImport(importType: string, uploadedById: string | null) {
  const batch = await insertImportBatch({
    id: crypto.randomUUID(),
    importType,
    fileName: `${importType.toLowerCase()}-${Date.now()}.csv`,
    uploadedById,
    fileHash: crypto.randomBytes(8).toString("hex"),
  });

  return {
    batchId: batch.id,
    status: batch.status,
    importType: batch.importType,
    startedAt: batch.startedAt.toISOString(),
  };
}

export async function getImportStatus(id: string): Promise<AdminImportStatusResponseDTO | null> {
  const batch = await fetchImportBatchById(id);
  if (!batch) return null;
  return { batch: mapBatch(batch) };
}

export function getImportTemplate(importType: string): AdminImportTemplateResponseDTO | null {
  const template = listImportTemplates(importType);
  if (!template) return null;

  return AdminImportTemplateResponseSchema.parse({
    template: {
      id: template.id,
      templateName: template.templateName,
      importType: template.importType,
      downloadUrl: template.downloadUrl,
    },
  });
}
