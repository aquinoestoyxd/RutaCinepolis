import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { ResponseHelper } from '../utils/apiResponse';
import { AppError, ValidationError } from '../utils/errorTypes';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    requestId: req.requestId,
  });

  if (err instanceof ValidationError) {
    return ResponseHelper.badRequest(res, err.message, err.errors);
  }

  if (err instanceof AppError) {
    return ResponseHelper.error(res, err.message, err.statusCode);
  }

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach(e => {
      const field = e.path.join('.');
      errors[field] = errors[field] ?? [];
      errors[field].push(e.message);
    });
    return ResponseHelper.badRequest(res, 'Datos de entrada inválidos', errors);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = (err.meta?.target as string[])?.join(', ') ?? 'campo';
      return ResponseHelper.conflict(res, `El ${field} ya está registrado`);
    }
    if (err.code === 'P2025') {
      return ResponseHelper.notFound(res);
    }
    logger.error('Prisma error', { code: err.code, meta: err.meta });
    return ResponseHelper.error(res, 'Error de base de datos', 500);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error('Prisma validation error', { message: err.message });
    return ResponseHelper.error(res, 'Error de validación en base de datos', 500);
  }

  return ResponseHelper.error(res, 'Error interno del servidor', 500);
}

export function notFoundHandler(req: Request, res: Response): Response {
  return ResponseHelper.notFound(res, `Ruta ${req.method} ${req.originalUrl} no encontrada`);
}
