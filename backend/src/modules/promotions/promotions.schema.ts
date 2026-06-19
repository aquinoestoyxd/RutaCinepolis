import { z } from 'zod';

export const createPromotionSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().max(500).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  terms: z.string().max(5000).optional(),
  restrictions: z.string().max(5000).optional(),
});

export const updatePromotionSchema = createPromotionSchema.partial();

export type CreatePromotionDto = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionDto = z.infer<typeof updatePromotionSchema>;
