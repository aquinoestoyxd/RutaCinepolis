import { Router } from 'express';
import { promotionsController } from './promotions.controller';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import { requireAdmin } from '../../shared/middleware/rbac.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { createPromotionSchema, updatePromotionSchema } from './promotions.schema';

const router = Router();

router.get('/', promotionsController.findAll.bind(promotionsController));
router.get('/:id', promotionsController.findById.bind(promotionsController));

router.post('/', authenticate, requireAdmin, validateBody(createPromotionSchema), promotionsController.create.bind(promotionsController));
router.put('/:id', authenticate, requireAdmin, validateBody(updatePromotionSchema), promotionsController.update.bind(promotionsController));
router.delete('/:id', authenticate, requireAdmin, promotionsController.deactivate.bind(promotionsController));

export default router;
