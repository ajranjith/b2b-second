import { readClient } from "../db";

export type AdminOrderRow = {
  id: string;
  orderNo: string;
  poRef: string | null;
  status: string;
  total: string | number;
  createdAt: Date;
  companyName: string | null;
  accountNo: string | null;
  lineCount: string | number;
};

export type AdminOrdersQuery = {
  page: number;
  limit: number;
  query?: string;
  status?: string;
};

export async function fetchAdminOrders({ page, limit, query, status }: AdminOrdersQuery) {
  const clauses: string[] = [];
  const values: Array<string | number> = [];
  let index = 1;

  if (query) {
    const like = `%${query}%`;
    values.push(like);
    clauses.push(
      `(o."orderNo" ILIKE $${index} OR o."poRef" ILIKE $${index} OR d."companyName" ILIKE $${index} OR d."accountNo" ILIKE $${index})`,
    );
    index += 1;
  }

  if (status) {
    values.push(status);
    clauses.push(`o.status = $${index}`);
    index += 1;
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const offset = (page - 1) * limit;

  const countResult = await readClient.query<{ count: string }>(
    `
      SELECT COUNT(*)::int AS count
      FROM "OrderHeader" o
      LEFT JOIN "DealerAccount" d ON d.id = o."dealerAccountId"
      ${whereSql};
    `,
    values,
  );

  const dataValues = [...values, limit, offset];

  const dataResult = await readClient.query<AdminOrderRow>(
    `
      SELECT
        o.id,
        o."orderNo",
        o."poRef",
        o.status,
        o.total,
        o."createdAt",
        d."companyName",
        d."accountNo",
        COUNT(ol.id)::int AS "lineCount"
      FROM "OrderHeader" o
      LEFT JOIN "DealerAccount" d ON d.id = o."dealerAccountId"
      LEFT JOIN "OrderLine" ol ON ol."orderHeaderId" = o.id
      ${whereSql}
      GROUP BY o.id, d."companyName", d."accountNo"
      ORDER BY o."createdAt" DESC
      LIMIT $${index} OFFSET $${index + 1};
    `,
    dataValues,
  );

  const total = Number(countResult.rows[0]?.count ?? 0);
  return { rows: dataResult.rows, total };
}
