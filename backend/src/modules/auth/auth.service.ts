import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { UserRole, AuditAction } from '../../shared/types/enums';
import { UnauthorizedError, NotFoundError } from '../../shared/utils/errorTypes';
import { logger } from '../../shared/utils/logger';
import type { LoginDto, ChangePasswordDto } from './auth.schema';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface AuthResult {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
  tokens: TokenPair;
}

export class AuthService {
  async login(dto: LoginDto, ipAddress?: string): Promise<AuthResult> {
    // Solo CAJERO y ADMINISTRADOR tienen cuentas en users
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) {
      logger.warn('Intento de login fallido', { email: dto.email, ip: ipAddress });
      throw new UnauthorizedError('Credenciales inválidas');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: AuditAction.LOGIN,
        entity: 'User',
        entityId: user.id,
        ipAddress,
      },
    });

    const tokens = this.generateTokens(user.id, user.email, user.role as UserRole);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role as UserRole,
      },
      tokens,
    };
  }

  async refreshToken(token: string): Promise<TokenPair> {
    try {
      const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
        id: string;
        email: string;
        role: UserRole;
      };

      const user = await prisma.user.findUnique({ where: { id: payload.id } });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Usuario no válido');
      }

      return this.generateTokens(user.id, user.email, user.role as UserRole);
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error;
      throw new UnauthorizedError('Refresh token inválido o expirado');
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Usuario');

    const match = await bcrypt.compare(dto.currentPassword, user.password);
    if (!match) throw new UnauthorizedError('Contraseña actual incorrecta');

    const hashed = await bcrypt.hash(dto.newPassword, env.BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.UPDATE,
        entity: 'User',
        entityId: userId,
        newValue: { action: 'password_changed' },
      },
    });
  }

  async logout(userId: string, ipAddress?: string): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId,
        action: AuditAction.LOGOUT,
        entity: 'User',
        entityId: userId,
        ipAddress,
      },
    });
  }

  private generateTokens(id: string, email: string, role: UserRole): TokenPair {
    const payload = { id, email, role };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken, expiresIn: env.JWT_EXPIRES_IN };
  }
}

export const authService = new AuthService();
