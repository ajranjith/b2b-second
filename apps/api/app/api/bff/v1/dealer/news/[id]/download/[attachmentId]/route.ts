import type { NextRequest } from "next/server";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { getNewsAttachment } from "@/services/newsService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; attachmentId: string } },
) {
  const auth = requireRole(request, "DEALER");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const data = await getNewsAttachment(params.id, params.attachmentId);
  if (!data) {
    return fail({ message: "Attachment not found" }, 404);
  }

  return ok(data);
}
