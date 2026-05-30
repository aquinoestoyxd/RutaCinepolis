import { Request, Response, NextFunction } from 'express';
import { redemptionsService } from './redemptions.service';
import { ResponseHelper } from '../../shared/utils/apiResponse';
import { getPagination } from '../../shared/utils/pagination';
import type { RedeemBenefitDto } from './redemptions.schema';

/**
 * @swagger
 * tags:
 *   name: Redemptions
 *   description: Canje de beneficios (CU-04)
 */
export class RedemptionsController {
  async redeem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as RedeemBenefitDto;
      const result = await redemptionsService.redeem(dto, req.user!.id);
      ResponseHelper.created(res, result, 'Canje realizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async getMyHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = getPagination(req);
      const result = await redemptionsService.getHistory(req.user!.memberId!, page, limit);
      ResponseHelper.paginated(res, result.redemptions, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }

  async getMemberHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit } = getPagination(req);
      const result = await redemptionsService.getHistory(req.params.memberId, page, limit);
      ResponseHelper.paginated(res, result.redemptions, result.total, result.page, result.limit);
    } catch (error) {
      next(error);
    }
  }
}

export const redemptionsController = new RedemptionsController();
