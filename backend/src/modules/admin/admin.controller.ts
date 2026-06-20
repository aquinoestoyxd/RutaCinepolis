import { Request, Response, NextFunction } from 'express';
import { adminService } from './admin.service';
import { configService } from './config.service';
import { ResponseHelper } from '../../shared/utils/apiResponse';
import { getPagination } from '../../shared/utils/pagination';
import type { UpsertConfigDto, CreateAdminUserDto } from './admin.schema';

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Panel de administración y configuración del sistema (RC-F24)
 */
export class AdminController {
  async getAllConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const configs = await configService.getAll();
      ResponseHelper.success(res, configs);
    } catch (error) {
      next(error);
    }
  }

  async upsertConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as UpsertConfigDto;
      await configService.set(req.params.key, dto.value, req.user!.id, dto.description);
      ResponseHelper.success(res, null, 'Configuración actualizada');
    } catch (error) {
      next(error);
    }
  }

  async deleteConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await configService.delete(req.params.key, req.user!.id);
      ResponseHelper.noContent(res);
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = getPagination(req);
      const { action, entity, userId, from, to } = req.query as Record<string, string>;
      const result = await adminService.getAuditLogs(page, limit, { action, entity, userId, from, to });
      ResponseHelper.paginated(res, result.logs, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async createStaffUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await adminService.createStaffUser(req.body as CreateAdminUserDto, req.user!.id);
      ResponseHelper.created(res, user, 'Usuario de staff creado');
    } catch (error) {
      next(error);
    }
  }

  async getStaffUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await adminService.getStaffUsers();
      ResponseHelper.success(res, users);
    } catch (error) {
      next(error);
    }
  }

  async toggleUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await adminService.toggleUserStatus(req.params.userId, req.user!.id);
      ResponseHelper.success(res, result, `Usuario ${result.isActive ? 'activado' : 'desactivado'}`);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
