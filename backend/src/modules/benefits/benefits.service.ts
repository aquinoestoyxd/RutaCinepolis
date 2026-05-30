import { prisma } from '../../config/database';
import { AuditAction } from '../../shared/types/enums';
import { NotFoundError } from '../../shared/utils/errorTypes';
import type { CreateBenefitDto, UpdateBenefitDto } from './benefits.schema';

export class BenefitsService {
  async create(dto: CreateBenefitDto, adminId: string) {
    const { levelIds, ...benefitData } = dto;

    const benefit = await prisma.$transaction(async (tx) => {
      const created = await tx.benefit.create({
        data: {
          ...benefitData,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        },
      });

      await tx.levelBenefit.createMany({
        data: levelIds.map(levelId => ({ levelId, benefitId: created.id })),
        skipDuplicates: true,
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.CREATE,
          entity: 'Benefit',
          entityId: created.id,
          newValue: { name: dto.name, type: dto.type },
        },
      });

      return created;
    });

    return this.findById(benefit.id);
  }

  async findAll(levelName?: string) {
    return prisma.benefit.findMany({
      where: {
        isActive: true,
        ...(levelName
          ? { levelBenefits: { some: { level: { name: { equals: levelName as never } } } } }
          : {}),
      },
      include: {
        levelBenefits: { include: { level: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const benefit = await prisma.benefit.findUnique({
      where: { id },
      include: { levelBenefits: { include: { level: true } } },
    });
    if (!benefit) throw new NotFoundError('Beneficio');
    return benefit;
  }

  async update(id: string, dto: UpdateBenefitDto, adminId: string) {
    const existing = await prisma.benefit.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Beneficio');

    const { levelIds, ...benefitData } = dto;

    await prisma.$transaction(async (tx) => {
      await tx.benefit.update({
        where: { id },
        data: {
          ...benefitData,
          validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        },
      });

      if (levelIds) {
        await tx.levelBenefit.deleteMany({ where: { benefitId: id } });
        await tx.levelBenefit.createMany({
          data: levelIds.map(levelId => ({ levelId, benefitId: id })),
        });
      }

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.UPDATE,
          entity: 'Benefit',
          entityId: id,
          oldValue: { name: existing.name },
          newValue: benefitData as never,
        },
      });
    });

    return this.findById(id);
  }

  async deactivate(id: string, adminId: string) {
    const existing = await prisma.benefit.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Beneficio');

    await prisma.$transaction(async (tx) => {
      await tx.benefit.update({ where: { id }, data: { isActive: false } });
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.DELETE,
          entity: 'Benefit',
          entityId: id,
          oldValue: { isActive: true },
          newValue: { isActive: false },
        },
      });
    });
  }
}

export const benefitsService = new BenefitsService();
