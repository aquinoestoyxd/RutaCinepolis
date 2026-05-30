import { Router } from 'express';
import { posController } from './pos.controller';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import { requireCajero, requireAdmin } from '../../shared/middleware/rbac.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { posTransactionSchema, posOfflineSyncSchema, posLookupSchema } from './pos.schema';
import { posLimiter } from '../../shared/middleware/rateLimiter.middleware';

const router = Router();

router.use(authenticate, posLimiter);

router.post('/lookup', requireCajero, validateBody(posLookupSchema), posController.lookup.bind(posController));
router.post('/transaction', requireCajero, validateBody(posTransactionSchema), posController.processTransaction.bind(posController));
router.post('/sync', requireCajero, validateBody(posOfflineSyncSchema), posController.syncOffline.bind(posController));
router.get('/queue', requireAdmin, posController.getPendingQueue.bind(posController));

export default router;
