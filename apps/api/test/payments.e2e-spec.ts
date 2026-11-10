import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createE2EApp } from './setup/e2e-app.js';
import { seedProduct, seedUser, seedOrder } from './setup/fixtures.js';
import { loginAs } from './setup/auth.js';
import { PrismaService } from '../src/common/prisma.service.js';

/**
 * Graded test (b) from assignment PDF §9:
 * "gửi 2 lần cùng Idempotency-Key chỉ tạo 1 đơn"
 * Scenarios: scenarios.md S-PAY-5 (replay) and S-PAY-6 (conflict).
 */
describe('POST /api/v1/payments idempotency (graded test b)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    const user = await seedUser(prisma, 'idem-e2e@example.com');
    userId = user.id;
    token = await loginAs(app, user.email);
  });

  afterAll(async () => {
    await app.close();
  });

  /**
  * Graded test (b), case 1 — assignment PDF §9:
  * "gửi 2 lần cùng Idempotency-Key chỉ tạo 1 đơn".
  *
  * Two concurrent POST /payments with the same key and the same body must:
  * - both return 200 (the second is a replay, not an error),
  * - share the same paymentId,
  * - leave exactly one Payment row,
  * - decrement stock exactly once.
  *
  * This is the case that races: both requests can pass the outer findUnique,
  * and the loser either hits P2002 (unique constraint) or sees the stock
  * already decremented (OUT_OF_STOCK). The service handles both as replays.
  */
  it('same Idempotency-Key + same body -> one payment, same paymentId', async () => {
    const product = await seedProduct(prisma, { stock: 10 });
    const order = await seedOrder(prisma, userId, product.id);
    const key = randomUUID();
    const body = { orderId: order.id, method: 'WALLET' };

    const [res1, res2] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', key)
        .send(body),
      request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', key)
        .send(body),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(res1.body.status).toBe('PAID');
    expect(res2.body.status).toBe('PAID');
    expect(res1.body.paymentId).toBe(res2.body.paymentId);

    const payments = await prisma.payment.findMany({ where: { orderId: order.id } });
    expect(payments).toHaveLength(1);
    expect(payments[0].status).toBe('SUCCESS');

    // Stock decremented exactly once
    const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
    expect(productAfter?.stock).toBe(10 - order.items[0].qty);

    const loyaltyRows = await prisma.loyaltyTransaction.findMany({ where: { orderId: order.id } });
    expect(loyaltyRows).toHaveLength(1);
    expect(loyaltyRows[0].type).toBe('EARN');
    expect(loyaltyRows[0].points).toBe(35);
    expect(loyaltyRows[0].userId).toBe(userId);
  });

  /**
  * Graded test (b), case 2 — the conflict half.
  * Same key, different body (orderA vs orderB) must return 409
  * IDEMPOTENCY_CONFLICT, and must not create a Payment for the second order.
  * Proves the service distinguishes "same request replayed" from "different
  * request with the same key" (ADR 0004 D4).
  */
  it('same Idempotency-Key + different body -> 409 IDEMPOTENCY_CONFLICT', async () => {
    const product = await seedProduct(prisma, { stock: 10 });
    const orderA = await seedOrder(prisma, userId, product.id);
    const orderB = await seedOrder(prisma, userId, product.id);
    const key = randomUUID();

    // First request with orderA
    const res1 = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', key)
      .send({ orderId: orderA.id, method: 'WALLET' });
    expect(res1.status).toBe(200);

    // Second request with the same key but orderB
    const res2 = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', key)
      .send({ orderId: orderB.id, method: 'WALLET' });

    expect(res2.status).toBe(409);
    expect(res2.body.code).toBe('IDEMPOTENCY_CONFLICT');

    const paymentsForB = await prisma.payment.findMany({ where: { orderId: orderB.id } });
    expect(paymentsForB).toHaveLength(0);
  });

  /**
  * Supporting test (not graded, but required by api-contract.md §9):
  * POST /payments without an Idempotency-Key must be rejected with
  * 400 IDEMPOTENCY_KEY_REQUIRED. The key is mandatory, not optional.
  */
  it('missing Idempotency-Key -> 400 IDEMPOTENCY_KEY_REQUIRED', async () => {
    const product = await seedProduct(prisma, { stock: 10 });
    const order = await seedOrder(prisma, userId, product.id);

    const res = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: order.id, method: 'WALLET' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });

  /**
  * Supporting test (ADR 0004 D2):
  * A payment failure is not an HTTP error. The response is 200 with
  * body.status = PAYMENT_FAILED. The order moves to PAYMENT_FAILED, stock is
  * unchanged, and no loyalty points are earned. The frontend distinguishes
  * success from failure by reading body.status, not res.ok.
  */
  it('payment failure returns 200 with status PAYMENT_FAILED (ADR 0004 D2)', async () => {
    const product = await seedProduct(prisma, { stock: 10 });
    const order = await seedOrder(prisma, userId, product.id);
    const key = randomUUID();

    process.env.PAYMENT_MOCK_MODE = 'failure';

    const res = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', key)
      .send({ orderId: order.id, method: 'WALLET' });

    delete process.env.PAYMENT_MOCK_MODE;

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PAYMENT_FAILED');

    const orderAfter = await prisma.order.findUnique({ where: { id: order.id } });
    expect(orderAfter?.status).toBe('PAYMENT_FAILED');

    // Stock unchanged
    const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
    expect(productAfter?.stock).toBe(10);

    const loyaltyRows = await prisma.loyaltyTransaction.findMany({ where: { orderId: order.id } });
    expect(loyaltyRows).toHaveLength(0);
  });

  /**
   * PDF §9.1: a failed payment is retried through PENDING
   * (PAYMENT_FAILED -> PENDING -> PAID | PAYMENT_FAILED), on the same order and
   * with a new Idempotency-Key for each attempt.
   */
  it('retry after failure: a second failure is accepted, then a success pays the same order', async () => {
    const product = await seedProduct(prisma, { stock: 10 });
    const order = await seedOrder(prisma, userId, product.id);
    const pay = (key: string) =>
      request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', key)
        .send({ orderId: order.id, method: 'WALLET' });

    const firstKey = randomUUID();
    process.env.PAYMENT_MOCK_MODE = 'failure';
    const first = await pay(firstKey);
    const second = await pay(randomUUID());
    delete process.env.PAYMENT_MOCK_MODE;

    expect(first.status).toBe(200);
    expect(first.body.status).toBe('PAYMENT_FAILED');
    // Before the fix this was 409 INVALID_STATE_TRANSITION (PAYMENT_FAILED -> PAYMENT_FAILED).
    expect(second.status).toBe(200);
    expect(second.body.status).toBe('PAYMENT_FAILED');

    const third = await pay(randomUUID());
    expect(third.status).toBe(200);
    expect(third.body.status).toBe('PAID');

    const orderAfter = await prisma.order.findUnique({ where: { id: order.id } });
    expect(orderAfter?.status).toBe('PAID');
    expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(3);
    expect((await prisma.product.findUnique({ where: { id: product.id } }))?.stock).toBe(9);

    // Replaying the first (failed) attempt answers what that attempt answered,
    // not the order's current PAID status.
    const replay = await pay(firstKey);
    expect(replay.status).toBe(200);
    expect(replay.body.status).toBe('PAYMENT_FAILED');
    expect(replay.body.replayed).toBe(true);
  });

  it('a CANCELLED order cannot be paid (409 INVALID_STATE_TRANSITION)', async () => {
    const product = await seedProduct(prisma, { stock: 10 });
    const order = await seedOrder(prisma, userId, product.id);
    await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });

    const res = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', randomUUID())
      .send({ orderId: order.id, method: 'CARD' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_STATE_TRANSITION');
    expect((await prisma.product.findUnique({ where: { id: product.id } }))?.stock).toBe(10);
  });
});
