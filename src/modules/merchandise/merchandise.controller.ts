import { Request, Response, NextFunction } from 'express';
import { merchandiseService } from './merchandise.service';
import { ResponseHelper } from '../../shared/utils/apiResponse';

/**
 * @swagger
 * tags:
 *   name: Merchandise
 *   description: Kit Golden y gestión de stock (RC-F07)
 */
export class MerchandiseController {
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await merchandiseService.findAll();
      ResponseHelper.success(res, items);
    } catch (error) {
      next(error);
    }
  }

  async deliver(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const delivery = await merchandiseService.deliver({
        ...req.body,
        adminId: req.user!.id,
      });
      ResponseHelper.created(res, delivery, 'Kit entregado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async getDeliveryHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await merchandiseService.getDeliveryHistory(req.params.memberId);
      ResponseHelper.success(res, history);
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { delta, notes: _notes } = req.body as { delta: number; notes?: string };
      const item = await merchandiseService.updateStock(req.params.id, delta, req.user!.id);
      ResponseHelper.success(res, item, 'Stock actualizado');
    } catch (error) {
      next(error);
    }
  }
}

export const merchandiseController = new MerchandiseController();
