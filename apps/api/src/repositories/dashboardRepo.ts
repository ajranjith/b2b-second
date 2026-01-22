import { readClient } from "../db";

export type AdminDealerStats = {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
};

export type AdminOrderStats = {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalRevenue: number;
};

export type AdminProductStats = {
  total: number;
  genuine: number;
  aftermarket: number;
  branded: number;
  lowStock: number;
};

export type AdminImportStats = {
  todayCount: number;
  lastSuccessful: Date | null;
  failedToday: number;
  activeImports: number;
};

export type AdminRecentOrder = {
  id: string;
  orderNo: string;
  status: string;
  total: number;
  createdAt: Date;
  dealerAccount: {
    companyName: string | null;
    accountNo: string | null;
  } | null;
};

export type DealerAccountSummary = {
  id: string;
  accountNo: string;
  companyName: string | null;
  status: string | null;
  defaultShippingMethod: string | null;
};

export type DealerRecentOrder = {
  id: string;
  orderNo: string;
  status: string;
  total: number;
  createdAt: Date;
};

export type DealerNewsRow = {
  id: string;
  type: string;
  title: string;
  bodyMd: string | null;
  endsAt: Date | null;
};

export type DealerNewsAttachmentRow = {
  id: string;
  articleId: string;
  fileName: string;
  mimeType: string | null;
};

export type DealerTierAssignment = {
  categoryCode: string;
  netTier: string;
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function fetchAdminDealerStats(): Promise<AdminDealerStats> {
  const stats: AdminDealerStats = {
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
  };

  const result = await readClient.query<{ status: string; count: string }>(
    `
      SELECT status, COUNT(*)::int AS count
      FROM "DealerAccount"
      GROUP BY status;
    `,
  );

  result.rows.forEach((row) => {
    const count = toNumber(row.count);
    stats.total += count;
    if (row.status === "ACTIVE") stats.active = count;
    if (row.status === "INACTIVE") stats.inactive = count;
    if (row.status === "SUSPENDED") stats.suspended = count;
  });

  return stats;
}

export async function fetchAdminOrderStats(
  startOfToday: Date,
  startOfWeek: Date,
  startOfMonth: Date,
): Promise<AdminOrderStats> {
  const result = await readClient.query<{
    today: string;
    thisWeek: string;
    thisMonth: string;
    totalRevenue: string;
  }>(
    `
      SELECT
        COUNT(*) FILTER (WHERE "createdAt" >= $1)::int AS "today",
        COUNT(*) FILTER (WHERE "createdAt" >= $2)::int AS "thisWeek",
        COUNT(*) FILTER (WHERE "createdAt" >= $3)::int AS "thisMonth",
        COALESCE(SUM("total"), 0) AS "totalRevenue"
      FROM "OrderHeader";
    `,
    [startOfToday, startOfWeek, startOfMonth],
  );

  const row = result.rows[0];
  return {
    today: toNumber(row?.today),
    thisWeek: toNumber(row?.thisWeek),
    thisMonth: toNumber(row?.thisMonth),
    totalRevenue: toNumber(row?.totalRevenue),
  };
}

export async function fetchAdminProductStats(): Promise<AdminProductStats> {
  const stats: AdminProductStats = {
    total: 0,
    genuine: 0,
    aftermarket: 0,
    branded: 0,
    lowStock: 0,
  };

  const [productsResult, lowStockResult] = await Promise.all([
    readClient.query<{ partType: string; count: string }>(
      `
        SELECT "partType", COUNT(*)::int AS count
        FROM "Product"
        GROUP BY "partType";
      `,
    ),
    readClient.query<{ count: string }>(
      `
        SELECT COUNT(*)::int AS count
        FROM "ProductStock"
        WHERE "freeStock" < 10;
      `,
    ),
  ]);

  productsResult.rows.forEach((row) => {
    const count = toNumber(row.count);
    stats.total += count;
    if (row.partType === "GENUINE") stats.genuine = count;
    if (row.partType === "AFTERMARKET") stats.aftermarket = count;
    if (row.partType === "BRANDED") stats.branded = count;
  });

  stats.lowStock = toNumber(lowStockResult.rows[0]?.count);
  return stats;
}

export async function fetchAdminImportStats(startOfToday: Date): Promise<AdminImportStats> {
  const [todayImports, lastSuccess, failedToday, activeImports] = await Promise.all([
    readClient.query<{ count: string }>(
      `
        SELECT COUNT(*)::int AS count
        FROM "ImportBatch"
        WHERE "startedAt" >= $1;
      `,
      [startOfToday],
    ),
    readClient.query<{ completedAt: Date }>(
      `
        SELECT "completedAt"
        FROM "ImportBatch"
        WHERE "status" IN ('SUCCEEDED', 'SUCCEEDED_WITH_ERRORS')
        ORDER BY "completedAt" DESC
        LIMIT 1;
      `,
    ),
    readClient.query<{ count: string }>(
      `
        SELECT COUNT(*)::int AS count
        FROM "ImportBatch"
        WHERE "startedAt" >= $1
          AND "status" = 'FAILED';
      `,
      [startOfToday],
    ),
    readClient.query<{ count: string }>(
      `
        SELECT COUNT(*)::int AS count
        FROM "ImportBatch"
        WHERE "status" = 'PROCESSING';
      `,
    ),
  ]);

  return {
    todayCount: toNumber(todayImports.rows[0]?.count),
    lastSuccessful: lastSuccess.rows[0]?.completedAt ?? null,
    failedToday: toNumber(failedToday.rows[0]?.count),
    activeImports: toNumber(activeImports.rows[0]?.count),
  };
}

export async function fetchAdminRecentOrders(limit = 10): Promise<AdminRecentOrder[]> {
  const result = await readClient.query<{
    id: string;
    orderNo: string;
    status: string;
    total: string;
    createdAt: Date;
    companyName: string | null;
    accountNo: string | null;
  }>(
    `
      SELECT
        o.id,
        o."orderNo",
        o.status,
        o.total,
        o."createdAt",
        d."companyName",
        d."accountNo"
      FROM "OrderHeader" o
      LEFT JOIN "DealerAccount" d ON d.id = o."dealerAccountId"
      ORDER BY o."createdAt" DESC
      LIMIT $1;
    `,
    [limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    orderNo: row.orderNo,
    status: row.status,
    total: toNumber(row.total),
    createdAt: new Date(row.createdAt),
    dealerAccount:
      row.companyName || row.accountNo
        ? {
            companyName: row.companyName,
            accountNo: row.accountNo,
          }
        : null,
  }));
}

export async function fetchDealerAccount(accountNo: string): Promise<DealerAccountSummary | null> {
  const result = await readClient.query<DealerAccountSummary>(
    `
      SELECT
        id,
        "accountNo",
        "companyName",
        status,
        "defaultShippingMethod"
      FROM "DealerAccount"
      WHERE "accountNo" = $1
      LIMIT 1;
    `,
    [accountNo],
  );

  return result.rows[0] ?? null;
}

export async function fetchDealerTierAssignments(
  accountNo: string,
): Promise<DealerTierAssignment[]> {
  const result = await readClient.query<DealerTierAssignment>(
    `
      SELECT "categoryCode", "netTier"
      FROM "DealerPriceTierAssignment"
      WHERE "accountNo" = $1;
    `,
    [accountNo],
  );

  return result.rows;
}

export async function fetchDealerBackorderCount(accountNo: string): Promise<number> {
  const result = await readClient.query<{ count: string }>(
    `
      SELECT COUNT(*)::int AS count
      FROM "BackorderLine"
      WHERE "accountNo" = $1;
    `,
    [accountNo],
  );

  return toNumber(result.rows[0]?.count);
}

export async function fetchDealerOrdersInProgressCount(accountId: string): Promise<number> {
  const result = await readClient.query<{ count: string }>(
    `
      SELECT COUNT(*)::int AS count
      FROM "OrderHeader"
      WHERE "dealerAccountId" = $1
        AND status IN ('PROCESSING', 'READY', 'SUSPENDED');
    `,
    [accountId],
  );

  return toNumber(result.rows[0]?.count);
}

export async function fetchDealerRecentOrders(
  accountId: string,
  limit = 10,
): Promise<DealerRecentOrder[]> {
  const result = await readClient.query<{
    id: string;
    orderNo: string;
    status: string;
    total: string;
    createdAt: Date;
  }>(
    `
      SELECT id, "orderNo", status, total, "createdAt"
      FROM "OrderHeader"
      WHERE "dealerAccountId" = $1
      ORDER BY "createdAt" DESC
      LIMIT $2;
    `,
    [accountId, limit],
  );

  return result.rows.map((row) => ({
    id: row.id,
    orderNo: row.orderNo,
    status: row.status,
    total: toNumber(row.total),
    createdAt: new Date(row.createdAt),
  }));
}

export async function fetchDealerNews(limit = 5): Promise<{
  news: DealerNewsRow[];
  attachments: DealerNewsAttachmentRow[];
}> {
  const newsResult = await readClient.query<DealerNewsRow>(
    `
      SELECT
        id,
        type,
        title,
        "bodyMd",
        "endsAt"
      FROM "NewsArticle"
      WHERE "isPublished" = true
        AND "isArchived" = false
        AND ("startsAt" IS NULL OR "startsAt" <= NOW())
        AND ("endsAt" IS NULL OR "endsAt" >= NOW())
      ORDER BY "publishedAt" DESC NULLS LAST, "createdAt" DESC
      LIMIT $1;
    `,
    [limit],
  );

  const articleIds = newsResult.rows.map((row) => row.id);
  if (articleIds.length === 0) {
    return { news: [], attachments: [] };
  }

  const attachmentsResult = await readClient.query<DealerNewsAttachmentRow>(
    `
      SELECT id, "articleId", "fileName", "mimeType"
      FROM "NewsAttachment"
      WHERE "articleId" = ANY($1::text[]);
    `,
    [articleIds],
  );

  return {
    news: newsResult.rows.map((row) => ({
      ...row,
      endsAt: row.endsAt ? new Date(row.endsAt) : null,
    })),
    attachments: attachmentsResult.rows,
  };
}
