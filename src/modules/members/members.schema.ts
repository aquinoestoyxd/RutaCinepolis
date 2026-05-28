import { z } from 'zod';
import { MemberStatus } from '../../shared/types/enums';

export const registerMemberSchema = z.object({
  dni: z
    .string()
    .length(8, 'El DNI debe tener 8 dígitos')
    .regex(/^\d{8}$/, 'El DNI debe contener solo dígitos'),
  firstName: z.string().min(2).max(100).trim(),
  lastName: z.string().min(2).max(100).trim(),
  email: z.string().email('Correo inválido').max(150),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/).optional(),
  birthDate: z.string().date('Fecha inválida (YYYY-MM-DD)').optional(),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener mayúscula')
    .regex(/[0-9]/, 'Debe contener número'),
});

export const updateMemberSchema = z.object({
  firstName: z.string().min(2).max(100).trim().optional(),
  lastName: z.string().min(2).max(100).trim().optional(),
  phone: z.string().regex(/^\+?[0-9]{9,15}$/).optional().nullable(),
  birthDate: z.string().date().optional().nullable(),
});

export const memberIdParamSchema = z.object({
  id: z.string().uuid('ID de miembro inválido'),
});

export const memberStatusSchema = z.object({
  status: z.nativeEnum(MemberStatus),
  reason: z.string().min(5).max(255).optional(),
});

export const searchMembersSchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(MemberStatus).optional(),
  levelName: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.enum(['registeredAt', 'firstName', 'lastName', 'totalVisits', 'points']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type RegisterMemberDto = z.infer<typeof registerMemberSchema>;
export type UpdateMemberDto = z.infer<typeof updateMemberSchema>;
export type MemberStatusDto = z.infer<typeof memberStatusSchema>;
export type SearchMembersQuery = z.infer<typeof searchMembersSchema>;
