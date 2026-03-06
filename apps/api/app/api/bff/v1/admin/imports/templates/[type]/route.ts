import type { NextRequest } from "next/server";

import { cacheLife, cacheTag } from "next/cache";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { getImportTemplate } from "@/services/adminImportsService";
import { withEnvelope } from "@/lib/withEnvelope";

async function handleGET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> },
) {
  const { type } = await context.params;
  cacheTag("admin-import-templates");
  cacheLife({ revalidate: 300, expire: 1800 });

  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const template = getImportTemplate(type.toUpperCase());
  if (!template) {
    return fail({ message: "Template not found" }, 404);
  }

  return ok(template);
}

export const GET = withEnvelope({ namespace: "A" }, handleGET);
