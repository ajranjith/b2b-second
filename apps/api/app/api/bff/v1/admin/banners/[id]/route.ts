import type { NextRequest } from "next/server";

import { revalidateTag } from "next/cache";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { deleteBanner, getBanner } from "@/services/bannerService";
import { withEnvelope } from "@/lib/withEnvelope";

type RouteContext = { params: Promise<{ id: string }> };

async function handleGET(request: NextRequest, context: RouteContext) {
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const { id } = await context.params;
  const banner = await getBanner(id);

  if (!banner) {
    return fail({ message: "Banner not found" }, 404);
  }

  return ok({ banner });
}

async function handleDELETE(request: NextRequest, context: RouteContext) {
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const { id } = await context.params;
  const deleted = await deleteBanner(id);

  if (!deleted) {
    return fail({ message: "Banner not found" }, 404);
  }

  revalidateTag("dealer-banners");

  return ok({ success: true, message: "Banner deleted" });
}

export const GET = withEnvelope({ namespace: "A" }, handleGET);
export const DELETE = withEnvelope({ namespace: "A" }, handleDELETE);
