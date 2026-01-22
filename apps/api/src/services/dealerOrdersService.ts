import {
  DealerBackordersResponseSchema,
  DealerOrdersResponseSchema,
} from "@repo/lib";
import {
  countDealerBackorders,
  countDealerOrders,
  fetchDealerBackorders,
  fetchDealerBackordersExport,
  fetchDealerOrders,
  fetchDealerOrdersExport,
  fetchOrderLines,
  type DealerOrderLineRow,
} from "../repositories/dealerOrdersRepo";
import { fetchDealerAccountById } from "../repositories/dealerAccountRepo";

const toNumber = (value: string | null | undefined) => {
  if (!value) {
    return 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function getDealerOrders(accountId: string, page: number, limit: number) {
  const offset = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    fetchDealerOrders(accountId, limit, offset),
    countDealerOrders(accountId),
  ]);

  const orderIds = orders.map((order) => order.id);
  const lineRows = await fetchOrderLines(orderIds);

  const linesByOrder = new Map<string, DealerOrderLineRow[]>();
  lineRows.forEach((line) => {
    const list = linesByOrder.get(line.orderId) ?? [];
    list.push(line);
    linesByOrder.set(line.orderId, list);
  });

  const payload = {
    orders: orders.map((order) => ({
      id: order.id,
      orderNo: order.orderNo,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      total: toNumber(order.total),
      dispatchMethod: order.dispatchMethod,
      poRef: order.poRef,
      notes: order.notes,
      lines: (linesByOrder.get(order.id) ?? []).map((line) => ({
        id: line.id,
        productCodeSnapshot: line.productCodeSnapshot,
        descriptionSnapshot: line.descriptionSnapshot,
        qty: line.qty,
        unitPriceSnapshot: toNumber(line.unitPriceSnapshot),
      })),
    })),
    pagination: {
      page,
      limit,
      total,
    },
  };

  return DealerOrdersResponseSchema.parse(payload);
}

export async function getDealerBackorders(accountId: string, page: number, limit: number) {
  const account = await fetchDealerAccountById(accountId);
  if (!account) {
    return DealerBackordersResponseSchema.parse({
      backorders: [],
      pagination: { page, limit, total: 0 },
    });
  }

  const accountNo = account.accountNo;
  const offset = (page - 1) * limit;
  const [backorders, total] = await Promise.all([
    fetchDealerBackorders(accountNo, limit, offset),
    countDealerBackorders(accountNo),
  ]);

  const payload = {
    backorders: backorders.map((row) => ({
      id: row.id,
      accountNo: row.accountNo,
      customerName: row.customerName,
      ourNo: row.ourNo,
      itemNo: row.itemNo,
      part: row.part,
      description: row.description,
      qtyOrdered: row.qtyOrdered,
      qtyOutstanding: row.qtyOutstanding,
      inWh: row.inWh,
      portalOrderNo: row.portalOrderNo,
    })),
    pagination: {
      page,
      limit,
      total,
    },
  };

  return DealerBackordersResponseSchema.parse(payload);
}

export async function getDealerOrdersExport(accountId: string) {
  return fetchDealerOrdersExport(accountId);
}

export async function getDealerBackordersExport(accountId: string) {
  const account = await fetchDealerAccountById(accountId);
  if (!account) {
    return [];
  }

  return fetchDealerBackordersExport(account.accountNo);
}
