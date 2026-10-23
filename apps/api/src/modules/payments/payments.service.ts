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
 * Known issue (the failing idempotency test):
 * - The replay branch compares existingPayment.requestHash to the newly
 *   computed hash. If the stored row has a null or different requestHash,
 *   a same-body replay is misclassified as a conflict (409). Verify the
 *   Payment row's requestHash after a run; see the debug notes in the review.
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

    // Check if an existing payment with this idempotency key already exists for this user
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
      if (existingPayment.requestHash !== requestHash) {
        throw new ConflictException({
          statusCode: 409,
          error: 'Conflict',
          message: 'Idempotency key was previously used with a different request payload',
          code: 'IDEMPOTENCY_CONFLICT',
        });
      }

      // Replay stored response
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

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new NotFoundException({
          statusCode: 404,
          error: 'Not Found',
          message: `Order ${orderId} not found`,
          code: 'ORDER_NOT_FOUND',
        });
      }

      const nextOrderStatus = isMockSuccess ? 'PAID' : 'PAYMENT_FAILED';
      assertTransition(order.status, nextOrderStatus);

      if (isMockSuccess) {
        // Optimistic locking stock check (Task 10c)
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
            where: {
              id: product.id,
              version: product.version,
            },
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

        // Accrue loyalty points (ADR 0004 D7) – ensure idempotency
        const pointsEarned = Math.floor(order.total / 1000);
        if (pointsEarned > 0) {
          // Update user loyalty points
          await tx.user.update({
            where: { id: userId },
            data: { loyaltyPoints: { increment: pointsEarned } },
          });

          // Create loyalty transaction only if not exists
          const existingLoyalty = await tx.loyaltyTransaction.findUnique({
            where: { orderId_type: { orderId, type: 'EARN' } },
          });
          if (!existingLoyalty) {
            await tx.loyaltyTransaction.create({
              data: { userId, orderId, type: 'EARN', points: pointsEarned },
            });
          }
        }
      }

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: nextOrderStatus,
        },
      });

      // Create Payment record with idempotencyKey and requestHash
      const payment = await tx.payment.create({
        data: {
          orderId,
          userId,
          idempotencyKey,
          requestHash,
          amount: order.total,
          method: method as PaymentMethod,
          status: isMockSuccess ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
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
  }
}
