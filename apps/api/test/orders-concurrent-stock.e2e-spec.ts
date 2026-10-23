import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createE2EApp } from './setup/e2e-app.js';
import { seedProduct, seedUser, seedOrder } from './setup/fixtures.js';
import { loginAs } from './setup/auth.js';
import { PrismaService } from '../src/common/prisma.service.js';

/**
 * Graded test (c) from assignment PDF §9:
 * "đặt đồng thời không vượt quá tồn kho"
 * Scenario: scenarios.md S-ORD-6.
 *
 * Two parallel payments for the last unit: exactly one succeeds, the other is
 * rejected with 409 OUT_OF_STOCK, final stock is 0, version incremented once.
 *
 * IMPORTANT: this test must NOT wrap the two requests in a single transaction.
 * It uses Promise.all on two independent HTTP requests with two different users
 * and two different Idempotency-Keys. That is what makes the race real.
 */
describe('Concurrent stock (graded test c)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenA: string;
  let tokenB: string;
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    const userA = await seedUser(prisma, 'race-a@example.com');
    const userB = await seedUser(prisma, 'race-b@example.com');
    userAId = userA.id;
    userBId = userB.id;
    tokenA = await loginAs(app, 'race-a@example.com');
    tokenB = await loginAs(app, 'race-b@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('two parallel payments for stock 1: one PAID, one 409 OUT_OF_STOCK, stock 0', async () => {
    const product = await seedProduct(prisma, { stock: 1, price: 35000 });
    const orderA = await seedOrder(prisma, userAId, product.id, { qty: 1 });
    const orderB = await seedOrder(prisma, userBId, product.id, { qty: 1 });

    const [resA, resB] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('X-User-Id', userAId)
        .set('Idempotency-Key', randomUUID())
        .send({ orderId: orderA.id, method: 'WALLET' }),
      request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${tokenB}`)
        .set('X-User-Id', userBId)
        .set('Idempotency-Key', randomUUID())
        .send({ orderId: orderB.id, method: 'WALLET' }),
    ]);

    const results = [resA, resB];
    const paid = results.filter((r) => r.status === 200 && r.body.status === 'PAID');
    const outOfStock = results.filter((r) => r.status === 409 && r.body.code === 'OUT_OF_STOCK');

    expect(paid).toHaveLength(1);
    expect(outOfStock).toHaveLength(1);

    const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
    expect(productAfter?.stock).toBe(0);
    expect(productAfter?.version).toBe(1); // exactly one successful decrement

    // Exactly one order is PAID
    const ordersAfter = await prisma.order.findMany({ where: { id: { in: [orderA.id, orderB.id] } } });
    const paidOrders = ordersAfter.filter((o) => o.status === 'PAID');
    expect(paidOrders).toHaveLength(1);
  });

  it('three parallel payments for stock 2: exactly two PAID, one rejected', async () => {
    const product = await seedProduct(prisma, { stock: 2, price: 35000 });
    const userC = await seedUser(prisma, 'race-c@example.com');
    const tokenC = await loginAs(app, 'race-c@example.com');

    const orderA = await seedOrder(prisma, userAId, product.id, { qty: 1 });
    const orderB = await seedOrder(prisma, userBId, product.id, { qty: 1 });
    const orderC = await seedOrder(prisma, userC.id, product.id, { qty: 1 });

    const requests = [
      { token: tokenA, userId: userAId, order: orderA },
      { token: tokenB, userId: userBId, order: orderB },
      { token: tokenC, userId: userC.id, order: orderC },
    ].map(({ token, userId, order }) =>
      request(app.getHttpServer())
        .post('/api/v1/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('X-User-Id', userId)
        .set('Idempotency-Key', randomUUID())
        .send({ orderId: order.id, method: 'WALLET' }),
    );

    const results = await Promise.all(requests);
    const paid = results.filter((r) => r.status === 200 && r.body.status === 'PAID');
    const rejected = results.filter((r) => r.status === 409 && r.body.code === 'OUT_OF_STOCK');

    expect(paid).toHaveLength(2);
    expect(rejected).toHaveLength(1);

    const productAfter = await prisma.product.findUnique({ where: { id: product.id } });
    expect(productAfter?.stock).toBe(0);
    expect(productAfter?.version).toBe(2);
  });
});
