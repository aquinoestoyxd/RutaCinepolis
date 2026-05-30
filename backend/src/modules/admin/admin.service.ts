import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { UserRole, AuditAction } from '../../shared/types/enums';
import { ConflictError } from '../../shared/utils/errorTypes';
import type { CreateAdminUserDto } from './admin.schema';

export class AdminService {
  async createStaffUser(dto: CreateAdminUserDto, adminId: string) {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictError('El correo ya está registrado');

    const hashed = await bcrypt.hash(dto.password, env.BCRYPT_ROUNDS);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          password: hashed,
          role: dto.role as UserRole,
        },
        select: { id: true, email: true, role: true, createdAt: true },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.CREATE,
          entity: 'User',
          entityId: created.id,
          newValue: { email: dto.email, role: dto.role },
        },
      });

      return created;
    });

    return user;
  }

  async getAuditLogs(page: number, limit: number, filters: {
    action?: string;
    entity?: string;
    userId?: string;
    from?: string;
    to?: string;
  }) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};

    if (filters.action) where['action'] = filters.action;
    if (filters.entity) where['entity'] = filters.entity;
    if (filters.userId) where['userId'] = filters.userId;
    if (filters.from || filters.to) {
      where['createdAt'] = {
        ...(filters.from ? { gte: new Date(filters.from) } : {}),
        ...(filters.to ? { lte: new Date(filters.to) } : {}),
      };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, role: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }

  async getStaffUsers() {
    return prisma.user.findMany({
      where: { role: { in: [UserRole.CAJERO, UserRole.ADMINISTRADOR] } },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async toggleUserStatus(userId: string, adminId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuario no encontrado');

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id: userId },
        data: { isActive: !user.isActive },
        select: { id: true, email: true, isActive: true },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.UPDATE,
          entity: 'User',
          entityId: userId,
          oldValue: { isActive: user.isActive },
          newValue: { isActive: !user.isActive },
        },
      });

      return result;
    });

    return updated;
  }
}

export const adminService = new AdminService();
