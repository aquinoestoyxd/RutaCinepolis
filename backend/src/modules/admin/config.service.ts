import { prisma } from '../../config/database';
import { AuditAction } from '../../shared/types/enums';
import { NotFoundError } from '../../shared/utils/errorTypes';
import { logger } from '../../shared/utils/logger';

export class ConfigService {
  private cache = new Map<string, { value: string; expiresAt: number }>();
  private readonly TTL_MS = 5 * 60 * 1000; // 5 min cache

  async get(key: string, defaultValue?: string): Promise<string | undefined> {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    try {
      const config = await prisma.systemConfig.findUnique({ where: { key } });
      if (config) {
        this.cache.set(key, { value: config.value, expiresAt: Date.now() + this.TTL_MS });
        return config.value;
      }
    } catch (err) {
      logger.warn(`Error leyendo config ${key}`, { err });
    }

    return defaultValue;
  }

  async getNumber(key: string, defaultValue: number): Promise<number> {
    const value = await this.get(key);
    if (value === undefined) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  async getBoolean(key: string, defaultValue: boolean): Promise<boolean> {
    const value = await this.get(key);
    if (value === undefined) return defaultValue;
    return value === 'true' || value === '1';
  }

  async set(key: string, value: string, adminId: string, description?: string): Promise<void> {
    const existing = await prisma.systemConfig.findUnique({ where: { key } });

    await prisma.$transaction(async (tx) => {
      await tx.systemConfig.upsert({
        where: { key },
        create: { key, value, description, updatedBy: adminId },
        update: { value, updatedBy: adminId, ...(description ? { description } : {}) },
      });

      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.CONFIG_CHANGE,
          entity: 'SystemConfig',
          entityId: key,
          oldValue: existing ? { value: existing.value } : undefined,
          newValue: { value },
        },
      });
    });

    this.cache.delete(key);
  }

  async getAll() {
    return prisma.systemConfig.findMany({ orderBy: { key: 'asc' } });
  }

  async delete(key: string, adminId: string): Promise<void> {
    const existing = await prisma.systemConfig.findUnique({ where: { key } });
    if (!existing) throw new NotFoundError('Configuración');

    await prisma.$transaction(async (tx) => {
      await tx.systemConfig.delete({ where: { key } });
      await tx.auditLog.create({
        data: {
          userId: adminId,
          action: AuditAction.DELETE,
          entity: 'SystemConfig',
          entityId: key,
          oldValue: { key, value: existing.value },
        },
      });
    });

    this.cache.delete(key);
  }
}

export const configService = new ConfigService();
