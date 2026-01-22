import { readClient } from "../db";

export type DealerOrderRow = {
  id: string;
  orderNo: string;
  status: string;
  total: string;
  createdAt: Date;
  dispatchMethod: string | null;
  poRef: string | null;
  notes: string | null;
};

export type DealerOrderLineRow = {
  orderId: string;
  id: string;
  productCodeSnapshot: string;
  descriptionSnapshot: string;
  qty: number;
  unitPriceSnapshot: string;
};

export type DealerBackorderRow = {
  id: string;
  accountNo: string;
  customerName: string | null;
  ourNo: string;
  itemNo: string | null;
  part: string;
  description: string | null;
  qtyOrdered: number;
  qtyOutstanding: number;
  inWh: number;
  portalOrderNo: string | null;
};

export async function fetchDealerOrders(accountId: string, limit: number, offset: number) {
  const rows = await readClient.query<DealerOrderRow>(
    `
      SELECT
        id,
        "orderNo",
        status,
        total,
        "createdAt",
        "dispatchMethod",
        "poRef",
        notes
      FROM "OrderHeader"
      WHERE "dealerAccountId" = $1
      ORDER BY "createdAt" DESC
      LIMIT $2 OFFSET $3;
    `,
    [accountId, limit, offset],
  );
  return rows.rows;
}

export async function countDealerOrders(accountId: string) {
  const result = await readClient.query<{ count: string }>(
    `
      SELECT COUNT(*)::int AS count
      FROM "OrderHeader"
      WHERE "dealerAccountId" = $1;
    `,
    [accountId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function fetchOrderLines(orderIds: string[]) {
  if (orderIds.length === 0) {
    return [];
  }

  const result = await readClient.query<DealerOrderLineRow>(
    `
      SELECT
        "orderId",
        id,
        "productCodeSnapshot",
        "descriptionSnapshot",
        qty,
        "unitPriceSnapshot"
      FROM "OrderLine"
      WHERE "orderId" = ANY($1::text[]);
    `,
    [orderIds],
  );

  return result.rows;
}

export async function fetchDealerBackorders(accountNo: string, limit: number, offset: number) {
  const rows = await readClient.query<DealerBackorderRow>(
    `
      SELECT
        id,
        "accountNo",
        "customerName",
        "ourNo",
        "itemNo",
        part,
        description,
        "qtyOrdered",
        "qtyOutstanding",
        "inWh",
        "portalOrderNo"
      FROM "BackorderLine"
      WHERE "accountNo" = $1
      ORDER BY "id" DESC
      LIMIT $2 OFFSET $3;
    `,
    [accountNo, limit, offset],
  );
  return rows.rows;
}

export async function countDealerBackorders(accountNo: string) {
  const result = await readClient.query<{ count: string }>(
    `
      SELECT COUNT(*)::int AS count
      FROM "BackorderLine"
      WHERE "accountNo" = $1;
    `,
    [accountNo],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function fetchDealerOrdersExport(accountId: string) {
  const result = await readClient.query(
    `
      SELECT
        "orderNo",
        "createdAt",
        status,
        total,
        "dispatchMethod",
        "poRef",
        notes
      FROM "OrderHeader"
      WHERE "dealerAccountId" = $1
      ORDER BY "createdAt" DESC;
    `,
    [accountId],
  );
  return result.rows;
}

export async function fetchDealerBackordersExport(accountNo: string) {
  const result = await readClient.query(
    `
      SELECT
        "accountNo",
        "portalOrderNumber",
        "erpOrderNumber",
        "productCode",
        "description",
        "qtyOrdered",
        "qtyOutstanding",
        "inWarehouse"
      FROM "BackorderLineContract"
      WHERE "accountNo" = $1
      ORDER BY "updatedAt" DESC NULLS LAST;
    `,
    [accountNo],
  );
  return result.rows;
}
