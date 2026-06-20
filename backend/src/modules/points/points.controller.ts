import { Request, Response, NextFunction } from 'express';
import { pointsService } from './points.service';
import { ResponseHelper } from '../../shared/utils/apiResponse';
import { getPagination } from '../../shared/utils/pagination';
import type { EarnPointsDto, AdjustPointsDto } from './points.schema';

/**
 * @swagger
 * tags:
 *   name: Points
 *   description: Acumulación y consulta de puntos (RC-F02)
 */
export class PointsController {
  async earn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as EarnPointsDto;
      const result = await pointsService.earnPoints({
        ...dto,
        cashierId: req.user!.id,
      });
      ResponseHelper.success(res, result, `${result.pointsEarned} puntos acreditados`);
    } catch (error) {
      next(error);
    }
  }

  async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.params.memberId ?? req.user?.memberId!;
      const balance = await pointsService.getBalance(memberId);
      ResponseHelper.success(res, balance);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.params.memberId ?? req.user?.memberId!;
      const { page, limit } = getPagination(req);
      const result = await pointsService.getHistory(memberId, page, limit);
      ResponseHelper.paginated(res, result.transactions, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async adjust(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as AdjustPointsDto;
      const result = await pointsService.adminAdjustPoints(
        req.params.memberId,
        dto.delta,
        dto.reason,
        req.user!.id,
      );
      ResponseHelper.success(res, result, 'Puntos ajustados correctamente');
    } catch (error) {
      next(error);
    }
  }
}

export const pointsController = new PointsController();
