import { prisma } from '../../config/database';
import { NotificationType } from '../../shared/types/enums';

interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
}

export class NotificationService {
  async create(memberId: string, params: CreateNotificationParams) {
    return prisma.notification.create({
      data: {
        memberId,
        type: params.type,
        title: params.title,
        message: params.message,
      },
    });
  }

  async getForMember(memberId: string, onlyUnread = false, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { memberId, ...(onlyUnread ? { isRead: false } : {}) };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total, page, limit };
  }

  async markAsRead(id: string, memberId: string) {
    return prisma.notification.updateMany({
      where: { id, memberId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(memberId: string) {
    return prisma.notification.updateMany({
      where: { memberId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUnreadCount(memberId: string): Promise<number> {
    return prisma.notification.count({ where: { memberId, isRead: false } });
  }
}

export const notificationService = new NotificationService();
