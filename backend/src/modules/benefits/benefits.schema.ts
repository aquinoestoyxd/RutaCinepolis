import { z } from 'zod';
import { BenefitType, DiscountType } from '../../shared/types/enums';

export const createBenefitSchema = z.object({
  name: z.string().min(3).max(150),
  description: z.string().max(500).optional(),
  type: z.nativeEnum(BenefitType),
  discountType: z.nativeEnum(DiscountType).optional(),
  discountValue: z.number().positive().optional(),
  pointsCost: z.number().int().nonnegative().optional(),
  maxUsesPerMonth: z.number().int().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  levelIds: z.array(z.string().uuid()).min(1, 'Debe asignar al menos un nivel'),
});

export const updateBenefitSchema = createBenefitSchema.partial();

export type CreateBenefitDto = z.infer<typeof createBenefitSchema>;
export type UpdateBenefitDto = z.infer<typeof updateBenefitSchema>;
