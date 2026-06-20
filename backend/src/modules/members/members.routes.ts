import { Router } from 'express';
import { membersController } from './members.controller';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import { requireAdmin, requireCajero } from '../../shared/middleware/rbac.middleware';
import { validateBody, validateParams, validateQuery } from '../../shared/middleware/validate.middleware';
import {
  registerMemberSchema,
  updateMemberSchema,
  memberIdParamSchema,
  memberStatusSchema,
  searchMembersSchema,
} from './members.schema';

const router = Router();

// Registro solo por cajero (presencial en taquilla)
router.post(
  '/register',
  authenticate,
  requireCajero,
  validateBody(registerMemberSchema),
  membersController.register.bind(membersController),
);

// Consulta por tarjeta — usada por app Cinépolis y cajero
router.get('/card/:cardNumber', membersController.findByCard.bind(membersController));

// Dashboard consolidado para el panel de miembros
router.get('/dashboard/:cardNumber', membersController.getDashboard.bind(membersController));

// Historial de actividad del miembro (puntos y canjes)
router.get('/history/:cardNumber', membersController.getHistory.bind(membersController));

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
  membersController.findById.bind(membersController),
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validateParams(memberIdParamSchema),
  validateBody(updateMemberSchema),
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
