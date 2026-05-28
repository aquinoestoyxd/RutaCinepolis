import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UserRole } from '../types/enums';
import { UnauthorizedError } from '../utils/errorTypes';

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  memberId?: string;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de acceso requerido'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      memberId: payload.memberId,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Token expirado'));
    }
    return next(new UnauthorizedError('Token inválido'));
  }
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      memberId: payload.memberId,
    };
  } catch {
    // Token inválido — request continúa sin usuario autenticado
  }
  next();
}
