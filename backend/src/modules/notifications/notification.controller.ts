import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { ResponseHelper } from '../../shared/utils/apiResponse';
import { getPagination } from '../../shared/utils/pagination';

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notificaciones del miembro (RC-F08)
 */
export class NotificationController {
  async getMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = getPagination(req);
      const onlyUnread = req.query.unread === 'true';
      const result = await notificationService.getForMember(req.user!.memberId!, onlyUnread, page, limit);
      ResponseHelper.paginated(res, result.notifications, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await notificationService.getUnreadCount(req.user!.memberId!);
      ResponseHelper.success(res, { count });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markAsRead(req.params.id, req.user!.memberId!);
      ResponseHelper.success(res, null, 'Notificacion marcada como leida');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await notificationService.markAllAsRead(req.user!.memberId!);
      ResponseHelper.success(res, null, 'Todas las notificaciones marcadas como leidas');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
