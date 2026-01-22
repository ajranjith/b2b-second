import type { NextRequest } from "next/server";

import { cacheLife, cacheTag } from "next/cache";

import { DealerBannersResponseSchema } from "@repo/lib";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { getActiveBanners } from "@/services/bannerService";

export async function GET(request: NextRequest) {
  cacheTag("dealer-banners");
  cacheLife("long");

  const auth = requireRole(request, "DEALER");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const banners = await getActiveBanners();
  return ok(DealerBannersResponseSchema.parse({ banners }));
}
