import type { NextRequest } from "next/server";

import { revalidateTag } from "next/cache";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { archiveNews } from "@/services/newsService";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const data = await archiveNews(params.id);
  if (!data) {
    return fail({ message: "News article not found" }, 404);
  }

  revalidateTag("dealer-news", "max");
  return ok(data);
}
