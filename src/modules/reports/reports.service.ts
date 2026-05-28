import { prisma } from '../../config/database';
import { LevelName, MemberStatus, TransactionStatus, TransactionType } from '../../shared/types/enums';

export interface DateRangeFilter {
  from?: Date;
  to?: Date;
}

export class ReportsService {
  /**
   * Dashboard KPI principal (RC-F09).
   * Diseñado para responder en < 5 segundos usando agregaciones paralelas.
   */
  async getKpiDashboard(range: DateRangeFilter) {
    const dateFilter = this.buildDateFilter(range);

    const [
      totalMembers,
      membersByLevel,
      membersByStatus,
      transactionSummary,
      newMembersThisPeriod,
      topSpenders,
      levelDistribution,
    ] = await Promise.all([
      prisma.member.count(),

      prisma.membership.groupBy({
        by: ['levelId'],
        _count: { _all: true },
        where: dateFilter ? { member: { registeredAt: dateFilter } } : undefined,
      }),

      prisma.member.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),

      prisma.transaction.aggregate({
        where: {
          status: TransactionStatus.COMPLETED,
          type: { in: [TransactionType.PURCHASE_TICKET, TransactionType.PURCHASE_CANDY] },
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _sum: { amount: true, pointsEarned: true },
        _count: { _all: true },
        _avg: { amount: true },
      }),

      prisma.member.count({
        where: dateFilter ? { registeredAt: dateFilter } : {},
      }),

      prisma.membership.findMany({
        take: 10,
        orderBy: { totalSpent: 'desc' },
        include: { member: { select: { firstName: true, lastName: true, cardNumber: true } }, level: true },
        select: {
          totalSpent: true,
          totalVisits: true,
          points: true,
          member: true,
          level: true,
        },
      }),

      this.getLevelDistribution(),
    ]);

    return {
      summary: {
        totalMembers,
        newMembersThisPeriod,
        totalRevenue: Number(transactionSummary._sum.amount ?? 0),
        totalTransactions: transactionSummary._count._all,
        avgTransactionAmount: Number(transactionSummary._avg.amount ?? 0),
        totalPointsEarned: transactionSummary._sum.pointsEarned ?? 0,
      },
      membersByStatus: membersByStatus.map(s => ({
        status: s.status,
        count: s._count._all,
      })),
      levelDistribution,
      topSpenders: topSpenders.map(m => ({
        member: `${m.member.firstName} ${m.member.lastName}`,
        cardNumber: m.member.cardNumber,
        level: m.level.displayName,
        totalSpent: Number(m.totalSpent),
        totalVisits: m.totalVisits,
        points: m.points,
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  async getMemberGrowthReport(year: number) {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const data = await Promise.all(
      months.map(async (month) => {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);
        const count = await prisma.member.count({
          where: { registeredAt: { gte: start, lte: end } },
        });
        return { month, year, count };
      }),
    );

    return data;
  }

  async getTransactionReport(range: DateRangeFilter) {
    const dateFilter = this.buildDateFilter(range);

    const [byType, byOrigin, dailyVolume] = await Promise.all([
      prisma.transaction.groupBy({
        by: ['type'],
        where: {
          status: TransactionStatus.COMPLETED,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _count: { _all: true },
        _sum: { amount: true, pointsEarned: true },
      }),

      prisma.transaction.groupBy({
        by: ['origin'],
        where: {
          status: TransactionStatus.COMPLETED,
          ...(dateFilter ? { createdAt: dateFilter } : {}),
        },
        _count: { _all: true },
        _sum: { amount: true },
      }),

      prisma.$queryRaw<Array<{ date: Date; count: bigint; total: number }>>`
        SELECT DATE(created_at) as date, COUNT(*) as count, SUM(amount) as total
        FROM transactions
        WHERE status = 'COMPLETED'
        ${dateFilter?.gte ? prisma.$queryRaw`AND created_at >= ${dateFilter.gte}` : prisma.$queryRaw``}
        ${dateFilter?.lte ? prisma.$queryRaw`AND created_at <= ${dateFilter.lte}` : prisma.$queryRaw``}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ]);

    return {
      byType: byType.map(t => ({
        type: t.type,
        count: t._count._all,
        totalAmount: Number(t._sum.amount ?? 0),
        totalPoints: t._sum.pointsEarned ?? 0,
      })),
      byOrigin: byOrigin.map(o => ({
        origin: o.origin,
        count: o._count._all,
        totalAmount: Number(o._sum.amount ?? 0),
      })),
      dailyVolume: dailyVolume.map(d => ({
        date: d.date,
        count: Number(d.count),
        total: Number(d.total),
      })),
    };
  }

  async getMerchandiseStockReport() {
    const items = await prisma.merchandise.findMany({
      include: {
        _count: { select: { deliveries: true } },
      },
      orderBy: { stockCurrent: 'asc' },
    });

    return items.map(item => ({
      id: item.id,
      name: item.name,
      levelRequired: item.levelRequired,
      stockCurrent: item.stockCurrent,
      stockTotal: item.stockTotal,
      stockMinAlert: item.stockMinAlert,
      totalDeliveries: item._count.deliveries,
      isLow: item.stockCurrent <= item.stockMinAlert,
    }));
  }

  private async getLevelDistribution() {
    const levels = await prisma.level.findMany({ select: { id: true, name: true, displayName: true } });
    const total = await prisma.member.count();

    const data = await Promise.all(
      levels.map(async (level) => {
        const count = await prisma.membership.count({ where: { levelId: level.id } });
        return {
          level: level.name as LevelName,
          displayName: level.displayName,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        };
      }),
    );

    return data;
  }

  private buildDateFilter(range: DateRangeFilter) {
    if (!range.from && !range.to) return undefined;
    return {
      ...(range.from ? { gte: range.from } : {}),
      ...(range.to ? { lte: range.to } : {}),
    };
  }
}

export const reportsService = new ReportsService();
