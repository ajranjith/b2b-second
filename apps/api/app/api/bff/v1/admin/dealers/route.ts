import type { NextRequest } from "next/server";

import { cacheLife, cacheTag } from "next/cache";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { listAdminDealers } from "@/services/adminDealersService";

export async function GET(request: NextRequest) {
  cacheTag("admin-dealers");
  cacheLife("short");

  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const data = await listAdminDealers();
  return ok(data);
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  return fail(
    { message: "Create dealer not implemented yet", code: "NOT_IMPLEMENTED" },
    501,
  );
}

export async function PATCH(request: NextRequest) {
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  return fail(
    { message: "Update dealer not implemented yet", code: "NOT_IMPLEMENTED" },
    501,
  );
}
