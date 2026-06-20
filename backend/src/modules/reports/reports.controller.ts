import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service';
import { ResponseHelper } from '../../shared/utils/apiResponse';

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Reportes KPI y estadísticas del sistema (RC-F09)
 */
export class ReportsController {
  async getKpiDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      const data = await reportsService.getKpiDashboard({
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      });
      ResponseHelper.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getMemberGrowth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = parseInt(req.query.year as string ?? String(new Date().getFullYear()), 10);
      const data = await reportsService.getMemberGrowthReport(year);
      ResponseHelper.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { from, to } = req.query as { from?: string; to?: string };
      const data = await reportsService.getTransactionReport({
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      });
      ResponseHelper.success(res, data);
    } catch (error) {
      next(error);
    }
  }

  async getMerchandiseStock(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportsService.getMerchandiseStockReport();
      ResponseHelper.success(res, data);
    } catch (error) {
      next(error);
    }
  }
}

export const reportsController = new ReportsController();
