import { z } from 'zod';
import { TransactionType } from '../../shared/types/enums';

export const posTransactionSchema = z.object({
  cardNumber: z.string().length(16, 'Número de tarjeta inválido'),
  posId: z.string().min(1).max(50),
  amount: z.number().positive('El monto debe ser positivo'),
  transactionType: z.nativeEnum(TransactionType),
  externalRef: z.string().max(100).optional(),
  description: z.string().max(255).optional(),
});

export const posOfflineSyncSchema = z.object({
  posId: z.string().min(1).max(50),
  transactions: z.array(
    z.object({
      cardNumber: z.string().length(16),
      amount: z.number().positive(),
      transactionType: z.nativeEnum(TransactionType),
      externalRef: z.string().max(100).optional(),
      occurredAt: z.string().datetime(),
    }),
  ).min(1).max(100),
});

export const posLookupSchema = z.object({
  cardNumber: z.string().length(16),
});

export type PosTransactionDto = z.infer<typeof posTransactionSchema>;
export type PosOfflineSyncDto = z.infer<typeof posOfflineSyncSchema>;
