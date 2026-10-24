/**
 * OrdersService — order use cases: creation, lookup, and status transitions.
 *
 * Why it exists:
 * - The controller maps HTTP; this service owns the business operations on an
 *   order. Status changes go through assertTransition (order-state-machine.ts)
 *   so no caller can write an illegal status.
 *
 * Current operations:
 * - create(userId, items, promoCode?): creates a PENDING order with computed
 *   subtotal, optional discount, and total. Stock is NOT checked or decremented
 *   at order creation (ADR 0004 D1). A zero-stock order is accepted and fails
 *   at payment with OUT_OF_STOCK.
 * - findById(orderId): read an order with its items, 404 if missing.
 * - transition(orderId, nextStatus): inside a transaction, read the order,
 *   assert the transition, write the new status.
 *
 * Lookup strategy:
 * - Currently looks up by `id` only. The API contract (§11) specifies orders
 *   are keyed by `code` in URLs (format BL-YYYY-NNNN). Both methods should
 *   try `id` first, then fall back to `code`.
 *
 * Boundary:
 * - Depends on PrismaService (common/), PromotionsService (promotions/),
 *   and assertTransition (this feature).
 * - Throws Nest exceptions (NotFoundException, BadRequestException); the
 *   global filter formats them into the ADR 0005 C3 envelope.
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { OrderStatus } from '../../generated/prisma/enums.js';
import { assertTransition } from './order-state-machine.js';
import { PromotionsService } from '../promotions/promotions.service.js';

interface CreateOrderItemInput {
  productId: string;
  size: 'S' | 'M' | 'L';
  toppingIds?: string[];
  qty: number;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly promotionsService: PromotionsService,
  ) { }

  /**
   * Creates a new PENDING order.
   * Computes subtotal from server prices, applies promo if provided,
   * generates order code BL-YYYY-NNNN using a DB sequence.
   * Does NOT decrement stock (stock decrements at PAID per ADR 0004 D1).
   * Validates topping IDs and uses their actual prices.
   */
  async create(
    userId: string,
    items: CreateOrderItemInput[],
    promoCode?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Load products and compute subtotal from server prices
      const products = await Promise.all(items.map(i =>
        tx.product.findUnique({ where: { id: i.productId } })),
      );
      for (const [idx, p] of products.entries()) {
        if (!p) {
          throw new NotFoundException({
            statusCode: 404,
            error: 'Not Found',
            message: `Product ${items[idx].productId} not found`,
            code: 'PRODUCT_NOT_FOUND',
          });
        }
      }

      // 1b. Validate toppings and build price map
      const allToppingIds = items.flatMap(i => i.toppingIds ?? []);
      const uniqueToppingIds = [...new Set(allToppingIds)];
      const toppings = await tx.topping.findMany({
        where: { id: { in: uniqueToppingIds } },
      });
      const toppingMap = new Map(toppings.map(t => [t.id, t]));

      for (const item of items) {
        for (const toppingId of item.toppingIds ?? []) {
          const topping = toppingMap.get(toppingId);
          if (!topping) {
            throw new BadRequestException({
              statusCode: 400,
              error: 'Bad Request',
              message: `Topping ${toppingId} not found`,
              code: 'TOPPING_NOT_FOUND',
            });
          }
          if (!topping.active) {
            throw new BadRequestException({
              statusCode: 400,
              error: 'Bad Request',
              message: `Topping ${toppingId} is not available`,
              code: 'TOPPING_INACTIVE',
            });
          }
        }
      }

      // Compute subtotal with topping prices
      const subtotal = items.reduce((sum, i, idx) => {
        const productPrice = products[idx].price;
        const toppingPrice = (i.toppingIds ?? []).reduce(
          (tSum, tid) => tSum + toppingMap.get(tid)!.price, 0);
        const unitPrice = productPrice + toppingPrice;
        return sum + unitPrice * i.qty;
      }, 0);

      // 2. Apply promo if provided
      let discountAmount = 0;
      if (promoCode) {
        discountAmount = await this.promotionsService.applyToOrder(
          tx, promoCode, subtotal,
        );
      }
      const total = subtotal - discountAmount;

      // 3. Generate order code (BL-YYYY-NNNN) using DB sequence
      const code = await this.generateOrderCode(tx);

      // 4. Create Order + OrderItems with correct topping prices
      return tx.order.create({
        data: {
          code,
          userId,
          status: 'PENDING',
          subtotal,
          discountAmount,
          total,
          promoCode: promoCode ?? null,
          items: {
            create: items.map((i, idx) => {
              const productPrice = products[idx].price;
              const toppingPrice = (i.toppingIds ?? []).reduce(
                (tSum, tid) => tSum + toppingMap.get(tid)!.price, 0);
              const unitPrice = productPrice + toppingPrice;
              return {
                productId: i.productId,
                size: i.size,
                qty: i.qty,
                unitPrice,
                lineTotal: unitPrice * i.qty,
                toppings: {
                  create: (i.toppingIds ?? []).map(toppingId => ({
                    toppingId,
                    unitPrice: toppingMap.get(toppingId)!.price,
                  })),
                },
              };
            }),
          },
        },
        include: { items: true },
      });
    });
  }

  /**
   * Generates a unique order code in format BL-YYYY-NNNN.
   * Uses a global DB sequence (order_code_seq); the year prefix is cosmetic.
   * The sequence makes collisions impossible in practice.
   */
  private async generateOrderCode(tx: Prisma.TransactionClient): Promise<string> {
    const [{ nextval }] = await tx.$queryRaw<{ nextval: bigint }[]>`
      SELECT nextval('order_code_seq') AS nextval
    `;
    const year = new Date().getFullYear();
    return `BL-${year}-${String(Number(nextval)).padStart(4, '0')}`;
  }

  async findById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: `Order ${orderId} not found`,
        code: 'ORDER_NOT_FOUND',
      });
    }
    return order;
  }

  async transition(orderId: string, nextStatus: OrderStatus) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException({
          statusCode: 404,
          error: 'Not Found',
          message: `Order ${orderId} not found`,
          code: 'ORDER_NOT_FOUND',
        });
      }

      assertTransition(order.status, nextStatus);

      return tx.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
      });
    });
  }
}