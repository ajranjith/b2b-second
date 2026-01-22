import type { NextRequest } from "next/server";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { getNewsAttachment } from "@/services/newsService";
import { withEnvelope } from "@/lib/withEnvelope";

async function handleGET(
  request: NextRequest,
  context: { params: { id: string; attachmentId: string } },
) {
  const auth = requireRole(request, "DEALER");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const data = await getNewsAttachment(context.params.id, context.params.attachmentId);
  if (!data) {
    return fail({ message: "Attachment not found" }, 404);
  }

  return ok(data);
}

export const GET = withEnvelope({ namespace: "D" }, handleGET);
