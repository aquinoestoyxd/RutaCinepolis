import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { TransactionOrigin } from '../../shared/types/enums';
import { NotFoundError, BusinessRuleError } from '../../shared/utils/errorTypes';
import { pointsService } from '../points/points.service';
import { logger } from '../../shared/utils/logger';
import type { PosTransactionDto, PosOfflineSyncDto } from './pos.schema';

export class PosService {
  /**
   * Consulta rápida de miembro por número de tarjeta desde POS (CU-02).
   * Diseñada para responder en < 2 segundos.
   */
  async lookupByCard(cardNumber: string) {
    const member = await prisma.member.findUnique({
      where: { cardNumber },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        cardNumber: true,
        status: true,
        membership: {
          select: {
            points: true,
            totalVisits: true,
            level: { select: { name: true, displayName: true, colorHex: true } },
          },
        },
      },
    });

    if (!member) throw new NotFoundError('Miembro con esa tarjeta');
    return member;
  }

  /**
   * Procesa una transacción en tiempo real desde POS (CU-02, CU-03).
   * Objetivo de rendimiento: < 2 segundos de respuesta.
   */
  async processTransaction(dto: PosTransactionDto, cashierId: string) {
    const member = await this.lookupByCard(dto.cardNumber);

    if (member.status !== 'ACTIVE') {
      throw new BusinessRuleError(`Membresía ${member.status.toLowerCase()}. No se pueden procesar transacciones.`);
    }

    return pointsService.earnPoints({
      memberId: member.id,
      amount: dto.amount,
      transactionType: dto.transactionType,
      posId: dto.posId,
      origin: TransactionOrigin.POS,
      externalRef: dto.externalRef,
      description: dto.description,
      cashierId,
    });
  }

  /**
   * Sincronización de transacciones offline del POS (CU-02 FA-02, calidad 7.2).
   * Procesa en lote atómico — si una falla, la guarda en cola para reintento.
   */
  async syncOfflineTransactions(dto: PosOfflineSyncDto, cashierId: string) {
    const results: Array<{ externalRef?: string; success: boolean; error?: string }> = [];

    for (const tx of dto.transactions) {
      try {
        const member = await prisma.member.findUnique({
          where: { cardNumber: tx.cardNumber },
          select: { id: true, status: true },
        });

        if (!member || member.status !== 'ACTIVE') {
          results.push({
            externalRef: tx.externalRef,
            success: false,
            error: 'Miembro no encontrado o inactivo',
          });
          continue;
        }

        await pointsService.earnPoints({
          memberId: member.id,
          amount: tx.amount,
          transactionType: tx.transactionType,
          posId: dto.posId,
          origin: TransactionOrigin.POS,
          externalRef: tx.externalRef,
          description: `Sync offline - ${tx.occurredAt}`,
          cashierId,
        });

        results.push({ externalRef: tx.externalRef, success: true });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Error desconocido';
        logger.error('Error procesando transacción offline', {
          posId: dto.posId,
          cardNumber: tx.cardNumber,
          error: errMsg,
        });

        await prisma.posOfflineQueue.create({
          data: {
            posId: dto.posId,
            payload: tx as unknown as Prisma.InputJsonValue,
            lastError: errMsg,
            attempts: 1,
          },
        }).catch(qErr => logger.error('Error guardando en cola offline', { qErr }));

        results.push({ externalRef: tx.externalRef, success: false, error: errMsg });
      }
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return { total: dto.transactions.length, succeeded, failed, results };
  }

  async getPendingOfflineQueue(posId?: string) {
    return prisma.posOfflineQueue.findMany({
      where: {
        processedAt: null,
        ...(posId ? { posId } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }
}

export const posService = new PosService();
