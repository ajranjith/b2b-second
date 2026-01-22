import { readClient, writeClient } from "../db";

export type BannerRecord = {
  id: string;
  title: string | null;
  subtitle: string | null;
  mediaUrl: string;
  mediaType: string | null;
  posterUrl: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const BANNER_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS bff_banners (
    id TEXT PRIMARY KEY,
    title TEXT,
    subtitle TEXT,
    media_url TEXT NOT NULL,
    media_type TEXT,
    poster_url TEXT,
    cta_label TEXT,
    cta_href TEXT,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

const BANNER_SELECT_FIELDS = `
  id,
  title,
  subtitle,
  media_url AS "mediaUrl",
  media_type AS "mediaType",
  poster_url AS "posterUrl",
  cta_label AS "ctaLabel",
  cta_href AS "ctaHref",
  starts_at AS "startsAt",
  ends_at AS "endsAt",
  is_active AS "isActive",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export async function createBanner(payload: Omit<BannerRecord, "createdAt" | "updatedAt">) {
  await writeClient.query(BANNER_TABLE_SQL);

  const now = new Date();
  const result = await writeClient.query<BannerRecord>(
    `
      INSERT INTO bff_banners (
        id,
        title,
        subtitle,
        media_url,
        media_type,
        poster_url,
        cta_label,
        cta_href,
        starts_at,
        ends_at,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING ${BANNER_SELECT_FIELDS};
    `,
    [
      payload.id,
      payload.title,
      payload.subtitle,
      payload.mediaUrl,
      payload.mediaType,
      payload.posterUrl,
      payload.ctaLabel,
      payload.ctaHref,
      payload.startsAt,
      payload.endsAt,
      payload.isActive,
      now,
      now,
    ],
  );

  return result.rows[0];
}

export async function listActiveBanners(): Promise<BannerRecord[]> {
  try {
    const result = await readClient.query<BannerRecord>(
      `
        SELECT ${BANNER_SELECT_FIELDS}
        FROM bff_banners
        WHERE is_active = true
          AND (starts_at IS NULL OR starts_at <= NOW())
          AND (ends_at IS NULL OR ends_at >= NOW())
        ORDER BY created_at DESC;
      `,
    );

    return result.rows;
  } catch (error: any) {
    if (error?.code === "42P01") {
      return [];
    }
    throw error;
  }
}
