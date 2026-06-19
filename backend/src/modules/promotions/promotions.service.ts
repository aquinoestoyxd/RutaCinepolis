import { prisma } from '../../config/database';
import { AuditAction } from '../../shared/types/enums';
import { NotFoundError } from '../../shared/utils/errorTypes';
import type { CreatePromotionDto, UpdatePromotionDto } from './promotions.schema';

export class PromotionsService {
  async create(dto: CreatePromotionDto, adminId: string) {
    const promotion = await prisma.$transaction(async (tx) => {
      const created = await tx.promotion.create({
        data: {
          title: dto.title,
          description: dto.description,
          imageUrl: dto.imageUrl,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          terms: dto.terms,
          restrictions: dto.restrictions,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.CREATE,
          entity: 'Promotion',
          entityId: created.id,
          newValue: { title: dto.title },
        },
      });

      return created;
    });

    return promotion;
  }

  async findAllActive() {
    const now = new Date();
    return prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const promotion = await prisma.promotion.findUnique({ where: { id } });
    if (!promotion) throw new NotFoundError('Promoción');
    return promotion;
  }

  async update(id: string, dto: UpdatePromotionDto, adminId: string) {
    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Promoción');

    await prisma.$transaction(async (tx) => {
      await tx.promotion.update({
        where: { id },
        data: {
          ...dto,
          ...(dto.startDate ? { startDate: new Date(dto.startDate) } : {}),
          ...(dto.endDate ? { endDate: new Date(dto.endDate) } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.UPDATE,
          entity: 'Promotion',
          entityId: id,
          oldValue: { title: existing.title },
          newValue: dto as never,
        },
      });
    });

    return this.findById(id);
  }

  async deactivate(id: string, adminId: string) {
    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Promoción');

    await prisma.$transaction(async (tx) => {
      await tx.promotion.update({
        where: { id },
        data: { isActive: false },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.DELETE,
          entity: 'Promotion',
          entityId: id,
          oldValue: { isActive: true },
          newValue: { isActive: false },
        },
      });
    });
  }
}

export const promotionsService = new PromotionsService();
