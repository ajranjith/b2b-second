import type { NextRequest } from "next/server";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { getImportStatus } from "@/services/adminImportsService";

export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } },
) {
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const data = await getImportStatus(params.batchId);
  if (!data) {
    return fail({ message: "Import batch not found" }, 404);
  }

  return ok(data);
}
