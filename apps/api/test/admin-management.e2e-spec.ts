import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { createE2EApp } from './setup/e2e-app.js';
import { seedProduct, seedUser } from './setup/fixtures.js';
import { loginAs } from './setup/auth.js';
import { PrismaService } from '../src/common/prisma.service.js';

/**
 * Admin management: block / open an account, cancel / turn back on a promotion
 * code, and change a topping's price.
 *
 * Proves that:
 * - a blocked user cannot log in, and a token issued before the block stops
 *   working at once; opening the account lets them back in;
 * - an admin account cannot be blocked;
 * - a cancelled promotion code is refused for new orders and works again once
 *   turned back on;
 * - a new topping price is used by new orders, while past orders keep the price
 *   they were sold at;
 * - only an admin can do any of this.
 */
describe('Admin management: users, promotions, topping price', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let admin: { id: string };

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    const adminUser = await seedUser(prisma, 'mgmt-admin@example.com');
    await prisma.user.update({ where: { id: adminUser.id }, data: { role: 'ADMIN' } });
    admin = adminUser;
    adminToken = await loginAs(app, adminUser.email);
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const asAdmin = (method: 'patch' | 'get', path: string) =>
    http()[method](`/api/v1/admin${path}`).set('Authorization', `Bearer ${adminToken}`);

  describe('block / open an account', () => {
    it('a blocked user cannot log in; opening the account lets them back in', async () => {
      const user = await seedUser(prisma, 'mgmt-block@example.com');

      const block = await asAdmin('patch', `/users/${user.id}/block`).send({ blocked: true });
      expect(block.status).toBe(200);
      expect(block.body).toMatchObject({ id: user.id, blocked: true });

      const login = await http()
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'correct-horse-battery-1' });
      expect(login.status).toBe(403);
      expect(login.body.code).toBe('ACCOUNT_BLOCKED');

      await asAdmin('patch', `/users/${user.id}/block`).send({ blocked: false }).expect(200);
      const again = await http()
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: 'correct-horse-battery-1' });
      expect(again.status).toBe(200);
    });

    it('a wrong password on a blocked account still answers 401, not "blocked"', async () => {
      const user = await seedUser(prisma, 'mgmt-block-pw@example.com');
      await prisma.user.update({ where: { id: user.id }, data: { blocked: true } });

      const res = await http().post('/api/v1/auth/login').send({ email: user.email, password: 'wrong-password-1' });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('AUTH_INVALID');
    });

    it('a token issued before the block stops working at once', async () => {
      const user = await seedUser(prisma, 'mgmt-block-token@example.com');
      const token = await loginAs(app, user.email);
      await http().get('/api/v1/cart').set('Authorization', `Bearer ${token}`).expect(200);

      await asAdmin('patch', `/users/${user.id}/block`).send({ blocked: true }).expect(200);

      const res = await http().get('/api/v1/cart').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ACCOUNT_BLOCKED');
    });

    it('the user list shows who is blocked', async () => {
      const user = await seedUser(prisma, 'mgmt-list@example.com');
      await prisma.user.update({ where: { id: user.id }, data: { blocked: true } });

      const res = await asAdmin('get', '/users');

      expect(res.status).toBe(200);
      expect(res.body.find((u: { id: string }) => u.id === user.id)).toMatchObject({ blocked: true });
    });

    it('an admin account cannot be blocked (not even by itself)', async () => {
      const res = await asAdmin('patch', `/users/${admin.id}/block`).send({ blocked: true });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('CANNOT_BLOCK_ADMIN');
      expect((await prisma.user.findUnique({ where: { id: admin.id } }))?.blocked).toBe(false);
    });

    it('rejects a missing flag (400) and an unknown user (404)', async () => {
      const user = await seedUser(prisma, 'mgmt-validate@example.com');
      await asAdmin('patch', `/users/${user.id}/block`).send({ blocked: 'yes' }).expect(400);

      const missing = await asAdmin('patch', `/users/${randomUUID()}/block`).send({ blocked: true });
      expect(missing.status).toBe(404);
      expect(missing.body.code).toBe('USER_NOT_FOUND');
    });
  });

  describe('cancel / turn back on a promotion code', () => {
    async function seedPromotion() {
      return prisma.promotion.create({
        data: {
          id: randomUUID(),
          code: `E2E${randomUUID().slice(0, 8).toUpperCase()}`,
          type: 'FIXED',
          value: 10000,
          minOrderTotal: 0,
          validFrom: new Date(Date.now() - 86_400_000),
          validTo: new Date(Date.now() + 86_400_000),
        },
      });
    }

    async function orderWith(token: string, promoCode: string) {
      const product = await seedProduct(prisma, { stock: 10, price: 40000 });
      return http()
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [{ productId: product.id, size: 'S', qty: 1, toppingIds: [] }], promoCode });
    }

    it('a cancelled code is refused for new orders; turned back on, it works again', async () => {
      const promo = await seedPromotion();
      const customer = await seedUser(prisma, 'mgmt-promo@example.com');
      const token = await loginAs(app, customer.email);

      const cancel = await asAdmin('patch', `/promotions/${promo.id}/active`).send({ active: false });
      expect(cancel.status).toBe(200);
      expect(cancel.body).toMatchObject({ code: promo.code, active: false });

      const refused = await orderWith(token, promo.code);
      expect(refused.status).toBe(400);
      expect(refused.body.code).toBe('PROMO_INACTIVE');

      await asAdmin('patch', `/promotions/${promo.id}/active`).send({ active: true }).expect(200);
      const accepted = await orderWith(token, promo.code);
      expect(accepted.status).toBe(201);
      expect(accepted.body.discountAmount).toBe(10000);
    });

    it('answers 404 for an unknown promotion and 400 for a bad body', async () => {
      const missing = await asAdmin('patch', `/promotions/${randomUUID()}/active`).send({ active: false });
      expect(missing.status).toBe(404);
      expect(missing.body.code).toBe('PROMOTION_NOT_FOUND');

      const promo = await seedPromotion();
      await asAdmin('patch', `/promotions/${promo.id}/active`).send({}).expect(400);
    });
  });

  describe('topping price', () => {
    it('new orders use the new price; past orders keep the old one', async () => {
      const topping = await prisma.topping.create({
        data: { id: randomUUID(), name: `Topping giá ${randomUUID()}`, price: 5000, stock: 50 },
      });
      const product = await seedProduct(prisma, { stock: 10, price: 30000 });
      const customer = await seedUser(prisma, 'mgmt-price@example.com');
      const token = await loginAs(app, customer.email);
      const order = () =>
        http()
          .post('/api/v1/orders')
          .set('Authorization', `Bearer ${token}`)
          .send({ items: [{ productId: product.id, size: 'S', qty: 1, toppingIds: [topping.id] }] });

      const before = await order();
      expect(before.body.total).toBe(35000);

      const res = await asAdmin('patch', `/toppings/${topping.id}/price`).send({ price: 8000 });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: topping.id, price: 8000 });

      const after = await order();
      expect(after.body.total).toBe(38000);
      // The first order keeps the price it was created with.
      const old = await prisma.order.findUnique({ where: { id: before.body.id } });
      expect(old?.total).toBe(35000);
      const detail = await http().get(`/api/v1/products/${product.id}`);
      expect(detail.body.toppings.find((t: { id: string }) => t.id === topping.id).price).toBe(8000);
    });

    it('rejects a negative or non-integer price (400) and an unknown topping (404)', async () => {
      const topping = await prisma.topping.create({
        data: { id: randomUUID(), name: `Topping sai ${randomUUID()}`, price: 5000, stock: 50 },
      });
      for (const price of [-1000, 2500.5, 'abc', 200000]) {
        await asAdmin('patch', `/toppings/${topping.id}/price`).send({ price }).expect(400);
      }
      expect((await prisma.topping.findUnique({ where: { id: topping.id } }))?.price).toBe(5000);

      const missing = await asAdmin('patch', `/toppings/${randomUUID()}/price`).send({ price: 6000 });
      expect(missing.status).toBe(404);
      expect(missing.body.code).toBe('TOPPING_NOT_FOUND');
    });
  });

  it('a customer cannot use any of these endpoints (403)', async () => {
    const customer = await seedUser(prisma, 'mgmt-customer@example.com');
    const token = await loginAs(app, customer.email);
    const other = await seedUser(prisma, 'mgmt-victim@example.com');
    const id = randomUUID();

    for (const [path, body] of [
      [`/users/${other.id}/block`, { blocked: true }],
      [`/promotions/${id}/active`, { active: false }],
      [`/toppings/${id}/price`, { price: 1000 }],
    ] as const) {
      const res = await http().patch(`/api/v1/admin${path}`).set('Authorization', `Bearer ${token}`).send(body);
      expect(res.status).toBe(403);
    }
    expect((await prisma.user.findUnique({ where: { id: other.id } }))?.blocked).toBe(false);
  });
});
