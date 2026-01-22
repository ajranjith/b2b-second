import { readClient, writeClient } from "../db";

export type ImportBatchRecord = {
  id: string;
  importType: string;
  fileName: string | null;
  fileHash: string;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  uploadedByEmail: string | null;
};

const templates = [
  {
    id: "products-pricing",
    templateName: "Product Pricing Import",
    importType: "PRODUCTS_MIXED",
    downloadUrl: "/templates/product-pricing.csv",
  },
  {
    id: "dealers",
    templateName: "Dealer Imports",
    importType: "DEALERS",
    downloadUrl: "/templates/dealers.csv",
  },
  {
    id: "backorder-update",
    templateName: "Backorder Updates",
    importType: "BACKORDER_UPDATE",
    downloadUrl: "/templates/backorder-update.csv",
  },
];

export function listImportTemplates(importType: string) {
  return templates.find((item) => item.importType === importType) ?? null;
}

export async function fetchImportBatches() {
  const result = await readClient.query<ImportBatchRecord>(
    `
      SELECT
        ib.id,
        ib."importType",
        ib."fileName",
        ib."fileHash",
        ib.status,
        ib."startedAt",
        ib."completedAt",
        ib."totalRows",
        ib."validRows",
        ib."invalidRows",
        u.email AS "uploadedByEmail"
      FROM "ImportBatch" ib
      LEFT JOIN "AppUser" u ON u.id = ib."uploadedById"
      ORDER BY ib."startedAt" DESC;
    `,
  );
  return result.rows;
}

export async function fetchImportBatchById(id: string) {
  const result = await readClient.query<ImportBatchRecord>(
    `
      SELECT
        ib.id,
        ib."importType",
        ib."fileName",
        ib."fileHash",
        ib.status,
        ib."startedAt",
        ib."completedAt",
        ib."totalRows",
        ib."validRows",
        ib."invalidRows",
        u.email AS "uploadedByEmail"
      FROM "ImportBatch" ib
      LEFT JOIN "AppUser" u ON u.id = ib."uploadedById"
      WHERE ib.id = $1
      LIMIT 1;
    `,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function insertImportBatch(payload: {
  id: string;
  importType: string;
  fileName: string | null;
  fileHash: string;
  uploadedById: string | null;
}) {
  const result = await writeClient.query<ImportBatchRecord>(
    `
      INSERT INTO "ImportBatch" (
        id,
        "importType",
        "fileName",
        "fileHash",
        status,
        "startedAt",
        "totalRows",
        "validRows",
        "invalidRows",
        "uploadedById"
      ) VALUES (
        $1,$2,$3,$4,'PROCESSING',NOW(),0,0,0,$5
      ) RETURNING
        id,
        "importType",
        "fileName",
        "fileHash",
        status,
        "startedAt",
        "completedAt",
        "totalRows",
        "validRows",
        "invalidRows",
        (SELECT email FROM "AppUser" WHERE id = $5) AS "uploadedByEmail";
    `,
    [payload.id, payload.importType, payload.fileName, payload.fileHash, payload.uploadedById],
  );
  return result.rows[0];
}
