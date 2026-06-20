import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { LevelName, NotificationType, AuditAction } from '../../shared/types/enums';
import { NotFoundError, BusinessRuleError } from '../../shared/utils/errorTypes';
import { notificationService } from '../notifications/notification.service';
import { logger } from '../../shared/utils/logger';

export type AutoDeliverResult =
  | { delivered: true; merchandiseName: string; newStock: number }
  | { delivered: false; reason: 'no_stock' | 'no_kit' | 'already_received' };

export interface DeliverMerchandiseParams {
  merchandiseId: string;
  memberId: string;
  adminId: string;
  quantity?: number;
  notes?: string;
}

export class MerchandiseService {
  async findAll(activeOnly = true) {
    return prisma.merchandise.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const item = await prisma.merchandise.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Merchandising');
    return item;
  }

  async deliver(params: DeliverMerchandiseParams) {
    const [merchandise, membership] = await Promise.all([
      prisma.merchandise.findUnique({ where: { id: params.merchandiseId } }),
      prisma.membership.findUnique({
        where: { memberId: params.memberId },
        include: { level: true, member: true },
      }),
    ]);

    if (!merchandise) throw new NotFoundError('Merchandising');
    if (!merchandise.isActive) throw new BusinessRuleError('El item no está disponible');
    if (!membership) throw new NotFoundError('Membresía del miembro');

    const memberLevel = membership.level.name as LevelName;
    if (memberLevel !== LevelName.GOLDEN) {
      throw new BusinessRuleError(
        `El kit de bienvenida Golden solo está disponible para miembros Golden. El miembro es ${memberLevel}`,
      );
    }

    const qty = params.quantity ?? 1;
    if (merchandise.stockCurrent < qty) {
      throw new BusinessRuleError(
        `Stock insuficiente. Disponible: ${merchandise.stockCurrent}`,
      );
    }

    const delivery = await prisma.$transaction(async (tx) => {
      const created = await tx.merchandiseDelivery.create({
        data: {
          merchandiseId: params.merchandiseId,
          memberId: params.memberId,
          adminId: params.adminId,
          quantity: qty,
          notes: params.notes,
        },
        include: { merchandise: true },
      });

      const updated = await tx.merchandise.update({
        where: { id: params.merchandiseId },
        data: { stockCurrent: { decrement: qty } },
      });

      await tx.auditLog.create({
        data: {
          userId: params.adminId,
          action: AuditAction.CREATE,
          entity: 'MerchandiseDelivery',
          entityId: created.id,
          newValue: {
            memberId: params.memberId,
            merchandiseId: params.merchandiseId,
            quantity: qty,
          } as Prisma.InputJsonValue,
        },
      });

      if (updated.stockCurrent <= updated.stockMinAlert) {
        logger.warn('Stock bajo en merchandising', {
          id: updated.id,
          name: updated.name,
          stock: updated.stockCurrent,
        });
      }

      return created;
    });

    await notificationService.create(params.memberId, {
      type: NotificationType.MERCHANDISE_DELIVERY,
      title: '¡Tu kit Golden ha sido entregado!',
      message: `Has recibido ${qty}x ${merchandise.name}. ¡Bienvenido al nivel Golden!`,
    }).catch(err => logger.warn('Error notificación merchandising', { err }));

    return delivery;
  }

  /**
   * Entrega automática del kit Golden al registrar o subir de nivel.
   * Solo entrega si: hay kit activo, hay stock, y el miembro no lo recibió ya.
   */
  async autoDeliverGoldenKit(memberId: string, staffId: string): Promise<AutoDeliverResult> {
    const kit = await prisma.merchandise.findFirst({
      where: { levelRequired: LevelName.GOLDEN, isActive: true },
      orderBy: { stockCurrent: 'desc' },
    });

    if (!kit) return { delivered: false, reason: 'no_kit' };
    if (kit.stockCurrent <= 0) return { delivered: false, reason: 'no_stock' };

    const alreadyReceived = await prisma.merchandiseDelivery.findFirst({
      where: { memberId, merchandiseId: kit.id },
    });
    if (alreadyReceived) return { delivered: false, reason: 'already_received' };

    await this.deliver({ merchandiseId: kit.id, memberId, adminId: staffId });

    logger.info('Kit Golden entregado automáticamente', { memberId, kitId: kit.id });

    return { delivered: true, merchandiseName: kit.name, newStock: kit.stockCurrent - 1 };
  }

  async getDeliveryHistory(memberId: string) {
    return prisma.merchandiseDelivery.findMany({
      where: { memberId },
      include: { merchandise: true },
      orderBy: { deliveredAt: 'desc' },
    });
  }

  async updateStock(id: string, delta: number, adminId: string) {
    const item = await prisma.merchandise.findUnique({ where: { id } });
    if (!item) throw new NotFoundError('Merchandising');

    const newStock = item.stockCurrent + delta;
    if (newStock < 0) throw new BusinessRuleError('El ajuste resultaría en stock negativo');

    return prisma.$transaction(async (tx) => {
      const updated = await tx.merchandise.update({
        where: { id },
        data: {
          stockCurrent: { increment: delta },
          ...(delta > 0 ? { stockTotal: { increment: delta } } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.UPDATE,
          entity: 'Merchandise',
          entityId: id,
          oldValue: { stockCurrent: item.stockCurrent } as Prisma.InputJsonValue,
          newValue: { stockCurrent: updated.stockCurrent, delta } as Prisma.InputJsonValue,
        },
      });

      return updated;
    });
  }
}

export const merchandiseService = new MerchandiseService();
