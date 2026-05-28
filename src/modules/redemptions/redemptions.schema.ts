import { z } from 'zod';

export const redeemBenefitSchema = z.object({
  memberId: z.string().uuid(),
  benefitId: z.string().uuid(),
  posId: z.string().max(50).optional(),
  notes: z.string().max(255).optional(),
});

export type RedeemBenefitDto = z.infer<typeof redeemBenefitSchema>;
