import rateLimit from 'express-rate-limit';
import { env, isProduction } from '../../config/env';
import { ResponseHelper } from '../utils/apiResponse';

// Rate limiters are only enforced in production.
// In development they skip to avoid blocking the admin during testing.
const skipInDev = () => !isProduction;

export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  handler: (_req, res) => {
    ResponseHelper.error(
      res,
      'Demasiadas solicitudes. Por favor espere antes de intentar de nuevo.',
      429,
    );
  },
});

// authLimiter siempre activo: protege contra fuerza bruta en login.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => {
    ResponseHelper.error(
      res,
      'Demasiados intentos de autenticación. Intente en 15 minutos.',
      429,
    );
  },
});

export const posLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.POS_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  handler: (_req, res) => {
    ResponseHelper.error(
      res,
      'Límite de solicitudes POS excedido.',
      429,
    );
  },
});

export const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  handler: (_req, res) => {
    ResponseHelper.error(
      res,
      'Límite de generación de reportes excedido.',
      429,
    );
  },
});
