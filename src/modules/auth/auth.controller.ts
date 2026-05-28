import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { ResponseHelper } from '../../shared/utils/apiResponse';
import type { LoginDto, RefreshTokenDto, ChangePasswordDto } from './auth.schema';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y gestión de sesiones
 */
export class AuthController {
  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Iniciar sesión
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, password]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login exitoso
   *       401:
   *         description: Credenciales inválidas
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as LoginDto;
      const result = await authService.login(dto, req.ip);
      ResponseHelper.success(res, result, 'Login exitoso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/refresh:
   *   post:
   *     summary: Renovar token de acceso
   *     tags: [Auth]
   */
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body as RefreshTokenDto;
      const tokens = await authService.refreshToken(refreshToken);
      ResponseHelper.success(res, tokens, 'Token renovado');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/logout:
   *   post:
   *     summary: Cerrar sesión
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout(req.user!.id, req.ip);
      ResponseHelper.success(res, null, 'Sesión cerrada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /auth/change-password:
   *   put:
   *     summary: Cambiar contraseña
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as ChangePasswordDto;
      await authService.changePassword(req.user!.id, dto);
      ResponseHelper.success(res, null, 'Contraseña actualizada correctamente');
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      ResponseHelper.success(res, req.user, 'Usuario autenticado');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
