import { Request, Response, NextFunction } from 'express';
import { posService } from './pos.service';
import { ResponseHelper } from '../../shared/utils/apiResponse';
import type { PosTransactionDto, PosOfflineSyncDto } from './pos.schema';

/**
 * @swagger
 * tags:
 *   name: POS
 *   description: Integración con punto de venta (CU-02, CU-03)
 */
export class PosController {
  /**
   * @swagger
   * /pos/lookup:
   *   post:
   *     summary: Consultar miembro por tarjeta RC (< 2s)
   *     tags: [POS]
   *     security:
   *       - bearerAuth: []
   */
  async lookup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { cardNumber } = req.body as { cardNumber: string };
      const member = await posService.lookupByCard(cardNumber);
      ResponseHelper.success(res, member);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /pos/transaction:
   *   post:
   *     summary: Registrar compra y acreditar puntos (< 2s)
   *     tags: [POS]
   *     security:
   *       - bearerAuth: []
   */
  async processTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as PosTransactionDto;
      const result = await posService.processTransaction(dto, req.user!.id);
      ResponseHelper.success(res, result, `Transacción procesada. +${result.pointsEarned} puntos`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @swagger
   * /pos/sync:
   *   post:
   *     summary: Sincronizar transacciones offline del POS
   *     tags: [POS]
   *     security:
   *       - bearerAuth: []
   */
  async syncOffline(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as PosOfflineSyncDto;
      const result = await posService.syncOfflineTransactions(dto, req.user!.id);
      ResponseHelper.success(res, result, `Sincronizadas ${result.succeeded}/${result.total} transacciones`);
    } catch (error) {
      next(error);
    }
  }

  async getPendingQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { posId } = req.query as { posId?: string };
      const queue = await posService.getPendingOfflineQueue(posId);
      ResponseHelper.success(res, queue);
    } catch (error) {
      next(error);
    }
  }
}

export const posController = new PosController();
