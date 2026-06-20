import { Router } from 'express';
import { membershipController } from './membership.controller';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import { requireCajero } from '../../shared/middleware/rbac.middleware';

const router = Router();

router.get('/levels', membershipController.getLevels.bind(membershipController));

router.get('/my', authenticate, membershipController.getMyMembership.bind(membershipController));

router.get(
  '/:memberId',
  authenticate,
  requireCajero,
  membershipController.getMemberMembership.bind(membershipController),
);

export default router;
