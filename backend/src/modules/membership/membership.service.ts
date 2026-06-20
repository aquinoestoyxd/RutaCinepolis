import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { LevelName, NotificationType, AuditAction } from '../../shared/types/enums';
import { NotFoundError } from '../../shared/utils/errorTypes';
import { logger } from '../../shared/utils/logger';
import { notificationService } from '../notifications/notification.service';
import { configService } from '../admin/config.service';
import { merchandiseService } from '../merchandise/merchandise.service';

export interface MembershipProgress {
  currentVisits: number;
  visitsToNextLevel: number | null;
  nextLevel: LevelName | null;
  nextLevelDisplayName: string | null;
  requiredVisits: number | null;
  percentage: number;
  isMaxLevel: boolean;
  isNearUpgrade: boolean;
}

export class MembershipService {
  /**
   * Verifica y ejecuta upgrade automatico de nivel (RC-F06, CU-05).
   * Criterio: cantidad de visitas alcanza el umbral configurado.
   */
  async checkAndUpgradeLevel(memberId: string, staffId?: string): Promise<boolean> {
    const membership = await prisma.membership.findUnique({
      where: { memberId },
      include: { level: true, member: true },
    });
    if (!membership) return false;

    const currentLevelName = membership.level.name as LevelName;
    if (currentLevelName === LevelName.GOLDEN) return false;

    const { premiumThreshold, goldenThreshold } = await this.getLevelThresholds();

    let targetLevel: LevelName | null = null;
    if (currentLevelName === LevelName.PREMIUM && membership.totalVisits >= goldenThreshold) {
      targetLevel = LevelName.GOLDEN;
    } else if (currentLevelName === LevelName.ESTANDAR && membership.totalVisits >= premiumThreshold) {
      targetLevel = LevelName.PREMIUM;
    }

    if (!targetLevel) {
      return false;
    }

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

      await notificationService.createWithinTx(tx, memberId, {
        type: NotificationType.LEVEL_UPGRADE,
        title: `!Felicidades! Ahora eres miembro ${newLevel.displayName}`,
        message: `Has alcanzado el nivel ${newLevel.displayName} con ${membership.totalVisits} visitas. !Disfruta tus nuevos beneficios!`,
      });
    });

    if (targetLevel === LevelName.GOLDEN && staffId) {
      await merchandiseService.autoDeliverGoldenKit(memberId, staffId)
        .catch(err => logger.warn('Error en entrega automatica de kit Golden en upgrade', { err, memberId }));
    }

    logger.info('Level upgrade ejecutado', {
      memberId,
      from: currentLevelName,
      to: targetLevel,
      visits: membership.totalVisits,
    });

    return true;
  }

  async notifyLevelProgressIfNeeded(memberId: string): Promise<boolean> {
    const membership = await prisma.membership.findUnique({
      where: { memberId },
      include: { level: true },
    });
    if (!membership) return false;

    const progress = await this.buildProgress(
      membership.totalVisits,
      membership.level.name as LevelName,
    );

    if (
      progress.isMaxLevel ||
      !progress.isNearUpgrade ||
      !progress.visitsToNextLevel ||
      !progress.nextLevelDisplayName
    ) {
      return false;
    }

    const title = `Estas cerca de llegar a ${progress.nextLevelDisplayName}`;
    const message = progress.visitsToNextLevel === 1
      ? `Te falta 1 visita para subir a ${progress.nextLevelDisplayName}.`
      : `Te faltan ${progress.visitsToNextLevel} visitas para subir a ${progress.nextLevelDisplayName}.`;

    await notificationService.upsertLevelProgress(memberId, title, message);
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
    if (!membership) throw new NotFoundError('Membresia');

    const progress = await this.buildProgress(
      membership.totalVisits,
      membership.level.name as LevelName,
    );

    return {
      ...membership,
      progress,
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

  async getProgressForMember(memberId: string): Promise<MembershipProgress> {
    const membership = await prisma.membership.findUnique({
      where: { memberId },
      include: { level: true },
    });
    if (!membership) throw new NotFoundError('Membresia');

    return this.buildProgress(membership.totalVisits, membership.level.name as LevelName);
  }

  private async buildProgress(totalVisits: number, currentLevel: LevelName): Promise<MembershipProgress> {
    const { premiumThreshold, goldenThreshold, noticeWindow } = await this.getLevelThresholds();

    let requiredVisits: number | null = null;
    let nextLevel: LevelName | null = null;
    let nextLevelDisplayName: string | null = null;

    if (currentLevel === LevelName.ESTANDAR) {
      requiredVisits = premiumThreshold;
      nextLevel = LevelName.PREMIUM;
      nextLevelDisplayName = 'Premium';
    } else if (currentLevel === LevelName.PREMIUM) {
      requiredVisits = goldenThreshold;
      nextLevel = LevelName.GOLDEN;
      nextLevelDisplayName = 'Golden';
    }

    if (!requiredVisits || !nextLevel) {
      return {
        currentVisits: totalVisits,
        visitsToNextLevel: null,
        nextLevel: null,
        nextLevelDisplayName: null,
        requiredVisits: null,
        percentage: 100,
        isMaxLevel: true,
        isNearUpgrade: false,
      };
    }

    const visitsToNextLevel = Math.max(0, requiredVisits - totalVisits);
    const percentage = Math.min(Math.round((totalVisits / requiredVisits) * 100), 100);

    return {
      currentVisits: totalVisits,
      visitsToNextLevel,
      nextLevel,
      nextLevelDisplayName,
      requiredVisits,
      percentage,
      isMaxLevel: false,
      isNearUpgrade: visitsToNextLevel > 0 && visitsToNextLevel <= noticeWindow,
    };
  }

  private async getLevelThresholds() {
    const [premiumThreshold, goldenThreshold, noticeWindow] = await Promise.all([
      configService.getNumber('PREMIUM_VISITS_THRESHOLD', 10),
      configService.getNumber('GOLDEN_VISITS_THRESHOLD', 25),
      configService.getNumber('LEVEL_UPGRADE_NOTICE_VISITS', 2),
    ]);

    return {
      premiumThreshold,
      goldenThreshold,
      noticeWindow: Math.max(0, noticeWindow),
    };
  }
}

export const membershipService = new MembershipService();
