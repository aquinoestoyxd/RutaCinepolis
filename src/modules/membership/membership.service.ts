import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { LevelName, NotificationType, AuditAction } from '../../shared/types/enums';
import { NotFoundError } from '../../shared/utils/errorTypes';
import { logger } from '../../shared/utils/logger';
import { notificationService } from '../notifications/notification.service';
import { configService } from '../admin/config.service';

export class MembershipService {
  /**
   * Verifica y ejecuta upgrade automático de nivel (RC-F06, CU-05).
   * Criterio: cantidad de visitas alcanza el umbral configurado.
   */
  async checkAndUpgradeLevel(memberId: string): Promise<boolean> {
    const membership = await prisma.membership.findUnique({
      where: { memberId },
      include: { level: true, member: true },
    });
    if (!membership) return false;

    const currentLevelName = membership.level.name as LevelName;
    if (currentLevelName === LevelName.GOLDEN) return false;

    const [premiumThreshold, goldenThreshold] = await Promise.all([
      configService.getNumber('PREMIUM_VISITS_THRESHOLD', 10),
      configService.getNumber('GOLDEN_VISITS_THRESHOLD', 25),
    ]);

    let targetLevel: LevelName | null = null;
    if (currentLevelName === LevelName.PREMIUM && membership.totalVisits >= goldenThreshold) {
      targetLevel = LevelName.GOLDEN;
    } else if (currentLevelName === LevelName.ESTANDAR && membership.totalVisits >= premiumThreshold) {
      targetLevel = LevelName.PREMIUM;
    }

    if (!targetLevel) return false;

    const newLevel = await prisma.level.findUnique({ where: { name: targetLevel } });
    if (!newLevel) {
      logger.error('Nivel destino no encontrado en BD', { targetLevel });
      return false;
    }

    await prisma.$transaction(async (tx) => {
      await tx.membership.update({
        where: { memberId },
        data: {
          levelId: newLevel.id,
          levelUpdatedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          action: AuditAction.LEVEL_UPGRADE,
          entity: 'Membership',
          entityId: membership.id,
          oldValue: { level: currentLevelName, visits: membership.totalVisits } as Prisma.InputJsonValue,
          newValue: { level: targetLevel, upgradedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      });
    });

    await notificationService.create(memberId, {
      type: NotificationType.LEVEL_UPGRADE,
      title: `¡Felicidades! Ahora eres miembro ${newLevel.displayName}`,
      message: `Has alcanzado el nivel ${newLevel.displayName} con ${membership.totalVisits} visitas. ¡Disfruta tus nuevos beneficios!`,
    }).catch(err => logger.warn('Error enviando notificación de upgrade', { err }));

    logger.info('Level upgrade ejecutado', {
      memberId,
      from: currentLevelName,
      to: targetLevel,
      visits: membership.totalVisits,
    });

    return true;
  }

  async getMembershipDetails(memberId: string) {
    const membership = await prisma.membership.findUnique({
      where: { memberId },
      include: {
        level: {
          include: {
            levelBenefits: {
              include: { benefit: true },
              where: { benefit: { isActive: true } },
            },
          },
        },
      },
    });
    if (!membership) throw new NotFoundError('Membresía');

    const [premiumThreshold, goldenThreshold] = await Promise.all([
      configService.getNumber('PREMIUM_VISITS_THRESHOLD', 10),
      configService.getNumber('GOLDEN_VISITS_THRESHOLD', 25),
    ]);

    const currentLevel = membership.level.name as LevelName;
    let visitsToNextLevel: number | null = null;
    let nextLevel: string | null = null;

    if (currentLevel === LevelName.ESTANDAR) {
      visitsToNextLevel = Math.max(0, premiumThreshold - membership.totalVisits);
      nextLevel = LevelName.PREMIUM;
    } else if (currentLevel === LevelName.PREMIUM) {
      visitsToNextLevel = Math.max(0, goldenThreshold - membership.totalVisits);
      nextLevel = LevelName.GOLDEN;
    }

    return {
      ...membership,
      progress: {
        currentVisits: membership.totalVisits,
        visitsToNextLevel,
        nextLevel,
      },
    };
  }

  async getLevels() {
    return prisma.level.findMany({
      where: { isActive: true },
      include: {
        levelBenefits: {
          include: { benefit: true },
          where: { benefit: { isActive: true } },
        },
      },
      orderBy: { minVisits: 'asc' },
    });
  }
}

export const membershipService = new MembershipService();
