import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import {
  TransactionType,
  TransactionStatus,
  TransactionOrigin,
  NotificationType,
  AuditAction,
} from '../../shared/types/enums';
import { NotFoundError, BusinessRuleError } from '../../shared/utils/errorTypes';
import { logger } from '../../shared/utils/logger';
import { notificationService } from '../notifications/notification.service';
import { membershipService } from '../membership/membership.service';
import { configService } from '../admin/config.service';

export interface EarnPointsParams {
  memberId: string;
  amount: number;
  transactionType: TransactionType;
  posId?: string;
  origin?: TransactionOrigin;
  externalRef?: string;
  description?: string;
  cashierId?: string;
}

export interface PointsBalance {
  current: number;
  totalEarned: number;
  totalUsed: number;
  totalVisits: number;
  totalSpent: number;
}

export class PointsService {
  /**
   * Acredita puntos al miembro por una compra (CU-03).
   * Operación atómica: si falla la BD, no se modifican puntos ni visitas.
   */
  async earnPoints(params: EarnPointsParams) {
    const membership = await prisma.membership.findUnique({
      where: { memberId: params.memberId },
      include: { member: true, level: true },
    });
    if (!membership) throw new NotFoundError('Membresía');
    if (membership.member.status !== 'ACTIVE') {
      throw new BusinessRuleError('El miembro no está activo');
    }

    const [pointsRate, multiplier] = await Promise.all([
      configService.getNumber('POINTS_RATE', 0.05),
      Promise.resolve(Number(membership.level.pointsMultiplier)),
    ]);

    const rawPoints = Math.floor(params.amount * pointsRate * multiplier);
    const pointsEarned = Math.max(0, rawPoints);

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          memberId: params.memberId,
          posId: params.posId,
          type: params.transactionType,
          amount: new Prisma.Decimal(params.amount),
          pointsEarned,
          status: TransactionStatus.COMPLETED,
          origin: params.origin ?? TransactionOrigin.WEB,
          externalRef: params.externalRef,
          description: params.description,
          processedAt: new Date(),
        },
      });

      const updatedMembership = await tx.membership.update({
        where: { memberId: params.memberId },
        data: {
          points: { increment: pointsEarned },
          totalVisits: { increment: 1 },
          totalSpent: { increment: new Prisma.Decimal(params.amount) },
        },
        include: { level: true },
      });

      if (params.cashierId) {
        await tx.auditLog.create({
          data: {
            userId: params.cashierId,
            action: AuditAction.POINTS_ADJUSTMENT,
            entity: 'Membership',
            entityId: membership.id,
            newValue: {
              pointsEarned,
              totalVisits: updatedMembership.totalVisits,
              transactionId: transaction.id,
            } as Prisma.InputJsonValue,
          },
        });
      }

      return { transaction, membership: updatedMembership };
    });

    // Verificar upgrade de nivel (RC-F06) — fuera de la transacción atómica principal
    const upgraded = await membershipService.checkAndUpgradeLevel(params.memberId);

    if (pointsEarned > 0) {
      await notificationService.create(params.memberId, {
        type: NotificationType.POINTS_EARNED,
        title: '¡Puntos acreditados!',
        message: `Ganaste ${pointsEarned} puntos por tu compra de S/. ${params.amount.toFixed(2)}.`,
      }).catch(err => logger.warn('Error enviando notificación de puntos', { err }));
    }

    return {
      transaction: result.transaction,
      pointsEarned,
      newBalance: result.membership.points,
      levelUpgraded: upgraded,
    };
  }

  async getBalance(memberId: string): Promise<PointsBalance> {
    const membership = await prisma.membership.findUnique({
      where: { memberId },
      select: {
        points: true,
        totalVisits: true,
        totalSpent: true,
      },
    });
    if (!membership) throw new NotFoundError('Membresía');

    const aggregated = await prisma.transaction.aggregate({
      where: { memberId, status: TransactionStatus.COMPLETED },
      _sum: { pointsEarned: true, pointsUsed: true },
    });

    return {
      current: membership.points,
      totalEarned: aggregated._sum.pointsEarned ?? 0,
      totalUsed: aggregated._sum.pointsUsed ?? 0,
      totalVisits: membership.totalVisits,
      totalSpent: Number(membership.totalSpent),
    };
  }

  async getHistory(memberId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { memberId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where: { memberId } }),
    ]);
    return { transactions, total, page, limit };
  }

  async adminAdjustPoints(
    memberId: string,
    delta: number,
    reason: string,
    adminId: string,
  ) {
    const membership = await prisma.membership.findUnique({ where: { memberId } });
    if (!membership) throw new NotFoundError('Membresía');

    const newBalance = membership.points + delta;
    if (newBalance < 0) {
      throw new BusinessRuleError('El ajuste resultaría en saldo negativo de puntos');
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          memberId,
          type: TransactionType.ADJUSTMENT,
          amount: 0,
          pointsEarned: delta > 0 ? delta : 0,
          pointsUsed: delta < 0 ? Math.abs(delta) : 0,
          status: TransactionStatus.COMPLETED,
          origin: TransactionOrigin.WEB,
          description: `Ajuste manual: ${reason}`,
          processedAt: new Date(),
        },
      });

      await tx.membership.update({
        where: { memberId },
        data: { points: { increment: delta } },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.POINTS_ADJUSTMENT,
          entity: 'Membership',
          entityId: membership.id,
          oldValue: { points: membership.points } as Prisma.InputJsonValue,
          newValue: { points: newBalance, delta, reason } as Prisma.InputJsonValue,
        },
      });
    });

    return { previousBalance: membership.points, adjustment: delta, newBalance };
  }
}

export const pointsService = new PointsService();
