import type { NextRequest } from "next/server";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { getImportStatus } from "@/services/adminImportsService";
import { withEnvelope } from "@/lib/withEnvelope";

async function handleGET(
  request: NextRequest,
  context: { params: Promise<{ batchId: string }> },
) {
  const { batchId } = await context.params;
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const data = await getImportStatus(batchId);
  if (!data) {
    return fail({ message: "Import batch not found" }, 404);
  }

  return ok(data);
}

export const GET = withEnvelope({ namespace: "A" }, handleGET);
