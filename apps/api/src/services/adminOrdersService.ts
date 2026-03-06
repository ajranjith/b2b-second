import { AdminOrdersSchema, type AdminOrdersDTO } from "@repo/lib";

import { fetchAdminOrders, type AdminOrdersQuery } from "../repositories/adminOrdersRepo";

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function getAdminOrders(query: AdminOrdersQuery): Promise<AdminOrdersDTO> {
  const { rows, total } = await fetchAdminOrders(query);

  const payload = {
    orders: rows.map((row) => ({
      id: row.id,
      orderNo: row.orderNo,
      poRef: row.poRef ?? null,
      status: row.status,
      total: toNumber(row.total),
      createdAt: row.createdAt.toISOString(),
      lineCount: toNumber(row.lineCount),
      dealerAccount:
        row.companyName || row.accountNo
          ? {
              companyName: row.companyName,
              accountNo: row.accountNo,
            }
          : null,
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
    },
  };

  return AdminOrdersSchema.parse(payload);
}
