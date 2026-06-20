import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { LevelName, AuditAction, NotificationType } from '../../shared/types/enums';
import { ConflictError, NotFoundError } from '../../shared/utils/errorTypes';
import { generateCardNumber } from '../../shared/utils/cardGenerator';
import { getPagination, buildOrderBy } from '../../shared/utils/pagination';
import { logger } from '../../shared/utils/logger';
import { env } from '../../config/env';
import jwt from 'jsonwebtoken';
import { notificationService } from '../notifications/notification.service';
import { merchandiseService } from '../merchandise/merchandise.service';
import { membershipService } from '../membership/membership.service';
import { pointsService } from '../points/points.service';
import { redemptionsService } from '../redemptions/redemptions.service';
import type { RegisterMemberDto, UpdateMemberDto, MemberStatusDto, SearchMembersQuery } from './members.schema';
import type { Request } from 'express';

export class MembersService {
  /**
   * El cajero registra al miembro presencialmente y elige el nivel (CU-01).
   * No se crea cuenta de usuario — el miembro usa la app Cinepolis con su tarjeta.
   */
  async register(dto: RegisterMemberDto, cajeroId: string, cajeroEmail: string) {
    const existingDni = await prisma.member.findUnique({ where: { dni: dto.dni } });
    if (existingDni) throw new ConflictError('El DNI ya esta registrado');

    if (dto.email) {
      const existingEmail = await prisma.member.findUnique({ where: { email: dto.email } });
      if (existingEmail) throw new ConflictError('El correo electronico ya esta registrado');
    }

    const level = await prisma.level.findUnique({ where: { id: dto.levelId } });
    if (!level) throw new NotFoundError('Nivel de membresia');

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
      title: `!Bienvenido a Ruta Cinepolis, ${dto.firstName}!`,
      message: `Tu tarjeta RC es ${cardNumber}. Nivel: ${level.displayName}. !Disfruta tus beneficios!`,
    }).catch(() => {});

    if (level.name === LevelName.GOLDEN) {
      await merchandiseService.autoDeliverGoldenKit(result.id, cajeroId)
        .catch(err => logger.warn('Error en entrega automatica de kit Golden al registrar', { err, memberId: result.id }));
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

  async getDashboardData(cardNumber: string) {
    const member = await prisma.member.findUnique({
      where: { cardNumber },
      include: {
        membership: {
          include: {
            level: {
              include: {
                levelBenefits: {
                  include: { benefit: true },
                },
              },
            },
          },
        },
      },
    });

    if (!member) throw new NotFoundError('Miembro con esta tarjeta no encontrado');

    const membership = member.membership!;
    const level = membership.level;

    const today = new Date();
    const defaultEndDate = new Date(today);
    defaultEndDate.setFullYear(defaultEndDate.getFullYear() + 1);

    const benefits = level.levelBenefits.map(lb => ({
      id: lb.benefit.id,
      level: level.name.toLowerCase(),
      title: lb.benefit.name,
      description: lb.benefit.description,
      startDate: lb.benefit.validFrom?.toISOString() ?? today.toISOString(),
      endDate: lb.benefit.validUntil?.toISOString() ?? defaultEndDate.toISOString(),
      active: lb.benefit.isActive,
    }));

    const now = new Date();
    const activePromotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });
    const promotions = activePromotions.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      image: p.imageUrl,
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
      terms: p.terms,
      restrictions: p.restrictions,
      active: p.isActive,
    }));

    const [progress, notificationResult, unreadCount] = await Promise.all([
      membershipService.getProgressForMember(member.id),
      notificationService.getForMember(member.id, false, 1, 8),
      notificationService.getUnreadCount(member.id),
    ]);

    const memberToken = this.generateMemberToken(member.id);

    return {
      user: {
        id: member.id,
        dni: member.dni,
        cardNumber: member.cardNumber,
        name: member.firstName,
        lastName: member.lastName,
        visits: membership.totalVisits,
        points: membership.points,
        level: level.name.toLowerCase(),
        email: member.email,
        since: member.registeredAt.toISOString(),
        status: member.status.toLowerCase(),
        progress,
      },
      benefits,
      promotions,
      notifications: notificationResult.notifications,
      unreadNotifications: unreadCount,
      memberToken,
    };
  }

  private generateMemberToken(memberId: string): string {
    return jwt.sign(
      { memberId, type: 'member' },
      env.JWT_SECRET,
      { expiresIn: '24h' },
    );
  }

  async getMemberHistory(cardNumber: string, page: number = 1, limit: number = 20) {
    const member = await prisma.member.findUnique({
      where: { cardNumber },
      select: { id: true },
    });
    if (!member) throw new NotFoundError('Miembro con esta tarjeta no encontrado');

    const [pointsResult, redemptionsResult] = await Promise.all([
      pointsService.getHistory(member.id, page, limit),
      redemptionsService.getHistory(member.id, page, limit),
    ]);

    return {
      points: pointsResult,
      redemptions: redemptionsResult,
    };
  }

  private async generateUniqueCardNumber(): Promise<string> {
    let attempts = 0;
    while (attempts < 10) {
      const cardNumber = generateCardNumber();
      const existing = await prisma.member.findUnique({ where: { cardNumber } });
      if (!existing) return cardNumber;
      attempts++;
    }
    throw new Error('No se pudo generar un numero de tarjeta unico');
  }
}

export const membersService = new MembersService();
