import type { NextRequest } from "next/server";

import { cacheLife, cacheTag } from "next/cache";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { listImports } from "@/services/adminImportsService";

export async function GET(request: NextRequest) {
  cacheTag("admin-imports");
  cacheLife("short");

  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const data = await listImports();
  return ok(data);
}
