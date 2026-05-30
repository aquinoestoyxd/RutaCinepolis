import { z } from 'zod';

export const upsertConfigSchema = z.object({
  value: z.string().min(1),
  description: z.string().max(255).optional(),
});

export const createAdminUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  role: z.enum(['CAJERO', 'ADMINISTRADOR']),
});

export type UpsertConfigDto = z.infer<typeof upsertConfigSchema>;
export type CreateAdminUserDto = z.infer<typeof createAdminUserSchema>;
