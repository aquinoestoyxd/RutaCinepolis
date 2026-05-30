import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { LevelName, AuditAction, NotificationType } from '../../shared/types/enums';
import { ConflictError, NotFoundError } from '../../shared/utils/errorTypes';
import { generateCardNumber } from '../../shared/utils/cardGenerator';
import { getPagination, buildOrderBy } from '../../shared/utils/pagination';
import { logger } from '../../shared/utils/logger';
import { notificationService } from '../notifications/notification.service';
import { merchandiseService } from '../merchandise/merchandise.service';
import type { RegisterMemberDto, UpdateMemberDto, MemberStatusDto, SearchMembersQuery } from './members.schema';
import type { Request } from 'express';

export class MembersService {
  /**
   * El cajero registra al miembro presencialmente y elige el nivel (CU-01).
   * No se crea cuenta de usuario — el miembro usa la app Cinépolis con su tarjeta.
   */
  async register(dto: RegisterMemberDto, cajeroId: string, cajeroEmail: string) {
    const existingDni = await prisma.member.findUnique({ where: { dni: dto.dni } });
    if (existingDni) throw new ConflictError('El DNI ya está registrado');

    if (dto.email) {
      const existingEmail = await prisma.member.findUnique({ where: { email: dto.email } });
      if (existingEmail) throw new ConflictError('El correo electrónico ya está registrado');
    }

    const level = await prisma.level.findUnique({ where: { id: dto.levelId } });
    if (!level) throw new NotFoundError('Nivel de membresía');

    const cardNumber = await this.generateUniqueCardNumber();

    const result = await prisma.$transaction(async (tx) => {
      const member = await tx.member.create({
        data: {
          dni: dto.dni,
          firstName: dto.firstName,
          lastName: dto.lastName,
          ...(dto.email ? { email: dto.email } : {}),
          ...(dto.phone ? { phone: dto.phone } : {}),
          ...(dto.birthDate ? { birthDate: new Date(dto.birthDate) } : {}),
          cardNumber,
          registeredBy: cajeroEmail,
        },
      });

      await tx.membership.create({
        data: {
          memberId: member.id,
          levelId: dto.levelId,
          points: 0,
          totalVisits: 0,
          totalSpent: 0,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: cajeroId,
          action: AuditAction.CREATE,
          entity: 'Member',
          entityId: member.id,
          newValue: { dni: dto.dni, level: level.name, registeredBy: cajeroEmail } as Prisma.InputJsonValue,
        },
      });

      return member;
    });

    await notificationService.create(result.id, {
      type: NotificationType.WELCOME,
      title: `¡Bienvenido a Ruta Cinépolis, ${dto.firstName}!`,
      message: `Tu tarjeta RC es ${cardNumber}. Nivel: ${level.displayName}. ¡Disfruta tus beneficios!`,
    }).catch(() => {});

    if (level.name === LevelName.GOLDEN) {
      await merchandiseService.autoDeliverGoldenKit(result.id, cajeroId)
        .catch(err => logger.warn('Error en entrega automática de kit Golden al registrar', { err, memberId: result.id }));
    }

    return this.findById(result.id);
  }

  async findById(id: string) {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        membership: {
          include: {
            level: {
              include: { levelBenefits: { include: { benefit: true } } },
            },
          },
        },
      },
    });
    if (!member) throw new NotFoundError('Miembro');
    return member;
  }

  async findByCardNumber(cardNumber: string) {
    const member = await prisma.member.findUnique({
      where: { cardNumber },
      include: { membership: { include: { level: true } } },
    });
    if (!member) throw new NotFoundError('Miembro');
    return member;
  }

  async findByDni(dni: string) {
    const member = await prisma.member.findUnique({
      where: { dni },
      include: { membership: { include: { level: true } } },
    });
    if (!member) throw new NotFoundError('Miembro');
    return member;
  }

  async findAll(query: SearchMembersQuery) {
    const { page, limit, skip } = getPagination({ query } as Request);
    const orderBy = buildOrderBy(
      query.sortBy,
      query.sortOrder,
      ['registeredAt', 'firstName', 'lastName'],
      'registeredAt',
    );

    const where: Prisma.MemberWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { dni: { contains: query.search } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { cardNumber: { contains: query.search } },
      ];
    }
    if (query.levelName) {
      where.membership = { level: { name: { equals: query.levelName as LevelName } } };
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where, skip, take: limit, orderBy,
        include: { membership: { include: { level: true } } },
      }),
      prisma.member.count({ where }),
    ]);

    return { members, total, page, limit };
  }

  async update(id: string, dto: UpdateMemberDto, requesterId: string) {
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) throw new NotFoundError('Miembro');

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.member.update({
        where: { id },
        data: {
          ...dto,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : dto.birthDate === null ? null : undefined,
        },
        include: { membership: { include: { level: true } } },
      });

      await tx.auditLog.create({
        data: {
          userId: requesterId,
          action: AuditAction.UPDATE,
          entity: 'Member',
          entityId: id,
          oldValue: { firstName: member.firstName, lastName: member.lastName } as Prisma.InputJsonValue,
          newValue: dto as Prisma.InputJsonValue,
        },
      });

      return result;
    });

    return updated;
  }

  async updateStatus(id: string, dto: MemberStatusDto, adminId: string) {
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) throw new NotFoundError('Miembro');

    await prisma.$transaction(async (tx) => {
      await tx.member.update({ where: { id }, data: { status: dto.status } });
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.UPDATE,
          entity: 'Member',
          entityId: id,
          oldValue: { status: member.status } as Prisma.InputJsonValue,
          newValue: { status: dto.status, reason: dto.reason } as Prisma.InputJsonValue,
        },
      });
    });
  }

  private async generateUniqueCardNumber(): Promise<string> {
    let attempts = 0;
    while (attempts < 10) {
      const cardNumber = generateCardNumber();
      const existing = await prisma.member.findUnique({ where: { cardNumber } });
      if (!existing) return cardNumber;
      attempts++;
    }
    throw new Error('No se pudo generar un número de tarjeta único');
  }
}

export const membersService = new MembersService();
