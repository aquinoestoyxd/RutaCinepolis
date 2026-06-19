import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { UnauthorizedError } from '../utils/errorTypes';

interface MemberJwtPayload {
  memberId: string;
  type: 'member';
}

export function authenticateMember(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de acceso de miembro requerido'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as MemberJwtPayload;
    if (payload.type !== 'member' || !payload.memberId) {
      return next(new UnauthorizedError('Token de miembro inválido'));
    }
    req.user = {
      id: '',
      email: '',
      role: 'CLIENTE' as any,
      memberId: payload.memberId,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Token de miembro expirado'));
    }
    return next(new UnauthorizedError('Token de miembro inválido'));
  }
}
