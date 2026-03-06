import type { NextRequest } from "next/server";

import crypto from "crypto";

import { cacheLife, cacheTag, revalidateTag } from "next/cache";

import {
  AdminBannerResponseSchema,
  AdminBannerUpsertSchema,
  AdminBannersListResponseSchema,
} from "@repo/lib";

import { requireRole } from "@/auth/requireRole";
import { fail, ok } from "@/lib/response";
import { createBannerRecord, getActiveBanners } from "@/services/bannerService";
import { withEnvelope } from "@/lib/withEnvelope";

const toNullableString = (value: unknown) => {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }
  return value;
};

const toOptionalBoolean = (value: unknown) => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }
    if (value.toLowerCase() === "false") {
      return false;
    }
  }
  return undefined;
};

const normalizePayload = (payload: Record<string, any>) => ({
  ...payload,
  id: toNullableString(payload.id) ?? undefined,
  title: toNullableString(payload.title),
  subtitle: toNullableString(payload.subtitle),
  mediaType: toNullableString(payload.mediaType),
  posterUrl: toNullableString(payload.posterUrl),
  ctaLabel: toNullableString(payload.ctaLabel),
  ctaHref: toNullableString(payload.ctaHref),
  startsAt: toNullableString(payload.startsAt),
  endsAt: toNullableString(payload.endsAt),
  isActive: toOptionalBoolean(payload.isActive),
});

async function handleGET(request: NextRequest) {
  cacheTag("dealer-banners");
  cacheLife({ revalidate: 300, expire: 1800 });

  const banners = await getActiveBanners();
  const response = AdminBannersListResponseSchema.parse({ banners });
  return ok(response);
}

async function handlePOST(request: NextRequest) {
  const auth = requireRole(request, "ADMIN");
  if (!auth.ok) {
    return fail({ message: auth.message }, auth.status);
  }

  const contentType = request.headers.get("content-type") ?? "";
  let payload: Record<string, any> = {};

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    payload = Object.fromEntries(form.entries());
    const file = form.get("file");
    if (!payload.mediaUrl && file instanceof File) {
      payload.mediaUrl = `/uploads/${file.name}`;
      payload.mediaType = file.type.startsWith("video") ? "video" : "image";
    }
  } else {
    payload = await request.json();
  }

  const parsed = AdminBannerUpsertSchema.safeParse(normalizePayload(payload));
  if (!parsed.success) {
    return fail({ message: "Invalid banner payload", details: parsed.error.flatten() }, 400);
  }

  const data = parsed.data;
  const banner = await createBannerRecord({
    id: data.id ?? crypto.randomUUID(),
    title: data.title ?? null,
    subtitle: data.subtitle ?? null,
    mediaUrl: data.mediaUrl,
    mediaType: data.mediaType ?? null,
    posterUrl: data.posterUrl ?? null,
    ctaLabel: data.ctaLabel ?? null,
    ctaHref: data.ctaHref ?? null,
    startsAt: data.startsAt ? new Date(data.startsAt) : null,
    endsAt: data.endsAt ? new Date(data.endsAt) : null,
    isActive: data.isActive ?? true,
  });

  revalidateTag("dealer-banners", "max");

  const response = AdminBannerResponseSchema.parse({ banner });
  return ok(response);
}

export const GET = withEnvelope({ namespace: "A" }, handleGET);
export const POST = withEnvelope({ namespace: "A" }, handlePOST);
