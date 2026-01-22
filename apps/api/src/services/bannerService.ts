import { BannerSchema, type BannerDTO } from "@repo/lib";

import { createBanner, listActiveBanners, type BannerRecord } from "../repositories/bannerRepo";

export type BannerInput = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  mediaUrl: string;
  mediaType?: string | null;
  posterUrl?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
};

const toIsoString = (value: Date | null) => (value ? value.toISOString() : null);

const toBannerDTO = (record: BannerRecord): BannerDTO =>
  BannerSchema.parse({
    id: record.id,
    title: record.title,
    subtitle: record.subtitle,
    mediaUrl: record.mediaUrl,
    mediaType: record.mediaType,
    posterUrl: record.posterUrl,
    ctaLabel: record.ctaLabel,
    ctaHref: record.ctaHref,
    startsAt: toIsoString(record.startsAt),
    endsAt: toIsoString(record.endsAt),
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  });

export async function createBannerRecord(input: BannerInput): Promise<BannerDTO> {
  const record = await createBanner({
    id: input.id,
    title: input.title ?? null,
    subtitle: input.subtitle ?? null,
    mediaUrl: input.mediaUrl,
    mediaType: input.mediaType ?? null,
    posterUrl: input.posterUrl ?? null,
    ctaLabel: input.ctaLabel ?? null,
    ctaHref: input.ctaHref ?? null,
    startsAt: input.startsAt ?? null,
    endsAt: input.endsAt ?? null,
    isActive: input.isActive ?? true,
  });

  return toBannerDTO(record);
}

export async function getActiveBanners(): Promise<BannerDTO[]> {
  const records = await listActiveBanners();
  return records.map(toBannerDTO);
}
