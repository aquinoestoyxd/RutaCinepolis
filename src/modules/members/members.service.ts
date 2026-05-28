import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { UserRole, LevelName, AuditAction, NotificationType, MemberStatus } from '../../shared/types/enums';
import { ConflictError, NotFoundError } from '../../shared/utils/errorTypes';
import { generateCardNumber } from '../../shared/utils/cardGenerator';
import { getPagination, buildOrderBy } from '../../shared/utils/pagination';
import { notificationService } from '../notifications/notification.service';
import type { RegisterMemberDto, UpdateMemberDto, MemberStatusDto, SearchMembersQuery } from './members.schema';
import type { Request } from 'express';

export class MembersService {
  async register(dto: RegisterMemberDto) {
    const [existingDni, existingEmail] = await Promise.all([
      prisma.member.findUnique({ where: { dni: dto.dni } }),
      prisma.user.findUnique({ where: { email: dto.email } }),
    ]);

    if (existingDni) throw new ConflictError('El DNI ya está registrado');
    if (existingEmail) throw new ConflictError('El correo electrónico ya está registrado');

    const [estandarLevel] = await Promise.all([
      prisma.level.findUnique({ where: { name: LevelName.ESTANDAR } }),
    ]);
    if (!estandarLevel) throw new Error('Nivel Estándar no configurado. Ejecute el seed.');

    const hashedPassword = await bcrypt.hash(dto.password, env.BCRYPT_ROUNDS);
    const cardNumber = await this.generateUniqueCardNumber();

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          password: hashedPassword,
          role: UserRole.CLIENTE,
        },
      });

      const member = await tx.member.create({
        data: {
          userId: user.id,
          dni: dto.dni,
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
          cardNumber,
        },
        include: { membership: { include: { level: true } } },
      });

      await tx.membership.create({
        data: {
          memberId: member.id,
          levelId: estandarLevel.id,
          points: 0,
          totalVisits: 0,
          totalSpent: 0,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: AuditAction.CREATE,
          entity: 'Member',
          entityId: member.id,
          newValue: { dni: dto.dni, email: dto.email },
        },
      });

      return member;
    });

    await notificationService.create(result.id, {
      type: NotificationType.WELCOME,
      title: '¡Bienvenido a Ruta Cinépolis!',
      message: `Hola ${dto.firstName}, tu número de tarjeta es ${cardNumber}. ¡Disfruta tus beneficios!`,
    });

    return this.findById(result.id);
  }

  async findById(id: string) {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        membership: {
          include: {
            level: {
              include: {
                levelBenefits: { include: { benefit: true } },
              },
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
        where,
        skip,
        take: limit,
        orderBy,
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
          oldValue: { firstName: member.firstName, lastName: member.lastName },
          newValue: dto as Prisma.InputJsonValue,
        },
      });

      return result;
    });

    return updated;
  }

  async updateStatus(id: string, dto: MemberStatusDto, adminId: string) {
    const member = await prisma.member.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!member) throw new NotFoundError('Miembro');

    await prisma.$transaction(async (tx) => {
      await tx.member.update({
        where: { id },
        data: { status: dto.status },
      });

      await tx.user.update({
        where: { id: member.userId },
        data: { isActive: dto.status === MemberStatus.ACTIVE },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.UPDATE,
          entity: 'Member',
          entityId: id,
          oldValue: { status: member.status },
          newValue: { status: dto.status, reason: dto.reason },
        },
      });
    });
  }

  private async generateUniqueCardNumber(): Promise<string> {
    let cardNumber: string;
    let attempts = 0;
    do {
      cardNumber = generateCardNumber();
      const existing = await prisma.member.findUnique({ where: { cardNumber } });
      if (!existing) return cardNumber;
      attempts++;
    } while (attempts < 10);
    throw new Error('No se pudo generar un número de tarjeta único');
  }
}

export const membersService = new MembersService();
