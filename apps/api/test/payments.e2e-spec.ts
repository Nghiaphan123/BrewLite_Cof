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
    token = await loginAs(app, 'idem-e2e@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('same Idempotency-Key + same body -> one payment, same paymentId', async () => {
    const product = await seedProduct(prisma, { stock: 10 });
    const order = await seedOrder(prisma, userId, product.id);
    const key = randomUUID();
    const body = { orderId: order.id, method: 'WALLET' };

    const [res1, res2] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('X-User-Id', userId)
        .set('Idempotency-Key', key)
        .send(body),
      request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('X-User-Id', userId)
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
    expect(payments[0].status).toBe('SUCCEEDED');

    // Stock decremented exactly once
    const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
    expect(productAfter?.stock).toBe(10 - order.items[0].qty);
  });

  it('same Idempotency-Key + different body -> 409 IDEMPOTENCY_CONFLICT', async () => {
    const product = await seedProduct(prisma, { stock: 10 });
    const orderA = await seedOrder(prisma, userId, product.id);
    const orderB = await seedOrder(prisma, userId, product.id);
    const key = randomUUID();

    // First request with orderA
    const res1 = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .set('X-User-Id', userId)
      .set('Idempotency-Key', key)
      .send({ orderId: orderA.id, method: 'WALLET' });
    expect(res1.status).toBe(200);

    // Second request with the same key but orderB
    const res2 = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .set('X-User-Id', userId)
      .set('Idempotency-Key', key)
      .send({ orderId: orderB.id, method: 'WALLET' });

    expect(res2.status).toBe(409);
    expect(res2.body.code).toBe('IDEMPOTENCY_CONFLICT');

    const paymentsForB = await prisma.payment.findMany({ where: { orderId: orderB.id } });
    expect(paymentsForB).toHaveLength(0);
  });

  it('missing Idempotency-Key -> 400 IDEMPOTENCY_KEY_REQUIRED', async () => {
    const product = await seedProduct(prisma, { stock: 10 });
    const order = await seedOrder(prisma, userId, product.id);

    const res = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .set('X-User-Id', userId)
      .send({ orderId: order.id, method: 'WALLET' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });

  it('payment failure returns 200 with status PAYMENT_FAILED (ADR 0004 D2)', async () => {
    const product = await seedProduct(prisma, { stock: 10 });
    const order = await seedOrder(prisma, userId, product.id);
    const key = randomUUID();

    process.env.PAYMENT_MOCK_MODE = 'failure';

    const res = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .set('X-User-Id', userId)
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
  });
});
