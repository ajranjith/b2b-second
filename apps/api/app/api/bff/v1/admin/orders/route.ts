import type { NextRequest } from "next/server";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { getAdminOrders } from "@/services/adminOrdersService";
import { withEnvelope } from "@/lib/withEnvelope";

const parseNumber = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

async function handleGET(request: NextRequest) {
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const { searchParams } = new URL(request.url);
  const page = parseNumber(searchParams.get("page"), 1);
  const limit = parseNumber(searchParams.get("limit"), 20);
  const query = searchParams.get("query")?.trim() || undefined;
  const status = searchParams.get("status")?.trim() || undefined;

  const data = await getAdminOrders({ page, limit, query, status });
  return ok(data);
}

export const GET = withEnvelope({ namespace: "A" }, handleGET);
