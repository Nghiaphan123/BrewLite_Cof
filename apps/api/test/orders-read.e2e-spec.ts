/**
 * GET /orders/me and GET /orders/:code (api-contract.md §10–§11).
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createE2EApp } from './setup/e2e-app.js';
import { seedOrder, seedProduct, seedUser } from './setup/fixtures.js';
import { PrismaService } from '../src/common/prisma.service.js';

describe('Order read API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let otherToken: string;
  let code: string;
  let userId: string;
  let otherUserId: string;
  let productId: string;
  let orderId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    const user = await seedUser(prisma, 'orders-read@example.com');
    const other = await seedUser(prisma, 'orders-other@example.com');
    userId = user.id;
    otherUserId = other.id;
    const product = await seedProduct(prisma, { name: 'E2E read drink' });
    productId = product.id;
    const order = await seedOrder(prisma, userId, productId);
    code = order.code;
    orderId = order.id;

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'correct-horse-battery-1' });
    token = login.body.accessToken;

    const otherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: other.email, password: 'correct-horse-battery-1' });
    otherToken = otherLogin.body.accessToken;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { id: orderId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
    await app.close();
  });

  it('GET /orders/me returns the caller history and rejects a missing token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/orders/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(res.body.items.length);
    expect(res.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: orderId,
          code,
          status: 'PENDING',
          total: 35000,
        }),
      ]),
    );

    const missing = await request(app.getHttpServer()).get('/api/v1/orders/me');
    expect(missing.status).toBe(401);
  });

  it('GET /orders/:code is owner-scoped and hides other users as 404', async () => {
    const own = await request(app.getHttpServer())
      .get(`/api/v1/orders/${code}`)
      .set('Authorization', `Bearer ${token}`);

    expect(own.status).toBe(200);
    expect(own.body.code).toBe(code);
    expect(own.body.payment).toBeNull();
    expect(own.body.items[0]).toMatchObject({
      productId,
      name: 'E2E read drink',
      size: 'M',
      qty: 1,
    });

    const foreign = await request(app.getHttpServer())
      .get(`/api/v1/orders/${code}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(foreign.status).toBe(404);
    expect(foreign.body.code).toBe('ORDER_NOT_FOUND');
  });
});
