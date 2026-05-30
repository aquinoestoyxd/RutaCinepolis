import { Router } from 'express';
import { merchandiseController } from './merchandise.controller';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import { requireAdmin, requireCajero } from '../../shared/middleware/rbac.middleware';

const router = Router();

router.get('/', authenticate, merchandiseController.findAll.bind(merchandiseController));

router.post('/deliver', authenticate, requireCajero, merchandiseController.deliver.bind(merchandiseController));

router.get('/:memberId/history', authenticate, requireCajero, merchandiseController.getDeliveryHistory.bind(merchandiseController));

router.patch('/:id/stock', authenticate, requireAdmin, merchandiseController.updateStock.bind(merchandiseController));

export default router;
