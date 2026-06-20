import { Request, Response, NextFunction } from 'express';
import { benefitsService } from './benefits.service';
import { ResponseHelper } from '../../shared/utils/apiResponse';
import type { CreateBenefitDto, UpdateBenefitDto } from './benefits.schema';

/**
 * @swagger
 * tags:
 *   name: Benefits
 *   description: Catálogo de beneficios por nivel (RC-F04, RC-F05)
 */
export class BenefitsController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const benefit = await benefitsService.create(req.body as CreateBenefitDto, req.user!.id);
      ResponseHelper.created(res, benefit, 'Beneficio creado');
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const benefits = await benefitsService.findAll(req.query.levelName as string | undefined);
      ResponseHelper.success(res, benefits);
    } catch (error) {
      next(error);
    }
  }

  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const benefit = await benefitsService.findById(req.params.id);
      ResponseHelper.success(res, benefit);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const benefit = await benefitsService.update(req.params.id, req.body as UpdateBenefitDto, req.user!.id);
      ResponseHelper.success(res, benefit, 'Beneficio actualizado');
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await benefitsService.deactivate(req.params.id, req.user!.id);
      ResponseHelper.noContent(res);
    } catch (error) {
      next(error);
    }
  }
}

export const benefitsController = new BenefitsController();
