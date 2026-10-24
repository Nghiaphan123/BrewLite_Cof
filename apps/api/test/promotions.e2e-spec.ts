import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createE2EApp } from './setup/e2e-app.js';
import { seedProduct, seedUser, seedOrder } from './setup/fixtures.js';
import { loginAs } from './setup/auth.js';
import { PrismaService } from '../src/common/prisma.service.js';
import { randomUUID } from 'node:crypto';

/**
 * Promotions e2e tests (Task 10d / Phase 5 row 49.0).
 *
 * Verifies the promotions validate endpoint and discount application
 * at order creation.
 */
describe('Promotions (Task 10d)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let productId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    const user = await seedUser(prisma, 'promo-e2e@example.com');
    userId = user.id;
    token = await loginAs(app, user.email);

    const product = await seedProduct(prisma, { stock: 100, price: 35000 });
    productId = product.id;
  });

  afterAll(async () => {
    await app.close();
  });

  // Helper to create a promo in the DB
  async function createPromo(overrides: any = {}) {
    const now = new Date();
    const validFrom = overrides.validFrom ?? new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    const validTo = overrides.validTo ?? new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Generate a valid code: uppercase letters and digits only
    const baseCode = overrides.code ?? `PROMO-${randomUUID().slice(0, 8).toUpperCase()}`;
    const validCode = baseCode.toUpperCase().replace(/[^A-Z0-9]/g, '');

    return prisma.promotion.create({
      data: {
        code: validCode,
        type: overrides.type ?? 'PERCENT',
        value: overrides.value ?? 10,
        minOrderTotal: overrides.minOrderTotal ?? 0,
        validFrom,
        validTo,
        active: overrides.active ?? true,
        usageLimit: overrides.usageLimit ?? null,
        usedCount: overrides.usedCount ?? 0,
      },
    });
  }

  describe('POST /api/v1/promotions/validate', () => {
    it('valid percent promo -> 200, discountAmount correct', async () => {
      const promo = await createPromo({ code: `PERCENT10-${randomUUID().slice(0, 8)}`, type: 'PERCENT', value: 10 });

      const res = await request(app.getHttpServer())
        .post('/api/v1/promotions/validate')
        .send({ code: promo.code, subtotal: 100000 });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(promo.code);
      expect(res.body.type).toBe('PERCENT');
      expect(res.body.value).toBe(10);
      expect(res.body.discountAmount).toBe(10000);
    });

    it('valid fixed promo -> 200, discountAmount matches', async () => {
      const promo = await createPromo({ code: `FIXED5000-${randomUUID().slice(0, 8)}`, type: 'FIXED', value: 5000 });

      const res = await request(app.getHttpServer())
        .post('/api/v1/promotions/validate')
        .send({ code: promo.code, subtotal: 100000 });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(promo.code);
      expect(res.body.type).toBe('FIXED');
      expect(res.body.value).toBe(5000);
      expect(res.body.discountAmount).toBe(5000);
    });

    it('unknown code -> 404 PROMO_NOT_FOUND', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/promotions/validate')
        .send({ code: 'UNKNOWN', subtotal: 100000 });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('PROMO_NOT_FOUND');
    });

    it('inactive promo -> 400 PROMO_INACTIVE', async () => {
      const promo = await createPromo({ code: `INACTIVE-${randomUUID().slice(0, 8)}`, active: false });

      const res = await request(app.getHttpServer())
        .post('/api/v1/promotions/validate')
        .send({ code: promo.code, subtotal: 100000 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PROMO_INACTIVE');
    });

    it('expired promo (before validFrom) -> 400 PROMO_EXPIRED', async () => {
      // Use a fixed future date to avoid timezone issues
      const validFrom = new Date('2099-01-01T00:00:00.000Z'); // Far future
      const validTo = new Date('2099-12-31T23:59:59.999Z');

      const promo = await createPromo({
        code: `FUTURE-${randomUUID().slice(0, 8)}`,
        validFrom,
        validTo,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/promotions/validate')
        .send({ code: promo.code, subtotal: 100000 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PROMO_EXPIRED');
    });

    it('expired promo (after validUntil) -> 400 PROMO_EXPIRED', async () => {
      // Use a fixed past date to avoid timezone issues
      const validFrom = new Date('2020-01-01T00:00:00.000Z'); // Far past
      const validTo = new Date('2020-12-31T23:59:59.999Z');

      const promo = await createPromo({
        code: `EXPIRED-${randomUUID().slice(0, 8)}`,
        validFrom,
        validTo,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/promotions/validate')
        .send({ code: promo.code, subtotal: 100000 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PROMO_EXPIRED');
    });

    it('subtotal below minOrderTotal -> 400 PROMO_MIN_ORDER_NOT_MET', async () => {
      const promo = await createPromo({ code: `MIN50K-${randomUUID().slice(0, 8)}`, minOrderTotal: 50000 });

      const res = await request(app.getHttpServer())
        .post('/api/v1/promotions/validate')
        .send({ code: promo.code, subtotal: 10000 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PROMO_MIN_ORDER_NOT_MET');
    });

    it('usedCount == usageLimit -> 400 PROMO_EXHAUSTED', async () => {
      const promo = await createPromo({
        code: `EXHAUSTED-${randomUUID().slice(0, 8)}`,
        usageLimit: 1,
        usedCount: 1,
      });

      const res = await request(app.getHttpServer())
        .post('/api/v1/promotions/validate')
        .send({ code: promo.code, subtotal: 100000 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PROMO_EXHAUSTED');
    });
  });

  describe('POST /api/v1/orders with promo', () => {
    it('valid promo: 201, total = subtotal - discount, usedCount incremented', async () => {
      const promo = await createPromo({ code: `ORDER10-${randomUUID().slice(0, 8)}`, type: 'PERCENT', value: 10 });

      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { productId: productId, size: 'M', qty: 2, toppingIds: [] },
          ],
          promoCode: promo.code,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.code).toMatch(/^BL-\d{4}-\d{4}$/);
      expect(res.body.status).toBe('PENDING');
      expect(res.body.subtotal).toBe(70000); // 35000 * 2
      expect(res.body.discountAmount).toBe(7000); // 10% of 70000
      expect(res.body.total).toBe(63000); // 70000 - 7000
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].unitPrice).toBe(35000);
      expect(res.body.items[0].lineTotal).toBe(70000);

      // Verify usedCount was incremented
      const promoAfter = await prisma.promotion.findUnique({ where: { code: promo.code } });
      expect(promoAfter?.usedCount).toBe(1);
    });

    it('no promo: 201, discountAmount = 0', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { productId: productId, size: 'M', qty: 1, toppingIds: [] },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.subtotal).toBe(35000);
      expect(res.body.discountAmount).toBe(0);
      expect(res.body.total).toBe(35000);
    });

    it('unknown promo: 404 PROMO_NOT_FOUND, no order created', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { productId: productId, size: 'M', qty: 1, toppingIds: [] },
          ],
          promoCode: 'DOESNOTEXIST',
        });

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('PROMO_NOT_FOUND');

      // Verify no order was created with this promo code
      const orders = await prisma.order.findMany({ where: { promoCode: 'DOESNOTEXIST' } });
      expect(orders).toHaveLength(0);
    });

    it('inactive promo on order: 400 PROMO_INACTIVE', async () => {
      const promo = await createPromo({ code: `INACTIVE2-${randomUUID().slice(0, 8)}`, active: false });

      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { productId: productId, size: 'M', qty: 1, toppingIds: [] },
          ],
          promoCode: promo.code,
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('PROMO_INACTIVE');
    });

    it('promo cap at subtotal: 200% of 1000 = 1000', async () => {
      // Create a cheap product
      const cheapProduct = await seedProduct(prisma, { stock: 100, price: 1000 });
      const promo = await createPromo({ code: `CAP100-${randomUUID().slice(0, 8).toUpperCase()}`, type: 'PERCENT', value: 100 });

      const res = await request(app.getHttpServer())
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { productId: cheapProduct.id, size: 'S', qty: 1, toppingIds: [] },
          ],
          promoCode: promo.code,
        });

      expect(res.status).toBe(201);
      expect(res.body.subtotal).toBe(1000);
      expect(res.body.discountAmount).toBe(1000); // Capped at subtotal
      expect(res.body.total).toBe(0);
    });

    it('concurrent POST /orders produce distinct codes (concurrency-safe)', async () => {
      const product = await seedProduct(prisma, { stock: 100, price: 35000 });

      const userA = await seedUser(prisma, `usera-${randomUUID().slice(0, 8)}@example.com`);
      const tokenA = await loginAs(app, userA.email);
      const userB = await seedUser(prisma, `userb-${randomUUID().slice(0, 8)}@example.com`);
      const tokenB = await loginAs(app, userB.email);

      const [resA, resB] = await Promise.all([
        request(app.getHttpServer())
          .post('/api/v1/orders')
          .set('Authorization', `Bearer ${tokenA}`)
          .send({
            items: [{ productId: product.id, size: 'M', qty: 1, toppingIds: [] }],
          }),
        request(app.getHttpServer())
          .post('/api/v1/orders')
          .set('Authorization', `Bearer ${tokenB}`)
          .send({
            items: [{ productId: product.id, size: 'M', qty: 1, toppingIds: [] }],
          }),
      ]);

      expect(resA.status).toBe(201);
      expect(resB.status).toBe(201);
      expect(resA.body.code).toBeDefined();
      expect(resB.body.code).toBeDefined();
      expect(resA.body.code).not.toBe(resB.body.code);
      // Both codes should match BL-YYYY-NNNN pattern
      expect(resA.body.code).toMatch(/^BL-\d{4}-\d{4,}$/);
      expect(resB.body.code).toMatch(/^BL-\d{4}-\d{4,}$/);
    });
  });
});