import { Router } from 'express';
import { pointsController } from './points.controller';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import { requireAdmin, requireCajero } from '../../shared/middleware/rbac.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { earnPointsSchema, adjustPointsSchema } from './points.schema';

const router = Router();

router.post('/earn', authenticate, requireCajero, validateBody(earnPointsSchema), pointsController.earn.bind(pointsController));

router.get('/my-balance', authenticate, pointsController.getBalance.bind(pointsController));
router.get('/my-history', authenticate, pointsController.getHistory.bind(pointsController));

router.get('/:memberId/balance', authenticate, requireCajero, pointsController.getBalance.bind(pointsController));
router.get('/:memberId/history', authenticate, requireCajero, pointsController.getHistory.bind(pointsController));

router.post(
  '/:memberId/adjust',
  authenticate,
  requireAdmin,
  validateBody(adjustPointsSchema),
  pointsController.adjust.bind(pointsController),
);

export default router;
