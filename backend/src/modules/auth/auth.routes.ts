import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../shared/middleware/authenticate.middleware';
import { validateBody } from '../../shared/middleware/validate.middleware';
import { authLimiter } from '../../shared/middleware/rateLimiter.middleware';
import { loginSchema, refreshTokenSchema, changePasswordSchema } from './auth.schema';

const router = Router();

router.post('/login', authLimiter, validateBody(loginSchema), authController.login.bind(authController));
router.post('/refresh', validateBody(refreshTokenSchema), authController.refresh.bind(authController));
router.post('/logout', authenticate, authController.logout.bind(authController));
router.put('/change-password', authenticate, validateBody(changePasswordSchema), authController.changePassword.bind(authController));
router.get('/me', authenticate, authController.me.bind(authController));

export default router;
