import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import {
  TransactionType,
  TransactionStatus,
  TransactionOrigin,
  RedemptionStatus,
  NotificationType,
  AuditAction,
} from '../../shared/types/enums';
import { NotFoundError, BusinessRuleError } from '../../shared/utils/errorTypes';
import { notificationService } from '../notifications/notification.service';
import { logger } from '../../shared/utils/logger';
import type { RedeemBenefitDto } from './redemptions.schema';

export class RedemptionsService {
  /**
   * Canjea un beneficio deduciendo puntos del miembro (CU-04).
   * Operación 100% atómica: si algo falla, no hay deducción parcial.
   */
  async redeem(dto: RedeemBenefitDto, cashierId?: string) {
    const [membership, benefit] = await Promise.all([
      prisma.membership.findUnique({
        where: { memberId: dto.memberId },
        include: { member: true, level: true },
      }),
      prisma.benefit.findUnique({ where: { id: dto.benefitId } }),
    ]);

    if (!membership) throw new NotFoundError('Membresía del miembro');
    if (!benefit) throw new NotFoundError('Beneficio');
    if (!benefit.isActive) throw new BusinessRuleError('El beneficio no está disponible');
    if (membership.member.status !== 'ACTIVE') {
      throw new BusinessRuleError('El miembro no está activo');
    }

    // Verificar que el beneficio esté disponible para el nivel actual
    const levelBenefit = await prisma.levelBenefit.findFirst({
      where: { benefitId: dto.benefitId, levelId: membership.levelId },
    });
    if (!levelBenefit) {
      throw new BusinessRuleError(
        `El beneficio "${benefit.name}" no está disponible para el nivel ${membership.level.displayName}`,
      );
    }

    const pointsCost = benefit.pointsCost ?? 0;
    if (pointsCost > 0 && membership.points < pointsCost) {
      throw new BusinessRuleError(
        `Puntos insuficientes. Necesitas ${pointsCost}, tienes ${membership.points}`,
      );
    }

    // Validez temporal del beneficio
    const now = new Date();
    if (benefit.validFrom && now < benefit.validFrom) {
      throw new BusinessRuleError('El beneficio aún no está vigente');
    }
    if (benefit.validUntil && now > benefit.validUntil) {
      throw new BusinessRuleError('El beneficio ha expirado');
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          memberId: dto.memberId,
          posId: dto.posId,
          type: TransactionType.REDEMPTION,
          amount: 0,
          pointsUsed: pointsCost,
          status: TransactionStatus.COMPLETED,
          origin: dto.posId ? TransactionOrigin.POS : TransactionOrigin.WEB,
          description: `Canje: ${benefit.name}`,
          processedAt: new Date(),
        },
      });

      const redemption = await tx.redemption.create({
        data: {
          memberId: dto.memberId,
          benefitId: dto.benefitId,
          transactionId: transaction.id,
          pointsUsed: pointsCost,
          status: RedemptionStatus.COMPLETED,
          notes: dto.notes,
          processedAt: new Date(),
        },
        include: { benefit: true },
      });

      if (pointsCost > 0) {
        await tx.membership.update({
          where: { memberId: dto.memberId },
          data: { points: { decrement: pointsCost } },
        });
      }

      if (cashierId) {
        await tx.auditLog.create({
          data: {
            userId: cashierId,
            action: AuditAction.REDEMPTION,
            entity: 'Redemption',
            entityId: redemption.id,
            newValue: {
              benefitId: dto.benefitId,
              pointsUsed: pointsCost,
              memberId: dto.memberId,
            } as Prisma.InputJsonValue,
          },
        });
      }

      return { transaction, redemption };
    });

    await notificationService.create(dto.memberId, {
      type: NotificationType.BENEFIT_AVAILABLE,
      title: '¡Canje exitoso!',
      message: `Has canjeado "${benefit.name}" usando ${pointsCost} puntos.`,
    }).catch(err => logger.warn('Error notificación canje', { err }));

    return result;
  }

  async getHistory(memberId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [redemptions, total] = await Promise.all([
      prisma.redemption.findMany({
        where: { memberId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { benefit: true },
      }),
      prisma.redemption.count({ where: { memberId } }),
    ]);
    return { redemptions, total, page, limit };
  }
}

export const redemptionsService = new RedemptionsService();
