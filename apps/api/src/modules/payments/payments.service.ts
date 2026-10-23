/**
 * PaymentsService — the payment transaction, including idempotency, stock
 * control, and loyalty accrual.
 *
 * Why it exists:
 * - One place where the payment flow is correct: idempotent (ADR 0004 D4),
 *   stock-safe under concurrency (ADR 0004 D1, Task 10c), and points-accurate
 *   (ADR 0004 D7). The transaction is the unit of correctness; partial success
 *   (charge without stock, stock without points) is not allowed.
 *
 * Flow:
 * 1. Require Idempotency-Key (400 IDEMPOTENCY_KEY_REQUIRED).
 * 2. Compute requestHash (payment-hash.ts).
 * 3. If a payment with (userId, idempotencyKey) exists:
 *    - same hash  -> return the stored response (replay, replayed: true)
 *    - diff hash  -> 409 IDEMPOTENCY_CONFLICT
 * 4. Otherwise, in one $transaction:
 *    - assertTransition(order.status, PAID | PAYMENT_FAILED)
 *    - on success: decrement stock under optimistic lock (Product.version),
 *      accrue loyalty (floor(total/1000)), update order, create Payment row.
 *    - on failure: update order to PAYMENT_FAILED, create Payment row (FAILED),
 *      no stock change, no points.
 *
 * Known gap (Task 7):
 * - userId is a parameter; the controller sources it from req.user or a
 *   spoofable X-User-Id header. When JwtAuthGuard lands, the controller passes
 *   the token's subject and the header fallback is removed.
 *
 * Boundary:
 * - Depends on PrismaService (common/), assertTransition (orders feature),
 *   hashPaymentRequest (this feature). Throws Nest exceptions; the global
 *   filter formats them.
 */

import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';
import { assertTransition } from '../orders/order-state-machine.js';
import { hashPaymentRequest } from './payment-hash.js';
import { PaymentMethod, PaymentStatus } from '../../generated/prisma/enums.js';
import { loyaltyPointsFor } from './loyalty.js';

export interface ProcessPaymentInput {
  userId: string;
  orderId: string;
  method: 'WALLET' | 'CARD';
  idempotencyKey?: string;
  mockMode?: 'success' | 'failure';
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) { }

  async processPayment(input: ProcessPaymentInput) {
    const { userId, orderId, method, idempotencyKey } = input;

    if (!idempotencyKey || idempotencyKey.trim() === '') {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Idempotency-Key header is required for payments',
        code: 'IDEMPOTENCY_KEY_REQUIRED',
      });
    }

    const requestHash = hashPaymentRequest({ orderId, method });

    // Idempotency: a row with (userId, idempotencyKey) means this request is a
    // replay or a conflict. The comparison must be on the hash of the SAME
    // inputs the service uses below (orderId, method), not on a stored value
    // that may be null or stale.
    const existingPayment = await this.prisma.payment.findUnique({
      where: {
        userId_idempotencyKey: {
          userId,
          idempotencyKey,
        },
      },
      include: {
        order: true,
      },
    });

    if (existingPayment) {
      const storedHash = existingPayment.requestHash ?? null;
      if (storedHash !== requestHash) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          message: 'Idempotency key was previously used with a different request payload',
          code: 'IDEMPOTENCY_CONFLICT',
        });
      }

      // Replay: return the stored response. The status is the ORDER's status,
      // not the payment's, because a failed attempt leaves the order
      // PAYMENT_FAILED and a successful one leaves it PAID (ADR 0004 D2).
      return {
        paymentId: existingPayment.id,
        orderId: existingPayment.orderId,
        status: existingPayment.order.status === 'PAID' ? 'PAID' : 'PAYMENT_FAILED',
        method: existingPayment.method,
        amount: existingPayment.amount,
        replayed: true,
      };
    }

    const mockMode = input.mockMode ?? process.env.PAYMENT_MOCK_MODE ?? 'success';
    const isMockSuccess = mockMode !== 'failure';

    try {
      return await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
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

        // Ownership check: order must belong to the caller (api-contract.md §9)
        if (order.userId !== userId) {
          throw new NotFoundException({
            statusCode: 404,
            error: 'Not Found',
            message: `Order ${orderId} not found`,
            code: 'ORDER_NOT_FOUND',
          });
        }

        // If the order is already in a terminal/paid state and this is a
        // replay that slipped past the outer check, treat it as a replay
        // rather than a transition. This covers the concurrent case where
        // another transaction committed between the outer findUnique and
        // this one.
        if (order.status === 'PAID') {
          const existing = await tx.payment.findUnique({
            where: { userId_idempotencyKey: { userId, idempotencyKey } },
          });
          if (existing && existing.requestHash === requestHash) {
            return {
              paymentId: existing.id,
              orderId: existing.orderId,
              status: 'PAID',
              method: existing.method,
              amount: existing.amount,
              replayed: true,
            };
          }
        }

        const nextOrderStatus = isMockSuccess ? 'PAID' : 'PAYMENT_FAILED';
        assertTransition(order.status, nextOrderStatus);

        if (isMockSuccess) {
          for (const item of order.items) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
            });

            if (!product || product.stock < item.qty) {
              throw new ConflictException({
                statusCode: 409,
                error: 'Conflict',
                message: `Product ${product?.name ?? item.productId} is out of stock`,
                code: 'OUT_OF_STOCK',
              });
            }

            const updated = await tx.product.updateMany({
              where: { id: product.id, version: product.version },
              data: {
                stock: { decrement: item.qty },
                version: { increment: 1 },
              },
            });

            if (updated.count === 0) {
              throw new ConflictException({
                statusCode: 409,
                error: 'Conflict',
                message: `Concurrent update conflict on stock for product ${product.name}`,
                code: 'OUT_OF_STOCK',
              });
            }
          }

          const pointsEarned = loyaltyPointsFor(order.total);
          if (pointsEarned > 0) {
            await tx.user.update({
              where: { id: userId },
              data: { loyaltyPoints: { increment: pointsEarned } },
            });
          }
        }

        await tx.order.update({
          where: { id: orderId },
          data: { status: nextOrderStatus },
        });

        const payment = await tx.payment.create({
          data: {
            orderId,
            userId,
            idempotencyKey,
            requestHash,
            amount: order.total,
            method: method as PaymentMethod,
            status: isMockSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
          },
        });

        return {
          paymentId: payment.id,
          orderId: order.id,
          status: nextOrderStatus,
          method: payment.method,
          amount: payment.amount,
          replayed: false,
        };
      });
    } catch (err: any) {
      // Handle concurrent replay scenarios:
      // 1. P2002: Unique constraint violation on (userId, idempotencyKey) - the other
      //    transaction committed the Payment row first.
      // 2. OUT_OF_STOCK: Optimistic lock conflict on product stock - both transactions
      //    tried to decrement stock for the same order concurrently. If a payment with
      //    the same idempotency key and hash already exists, this is a replay.
      const errorResponse =
        err instanceof ConflictException ? err.getResponse() : undefined;
      const isConcurrentReplay =
        err?.code === 'P2002' ||
        (err instanceof ConflictException &&
          typeof errorResponse === 'object' &&
          errorResponse !== null &&
          'code' in errorResponse &&
          errorResponse.code === 'OUT_OF_STOCK');

      if (isConcurrentReplay) {
        const existing = await this.prisma.payment.findUnique({
          where: { userId_idempotencyKey: { userId, idempotencyKey } },
          include: { order: true },
        });
        if (existing) {
          if (existing.requestHash !== requestHash) {
            throw new ConflictException({
              statusCode: 409,
              error: 'Conflict',
              message: 'Idempotency key was previously used with a different request payload',
              code: 'IDEMPOTENCY_CONFLICT',
            });
          }
          return {
            paymentId: existing.id,
            orderId: existing.orderId,
            status: existing.order.status === 'PAID' ? 'PAID' : 'PAYMENT_FAILED',
            method: existing.method,
            amount: existing.amount,
            replayed: true,
          };
        }
      }
      throw err;
    }
  }
}