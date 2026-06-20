import { Router } from 'express';
import { reportsController } from './reports.controller';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import { requireAdmin } from '../../shared/middleware/rbac.middleware';
import { reportLimiter } from '../../shared/middleware/rateLimiter.middleware';

const router = Router();

router.use(authenticate, requireAdmin, reportLimiter);

router.get('/kpi', reportsController.getKpiDashboard.bind(reportsController));
router.get('/member-growth', reportsController.getMemberGrowth.bind(reportsController));
router.get('/transactions', reportsController.getTransactions.bind(reportsController));
router.get('/merchandise-stock', reportsController.getMerchandiseStock.bind(reportsController));

export default router;
