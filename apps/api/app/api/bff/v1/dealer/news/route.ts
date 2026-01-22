import type { NextRequest } from "next/server";

import { cacheLife, cacheTag } from "next/cache";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { listDealerNews } from "@/services/newsService";
import { withEnvelope } from "@/lib/withEnvelope";

async function handleGET(request: NextRequest) {
  cacheTag("dealer-news");
  cacheLife("short");

  const auth = requireRole(request, "DEALER");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const data = await listDealerNews(10);
  return ok(data);
}

export const GET = withEnvelope({ namespace: "D" }, handleGET);
