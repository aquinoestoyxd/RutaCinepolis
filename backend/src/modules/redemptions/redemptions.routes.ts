import { Router } from 'express';
import { redemptionsController } from './redemptions.controller';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import { requireCajero } from '../../shared/middleware/rbac.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { redeemBenefitSchema } from './redemptions.schema';

const router = Router();

router.post('/', authenticate, requireCajero, validateBody(redeemBenefitSchema), redemptionsController.redeem.bind(redemptionsController));

router.get('/my-history', authenticate, redemptionsController.getMyHistory.bind(redemptionsController));

router.get('/:memberId/history', authenticate, requireCajero, redemptionsController.getMemberHistory.bind(redemptionsController));

export default router;
