import type { NextRequest } from "next/server";

import { requireRole } from "@/auth/requireRole";
import { fail } from "@/lib/response";
import { getDealerBackordersExport } from "@/services/dealerOrdersService";

const toCsv = (rows: Array<Record<string, any>>) => {
  const headers = [
    "accountNo",
    "portalOrderNumber",
    "erpOrderNumber",
    "productCode",
    "description",
    "qtyOrdered",
    "qtyOutstanding",
    "inWarehouse",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.accountNo ?? "",
        row.portalOrderNumber ?? "",
        row.erpOrderNumber ?? "",
        row.productCode ?? "",
        row.description ?? "",
        row.qtyOrdered ?? "",
        row.qtyOutstanding ?? "",
        row.inWarehouse ?? "",
      ].join(","),
    ),
  ];
  return lines.join("\n");
};

export async function GET(request: NextRequest) {
  const auth = requireRole(request, "DEALER");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const accountId = auth.user?.dealerAccountId;
  if (!accountId) {
    return fail({ message: "Dealer account missing" }, 400);
  }

  const rows = await getDealerBackordersExport(accountId);
  const csv = toCsv(rows);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="dealer-backorders.csv"',
    },
  });
}
