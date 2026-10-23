/**
 * OrdersService — order use cases: lookup and status transitions.
 *
 * Why it exists:
 * - The controller maps HTTP; this service owns the business operations on an
 *   order. Status changes go through assertTransition (order-state-machine.ts)
 *   so no caller can write an illegal status.
 *
 * Current operations:
 * - findById(orderId): read an order with its items, 404 if missing.
 * - transition(orderId, nextStatus): inside a transaction, read the order,
 *   assert the transition, write the new status.
 *
 * Lookup strategy:
 * - Currently looks up by `id` only. The API contract (§11) specifies orders
 *   are keyed by `code` in URLs (format BL-YYYY-NNNN). Once the `code` field
 *   is added to the Prisma schema (Task 1.0 ERD follow-up) and the order
 *   creation endpoint generates it, both methods should try `id` first, then
 *   fall back to `code`.
 *
 * Boundary:
 * - Depends on PrismaService (common/) and assertTransition (this feature).
 * - Throws Nest exceptions (NotFoundException); the global filter formats
 *   them into the ADR 0005 C3 envelope. Does not format responses itself.
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';
import { OrderStatus } from '../../generated/prisma/enums.js';
import { assertTransition } from './order-state-machine.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) { }

  async findById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    return order;
  }

  async transition(orderId: string, nextStatus: OrderStatus) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderId} not found`);
      }

      assertTransition(order.status, nextStatus);

      return tx.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
      });
    });
  }
}
