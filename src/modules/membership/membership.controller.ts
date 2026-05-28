import { Request, Response, NextFunction } from 'express';
import { membershipService } from './membership.service';
import { ResponseHelper } from '../../shared/utils/apiResponse';

/**
 * @swagger
 * tags:
 *   name: Membership
 *   description: Niveles de membresía y progreso (RC-F03, RC-F06)
 */
export class MembershipController {
  async getLevels(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const levels = await membershipService.getLevels();
      ResponseHelper.success(res, levels);
    } catch (error) {
      next(error);
    }
  }

  async getMyMembership(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const membership = await membershipService.getMembershipDetails(req.user!.memberId!);
      ResponseHelper.success(res, membership);
    } catch (error) {
      next(error);
    }
  }

  async getMemberMembership(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const membership = await membershipService.getMembershipDetails(req.params.memberId);
      ResponseHelper.success(res, membership);
    } catch (error) {
      next(error);
    }
  }
}

export const membershipController = new MembershipController();
