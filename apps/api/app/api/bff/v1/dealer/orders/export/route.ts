import type { NextRequest } from "next/server";

import { requireRole } from "@/auth/requireRole";
import { fail } from "@/lib/response";
import { getDealerOrdersExport } from "@/services/dealerOrdersService";
import { withEnvelope } from "@/lib/withEnvelope";

const toCsv = (rows: Array<Record<string, any>>) => {
  const headers = ["orderNo", "createdAt", "status", "total", "dispatchMethod", "poRef", "notes"];
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.orderNo ?? "",
        row.createdAt ? new Date(row.createdAt).toISOString() : "",
        row.status ?? "",
        row.total ?? "",
        row.dispatchMethod ?? "",
        row.poRef ?? "",
        row.notes ?? "",
      ].join(","),
    ),
  ];
  return lines.join("\n");
};

async function handleGET(request: NextRequest) {
  const auth = requireRole(request, "DEALER");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const accountId = auth.user?.dealerAccountId;
  if (!accountId) {
    return fail({ message: "Dealer account missing" }, 400);
  }

  const rows = await getDealerOrdersExport(accountId);
  const csv = toCsv(rows);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="dealer-orders.csv"',
    },
  });
}

export const GET = withEnvelope({ namespace: "D" }, handleGET);
