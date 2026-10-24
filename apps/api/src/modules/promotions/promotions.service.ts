/**
 * PromotionsService — promotion validation and application.
 *
 * Why it exists:
 * - Encapsulates the mutation logic (incrementing usedCount) and the
 *   read-only validation logic in one place.
 * - Called by OrdersService.create() to apply a promo at order creation.
 * - Called by PromotionsController.validate() for the preview endpoint.
 *
 * Contract:
 * - validate(code, subtotal): same checks as applyToOrder, but does NOT
 *   increment usedCount. Returns { code, type, value, discountAmount }.
 * - applyToOrder(tx, code, subtotal): runs inside the caller's transaction,
 *   increments usedCount, returns discount amount.
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { computeDiscount, DiscountResult, PromotionRule } from './promotion.js';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Maps a Prisma Promotion row to our internal PromotionRule type.
   */
  private toRule(promo: any): PromotionRule {
    return {
      type: promo.type,
      value: promo.value,
      minOrderTotal: promo.minOrderTotal,
      maxUses: promo.usageLimit ?? null,
      usedCount: promo.usedCount,
      validFrom: promo.validFrom,
      validUntil: promo.validTo,
      isActive: promo.active,
    };
  }

  /**
   * Validates a promotion code for a given subtotal.
   * Does NOT mutate the database (no usedCount increment).
   * Used by the preview endpoint.
   */
  async validate(code: string, subtotal: number): Promise<{
    code: string;
    type: 'PERCENT' | 'FIXED';
    value: number;
    discountAmount: number;
  }> {
    const promo = await this.prisma.promotion.findUnique({ where: { code } });
    if (!promo) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: `Promotion ${code} not found`,
        code: 'PROMO_NOT_FOUND',
      });
    }

    const result = computeDiscount(this.toRule(promo), subtotal);
    if (!result.ok) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: result.message,
        code: result.code,
      });
    }

    return {
      code: promo.code,
      type: promo.type,
      value: promo.value,
      discountAmount: result.discountAmount,
    };
  }

  /**
   * Applies a promotion inside the caller's transaction.
   * Increments usedCount by 1.
   * Returns the discount amount.
   */
  async applyToOrder(
    tx: Prisma.TransactionClient,
    code: string,
    subtotal: number,
  ): Promise<number> {
    const promo = await tx.promotion.findUnique({ where: { code } });
    if (!promo) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: `Promotion ${code} not found`,
        code: 'PROMO_NOT_FOUND',
      });
    }

    const result = computeDiscount(this.toRule(promo), subtotal);
    if (!result.ok) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: result.message,
        code: result.code,
      });
    }

    // Increment usedCount
    await tx.promotion.update({
      where: { code },
      data: { usedCount: { increment: 1 } },
    });

    return result.discountAmount;
  }
}