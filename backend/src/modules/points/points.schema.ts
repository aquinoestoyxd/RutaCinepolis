import { z } from 'zod';
import { TransactionType, TransactionOrigin } from '../../shared/types/enums';

export const earnPointsSchema = z.object({
  memberId: z.string().uuid(),
  amount: z.number().positive('El monto debe ser positivo'),
  transactionType: z.nativeEnum(TransactionType),
  posId: z.string().max(50).optional(),
  origin: z.nativeEnum(TransactionOrigin).optional(),
  externalRef: z.string().max(100).optional(),
  description: z.string().max(255).optional(),
});

export const adjustPointsSchema = z.object({
  delta: z.number().int('El ajuste debe ser un entero').refine(n => n !== 0, {
    message: 'El ajuste no puede ser cero',
  }),
  reason: z.string().min(5, 'La razón debe tener al menos 5 caracteres').max(255),
});

export type EarnPointsDto = z.infer<typeof earnPointsSchema>;
export type AdjustPointsDto = z.infer<typeof adjustPointsSchema>;
