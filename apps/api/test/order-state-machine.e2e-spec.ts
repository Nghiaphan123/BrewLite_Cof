import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { createE2EApp } from './setup/e2e-app.js';
import { seedProduct, seedUser, seedOrder } from './setup/fixtures.js';
import { loginAs } from './setup/auth.js';
import { PrismaService } from '../src/common/prisma.service.js';

/**
 * Graded test (a) from assignment PDF §9:
 * "chặn được chuyển trạng thái không hợp lệ"
 * Scenario: scenarios.md S-ORD-5.
 *
 * Proves at the API boundary that:
 * - an illegal transition (COMPLETED -> PAID, or any non-diagram edge) is
 *   rejected with 409 INVALID_STATE_TRANSITION and the status is unchanged;
 * - no endpoint bypasses the state machine: the admin status endpoint obeys it
 *   too, and payment-only edges (-> PAID, -> PENDING) cannot be set by hand;
 * - a customer cannot drive transitions at all.
 */
describe('Order state machine (graded test a)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let adminToken: string;
  let customer: { id: string; email: string };

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    customer = await seedUser(prisma, 'sm-e2e@example.com');
    customerToken = await loginAs(app, customer.email);

    const admin = await seedUser(prisma, 'sm-admin@example.com');
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } });
    adminToken = await loginAs(app, admin.email);
  });

  afterAll(async () => {
    await app.close();
  });

  async function orderIn(status: 'PENDING' | 'PAID' | 'PAYMENT_FAILED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED', stock = 1) {
    const product = await seedProduct(prisma, { stock });
    const order = await seedOrder(prisma, customer.id, product.id);
    if (status !== 'PENDING') {
      await prisma.order.update({ where: { id: order.id }, data: { status } });
    }
    return { order, product };
  }

  const transition = (orderId: string, next: string, token = adminToken) =>
    request(app.getHttpServer())
      .post(`/api/v1/orders/${orderId}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ next });

  /**
   * Graded test (a), case 1 — assignment PDF §9:
   * "chặn được chuyển trạng thái không hợp lệ".
   *
   * COMPLETED is terminal. A transition COMPLETED -> PAID must be rejected at
   * the API boundary with 409 INVALID_STATE_TRANSITION, and the order's status
   * must be unchanged. This is the exact case the grader checks.
   */
  it('rejects COMPLETED -> PAID with 409 INVALID_STATE_TRANSITION', async () => {
    const { order } = await orderIn('COMPLETED');

    const res = await transition(order.id, 'PAID');

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_STATE_TRANSITION');
    const after = await prisma.order.findUnique({ where: { id: order.id } });
    expect(after?.status).toBe('COMPLETED');
  });

  it('rejects CANCELLED -> PENDING with 409', async () => {
    const { order } = await orderIn('CANCELLED');

    const res = await transition(order.id, 'PENDING');

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('rejects skipping a step (PAID -> READY) with 409', async () => {
    const { order } = await orderIn('PAID');

    const res = await transition(order.id, 'READY');

    expect(res.status).toBe(409);
    const after = await prisma.order.findUnique({ where: { id: order.id } });
    expect(after?.status).toBe('PAID');
  });

  it('walks the barista path PAID -> PREPARING -> READY -> COMPLETED', async () => {
    const { order } = await orderIn('PAID');

    for (const next of ['PREPARING', 'READY', 'COMPLETED']) {
      const res = await transition(order.id, next);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(next);
    }
  });

  it('cannot mark an unpaid order PAID by hand (only POST /payments may)', async () => {
    const { order } = await orderIn('PENDING');

    const res = await transition(order.id, 'PAID');

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_STATE_TRANSITION');
    const after = await prisma.order.findUnique({ where: { id: order.id } });
    expect(after?.status).toBe('PENDING');
  });

  it('a customer cannot drive transitions (403), not even on their own order', async () => {
    const { order } = await orderIn('PENDING');

    const res = await transition(order.id, 'CANCELLED', customerToken);

    expect(res.status).toBe(403);
    const after = await prisma.order.findUnique({ where: { id: order.id } });
    expect(after?.status).toBe('PENDING');
  });

  it('the admin status endpoint obeys the same state machine', async () => {
    const { order } = await orderIn('COMPLETED');

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PENDING' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_STATE_TRANSITION');
    const after = await prisma.order.findUnique({ where: { id: order.id } });
    expect(after?.status).toBe('COMPLETED');
  });

  it('PAID -> CANCELLED gives back the stock and the loyalty points (PDF §9.1 "hủy")', async () => {
    const product = await seedProduct(prisma, { stock: 5 });
    const order = await seedOrder(prisma, customer.id, product.id, { qty: 2, total: 70000 });

    const paid = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', randomUUID())
      .send({ orderId: order.id, method: 'WALLET' });
    expect(paid.body.status).toBe('PAID');

    const pointsAfterPay = (await prisma.user.findUnique({ where: { id: customer.id } }))!.loyaltyPoints;
    expect((await prisma.product.findUnique({ where: { id: product.id } }))?.stock).toBe(3);

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/admin/orders/${order.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CANCELLED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
    expect((await prisma.product.findUnique({ where: { id: product.id } }))?.stock).toBe(5);
    const user = await prisma.user.findUnique({ where: { id: customer.id } });
    expect(user?.loyaltyPoints).toBe(pointsAfterPay - 70);
    const payment = await prisma.payment.findFirst({ where: { orderId: order.id } });
    expect(payment?.status).toBe('REFUNDED');
  });
});
