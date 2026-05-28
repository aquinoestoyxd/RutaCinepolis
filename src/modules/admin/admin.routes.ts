import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import { requireAdmin } from '../../shared/middleware/rbac.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { upsertConfigSchema, createAdminUserSchema } from './admin.schema';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/config', adminController.getAllConfig.bind(adminController));
router.put('/config/:key', validateBody(upsertConfigSchema), adminController.upsertConfig.bind(adminController));
router.delete('/config/:key', adminController.deleteConfig.bind(adminController));

router.get('/audit-logs', adminController.getAuditLogs.bind(adminController));

router.get('/staff', adminController.getStaffUsers.bind(adminController));
router.post('/staff', validateBody(createAdminUserSchema), adminController.createStaffUser.bind(adminController));
router.patch('/staff/:userId/toggle-status', adminController.toggleUserStatus.bind(adminController));

export default router;
