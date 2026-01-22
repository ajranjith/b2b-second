import type { NextRequest } from "next/server";

import { cacheLife, cacheTag } from "next/cache";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { getImportTemplate } from "@/services/adminImportsService";
import { withEnvelope } from "@/lib/withEnvelope";

async function handleGET(
  request: NextRequest,
  context: { params: { type: string } },
) {
  cacheTag("admin-import-templates");
  cacheLife("long");

  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const template = getImportTemplate(context.params.type.toUpperCase());
  if (!template) {
    return fail({ message: "Template not found" }, 404);
  }

  return ok(template);
}

export const GET = withEnvelope({ namespace: "A" }, handleGET);
