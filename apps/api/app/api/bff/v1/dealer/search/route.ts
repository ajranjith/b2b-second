import type { NextRequest } from "next/server";

import { cacheLife, cacheTag } from "next/cache";
import { DealerSearchResponseSchema } from "@repo/lib";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { runDealerSearch } from "@/services/searchService";
import { withEnvelope } from "@/lib/withEnvelope";

const parseNumber = (value: string | null, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

async function handleGET(request: NextRequest) {
  const auth = requireRole(request, "DEALER");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  cacheTag("dealer-search");
  cacheLife("short");

  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const page = parseNumber(url.searchParams.get("page"), 1);
  const limit = parseNumber(url.searchParams.get("limit"), 20);
  const offset = (page - 1) * limit;

  const items = await runDealerSearch(query, limit, offset);

  const response = DealerSearchResponseSchema.parse({
    query,
    page,
    limit,
    items,
    total: items.length,
  });
  return ok(response);
}

export const GET = withEnvelope({ namespace: "D" }, handleGET);
