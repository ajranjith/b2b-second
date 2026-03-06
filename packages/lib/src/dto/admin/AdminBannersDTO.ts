import { z } from 'zod';

import { BannerSchema, BannerUpsertSchema } from '../shared';

export const AdminBannerUpsertSchema = BannerUpsertSchema;

export const AdminBannerResponseSchema = z.object({
  banner: BannerSchema,
});

export const AdminBannersListResponseSchema = z.object({
  banners: z.array(BannerSchema),
});

export type AdminBannerUpsertDTO = z.infer<typeof AdminBannerUpsertSchema>;
export type AdminBannerResponseDTO = z.infer<typeof AdminBannerResponseSchema>;
export type AdminBannersListResponseDTO = z.infer<typeof AdminBannersListResponseSchema>;
