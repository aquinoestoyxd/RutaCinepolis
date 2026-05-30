import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/enums';
import { ForbiddenError, UnauthorizedError } from '../utils/errorTypes';

export function requireRoles(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('No autenticado'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Acceso denegado. Se requiere rol: ${roles.join(' o ')}`,
        ),
      );
    }
    next();
  };
}

export const requireAdmin = requireRoles(UserRole.ADMINISTRADOR);
export const requireCajero = requireRoles(UserRole.CAJERO, UserRole.ADMINISTRADOR);
export const requireCliente = requireRoles(UserRole.CLIENTE, UserRole.ADMINISTRADOR);

export function requireOwnerOrAdmin(getResourceOwnerId: (req: Request) => string | undefined) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('No autenticado'));
    }
    if (req.user.role === UserRole.ADMINISTRADOR) {
      return next();
    }
    const ownerId = getResourceOwnerId(req);
    if (req.user.memberId && ownerId === req.user.memberId) {
      return next();
    }
    return next(new ForbiddenError('Solo puedes acceder a tus propios recursos'));
  };
}
