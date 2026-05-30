import { Router } from 'express';
import { benefitsController } from './benefits.controller';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import { requireAdmin } from '../../shared/middleware/rbac.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { createBenefitSchema, updateBenefitSchema } from './benefits.schema';

const router = Router();

router.get('/', benefitsController.findAll.bind(benefitsController));
router.get('/:id', benefitsController.findById.bind(benefitsController));

router.post('/', authenticate, requireAdmin, validateBody(createBenefitSchema), benefitsController.create.bind(benefitsController));
router.put('/:id', authenticate, requireAdmin, validateBody(updateBenefitSchema), benefitsController.update.bind(benefitsController));
router.delete('/:id', authenticate, requireAdmin, benefitsController.deactivate.bind(benefitsController));

export default router;
