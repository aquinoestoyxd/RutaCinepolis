import { Request, Response, NextFunction } from 'express';
import { promotionsService } from './promotions.service';
import { ResponseHelper } from '../../shared/utils/apiResponse';
import type { CreatePromotionDto, UpdatePromotionDto } from './promotions.schema';

export class PromotionsController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const promotion = await promotionsService.create(req.body as CreatePromotionDto, req.user!.id);
      ResponseHelper.created(res, promotion, 'Promoción creada');
    } catch (error) {
      next(error);
    }
  }

  async findAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const promotions = await promotionsService.findAllActive();
      ResponseHelper.success(res, promotions);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const promotion = await promotionsService.findById(req.params.id);
      ResponseHelper.success(res, promotion);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const promotion = await promotionsService.update(req.params.id, req.body as UpdatePromotionDto, req.user!.id);
      ResponseHelper.success(res, promotion, 'Promoción actualizada');
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await promotionsService.deactivate(req.params.id, req.user!.id);
      ResponseHelper.noContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const promotionsController = new PromotionsController();
