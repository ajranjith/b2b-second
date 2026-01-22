import type { NextRequest } from "next/server";

import { DealerBackordersResponseSchema } from "@repo/lib";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { getDealerBackorders } from "@/services/dealerOrdersService";

const parseNumber = (value: string | null, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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

  const url = new URL(request.url);
  const page = parseNumber(url.searchParams.get("page"), 1);
  const limit = parseNumber(url.searchParams.get("limit"), 20);

  const data = await getDealerBackorders(accountId, page, limit);
  return ok(data);
}
