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
 *   assert a manual (non-payment) transition, write the new status. Used by
 *   the admin/barista endpoints. Cancelling a PAID order restores drink and
 *   topping stock and takes back the loyalty points in the same transaction.
 *
 * Lookup strategy:
 * - Currently looks up by `id` only. The API contract (§11) specifies orders
 *   are keyed by `code` in URLs (format BL-YYYY-NNNN). Both methods should
 *   try `id` first, then fall back to `code`.
 *
 * Boundary:
 * - Depends on PrismaService (common/), PromotionsService (promotions/),
 *   and assertManualTransition (this feature).
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
import { assertManualTransition } from './order-state-machine.js';
import { calculateUnitPrice } from './pricing.js';
import { PromotionsService } from '../promotions/promotions.service.js';
import { loyaltyPointsFor } from '../payments/loyalty.js';
import { toppingUsage } from './topping-usage.js';

interface CreateOrderItemInput {
  productId: string;
  size: 'S' | 'M' | 'L';
  toppingIds?: string[];
  qty: number;
}

const orderItemDetails = {
  product: { select: { name: true } },
  toppings: { include: { topping: { select: { name: true } } } },
} satisfies Prisma.OrderItemInclude;

type OrderItemWithDetails = Prisma.OrderItemGetPayload<{ include: typeof orderItemDetails }>;

/** Order pages show what was bought; topping prices are the snapshot from order time. */
function toOrderItemResponse(item: OrderItemWithDetails) {
  return {
    productId: item.productId,
    name: item.product.name,
    size: item.size,
    qty: item.qty,
    lineTotal: item.lineTotal,
    toppings: item.toppings.map((topping) => ({
      id: topping.toppingId,
      name: topping.topping.name,
      price: topping.unitPrice,
    })),
  };
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
      const productPrices = products.map((product, idx) => {
        if (!product) {
          throw new NotFoundException({
            statusCode: 404,
            error: 'Not Found',
            message: `Product ${items[idx].productId} not found`,
            code: 'PRODUCT_NOT_FOUND',
          });
        }
        return product.price;
      });

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

      // Compute unit prices (size S price + size surcharge + toppings) and subtotal
      const unitPrices = items.map((i, idx) => calculateUnitPrice(
        productPrices[idx],
        i.size,
        (i.toppingIds ?? []).map(tid => toppingMap.get(tid)!.price),
      ));
      const subtotal = items.reduce((sum, i, idx) => sum + unitPrices[idx] * i.qty, 0);

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
              const unitPrice = unitPrices[idx];
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

  /** Caller's order history, newest first. Empty history is { items: [], total: 0 }. */
  async listMine(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        status: true,
        total: true,
        createdAt: true,
        items: { include: orderItemDetails },
      },
    });
    const items = orders.map((order) => ({
      ...order,
      items: order.items.map(toOrderItemResponse),
    }));
    return { items, total: items.length };
  }

  /**
   * Owner-scoped order detail keyed by BL-YYYY-NNNN.
   * A missing code and another user's code both return 404 ORDER_NOT_FOUND.
   */
  async findByCode(userId: string, code: string) {
    const order = await this.prisma.order.findUnique({
      where: { code },
      include: {
        items: { include: orderItemDetails },
        payments: {
          where: { status: 'SUCCESS' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Order not found',
        code: 'ORDER_NOT_FOUND',
      });
    }

    const paid = order.payments[0];
    return {
      id: order.id,
      code: order.code,
      status: order.status,
      total: order.total,
      items: order.items.map(toOrderItemResponse),
      payment: paid
        ? {
            method: paid.method,
            paidAt: paid.createdAt,
            loyaltyPointsEarned: loyaltyPointsFor(paid.amount),
          }
        : null,
      createdAt: order.createdAt,
    };
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

      // A person may take only the non-payment edges (PDF §9.1). PAID, PENDING
      // and PAYMENT_FAILED are reached through POST /payments, which is the
      // only place that decrements stock and accrues loyalty points.
      assertManualTransition(order.status, nextStatus);

      if (order.status === 'PAID' && nextStatus === 'CANCELLED') {
        await this.undoPayment(tx, order.id, order.userId);
      }

      return tx.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
      });
    });
  }

  /**
   * Cancelling a PAID order gives back what the payment took, in the same
   * transaction: the drink stock and topping stock it decremented and the
   * loyalty points it accrued. The successful payment is marked REFUNDED
   * (the gateway is a mock).
   */
  private async undoPayment(tx: Prisma.TransactionClient, orderId: string, userId: string) {
    const items = await tx.orderItem.findMany({ where: { orderId }, include: { toppings: true } });
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty }, version: { increment: 1 } },
      });
    }
    const usage = toppingUsage(
      items.map((item) => ({ qty: item.qty, toppingIds: item.toppings.map((t) => t.toppingId) })),
    );
    for (const [toppingId, portions] of usage) {
      await tx.topping.update({ where: { id: toppingId }, data: { stock: { increment: portions } } });
    }

    const paid = await tx.payment.findFirst({
      where: { orderId, status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
    });
    if (!paid) return;

    const user = await tx.user.findUnique({ where: { id: userId }, select: { loyaltyPoints: true } });
    const points = Math.min(loyaltyPointsFor(paid.amount), user?.loyaltyPoints ?? 0);
    if (points > 0) {
      await tx.user.update({ where: { id: userId }, data: { loyaltyPoints: { decrement: points } } });
    }
    await tx.payment.update({ where: { id: paid.id }, data: { status: 'REFUNDED' } });
  }
}