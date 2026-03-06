import type { NextRequest } from "next/server";

import { requireRole } from "@/auth/requireRole";
import { fail } from "@/lib/response";
import { writeClient } from "@/db";
import { withEnvelope } from "@/lib/withEnvelope";

const toCsv = (rows: Array<Record<string, any>>) => {
  const headers = ["orderNo", "createdAt", "status", "total"];
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      [
        row.orderNo ?? "",
        row.createdAt ? new Date(row.createdAt).toISOString() : "",
        row.status ?? "",
        row.total ?? "",
      ].join(","),
    ),
  ];
  return lines.join("\n");
};

async function handleGET(request: NextRequest) {
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  await writeClient.query("SELECT pg_sleep(2);");

  let rows: Array<Record<string, any>> = [];
  try {
    const result = await writeClient.query(
      `
        SELECT
          "orderNo" AS "orderNo",
          "createdAt" AS "createdAt",
          "status" AS "status",
          "total" AS "total"
        FROM "OrderHeader"
        ORDER BY "createdAt" DESC
        LIMIT 5000;
      `,
    );
    rows = result.rows;
  } catch (error: any) {
    if (error?.code !== "42P01") {
      throw error;
    }
  }

  const csv = toCsv(rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="orders-export.csv"',
    },
  });
}

export const GET = withEnvelope({ namespace: "A" }, handleGET);
