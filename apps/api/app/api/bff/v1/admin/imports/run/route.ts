import type { NextRequest } from "next/server";

import { ZodError } from "zod";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { AdminImportRunSchema } from "@repo/lib";
import { runImport } from "@/services/adminImportsService";
import { withEnvelope } from "@/lib/withEnvelope";

async function handlePOST(request: NextRequest) {
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  try {
    const payload = AdminImportRunSchema.parse(await request.json());
    const result = await runImport(payload.importType, auth.user?.id ?? null);
    return ok({ import: payload, batch: result });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return fail({ message: error.message, details: error.issues }, 400);
    }
    throw error;
  }
}

export const POST = withEnvelope({ namespace: "A" }, handlePOST);
