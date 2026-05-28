import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../shared/middleware/authenticate.middleware';

const router = Router();

router.get('/', authenticate, notificationController.getMyNotifications.bind(notificationController));
router.get('/unread-count', authenticate, notificationController.getUnreadCount.bind(notificationController));
router.patch('/:id/read', authenticate, notificationController.markAsRead.bind(notificationController));
router.patch('/read-all', authenticate, notificationController.markAllAsRead.bind(notificationController));

export default router;
