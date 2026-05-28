import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errorTypes';

type RequestSection = 'body' | 'params' | 'query';

export function validate(schema: ZodSchema, section: RequestSection = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[section]);
      (req as Record<string, unknown>)[section] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors: Record<string, string[]> = {};
        error.errors.forEach(e => {
          const field = e.path.join('.') || 'value';
          errors[field] = errors[field] ?? [];
          errors[field].push(e.message);
        });
        return next(new ValidationError('Datos de entrada inválidos', errors));
      }
      next(error);
    }
  };
}

export function validateBody(schema: ZodSchema) {
  return validate(schema, 'body');
}

export function validateParams(schema: ZodSchema) {
  return validate(schema, 'params');
}

export function validateQuery(schema: ZodSchema) {
  return validate(schema, 'query');
}
