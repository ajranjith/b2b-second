import type { NextRequest } from "next/server";

import { cacheLife, cacheTag } from "next/cache";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { listImports } from "@/services/adminImportsService";
import { withEnvelope } from "@/lib/withEnvelope";

async function handleGET(request: NextRequest) {
  cacheTag("admin-imports");
  cacheLife("short");

  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const importType = url.searchParams.get("importType") ?? undefined;

  const data = await listImports({ status, importType });
  return ok(data);
}

export const GET = withEnvelope({ namespace: "A" }, handleGET);
