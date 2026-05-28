import { Router } from 'express';
import { membersController } from './members.controller';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import { requireAdmin, requireCajero, requireOwnerOrAdmin } from '../../shared/middleware/rbac.middleware';
import { validateBody, validateParams, validateQuery } from '../../shared/middleware/validate.middleware';
import {
  registerMemberSchema,
  updateMemberSchema,
  memberIdParamSchema,
  memberStatusSchema,
  searchMembersSchema,
} from './members.schema';

const router = Router();

router.post('/register', validateBody(registerMemberSchema), membersController.register.bind(membersController));

router.get('/me', authenticate, membersController.getMyProfile.bind(membersController));

router.get(
  '/card/:cardNumber',
  authenticate,
  requireCajero,
  membersController.findByCard.bind(membersController),
);

router.get(
  '/',
  authenticate,
  requireAdmin,
  validateQuery(searchMembersSchema),
  membersController.findAll.bind(membersController),
);

router.get(
  '/:id',
  authenticate,
  validateParams(memberIdParamSchema),
  requireOwnerOrAdmin(req => req.user?.memberId),
  membersController.findById.bind(membersController),
);

router.put(
  '/:id',
  authenticate,
  validateParams(memberIdParamSchema),
  validateBody(updateMemberSchema),
  requireOwnerOrAdmin(req => req.user?.memberId),
  membersController.update.bind(membersController),
);

router.patch(
  '/:id/status',
  authenticate,
  requireAdmin,
  validateParams(memberIdParamSchema),
  validateBody(memberStatusSchema),
  membersController.updateStatus.bind(membersController),
);

export default router;
