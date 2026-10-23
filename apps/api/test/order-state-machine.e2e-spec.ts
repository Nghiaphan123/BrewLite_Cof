import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
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
 * Proves that an illegal transition (COMPLETED -> PAID, or any non-diagram edge)
 * is rejected at the API boundary with 409 INVALID_STATE_TRANSITION, and the
 * order's status is unchanged.
 */
describe('Order state machine (graded test a)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let user: any;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    user = await seedUser(prisma, 'sm-e2e@example.com');
    token = await loginAs(app, 'sm-e2e@example.com');
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects COMPLETED -> PAID with 409 INVALID_STATE_TRANSITION', async () => {
    const product = await seedProduct(prisma, { stock: 1 });
    const order = await seedOrder(prisma, user.id, product.id);

    // Force the order into COMPLETED directly
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'COMPLETED' },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/orders/${order.id}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ next: 'PAID' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_STATE_TRANSITION');

    const after = await prisma.order.findUnique({ where: { id: order.id } });
    expect(after?.status).toBe('COMPLETED');
  });

  it('rejects CANCELLED -> PENDING with 409', async () => {
    const product = await seedProduct(prisma, { stock: 1 });
    const order = await seedOrder(prisma, user.id, product.id);

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/orders/${order.id}/transition`)
      .set('Authorization', `Bearer ${token}`)
      .send({ next: 'PENDING' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_STATE_TRANSITION');
  });
});
