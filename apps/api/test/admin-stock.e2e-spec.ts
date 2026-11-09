import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { createE2EApp } from './setup/e2e-app.js';
import { seedProduct, seedUser } from './setup/fixtures.js';
import { loginAs } from './setup/auth.js';
import { PrismaService } from '../src/common/prisma.service.js';

/**
 * Stock management for the admin page, and topping stock in the order flow.
 *
 * Proves that:
 * - the admin can list and set the stock of drinks (products), and a customer cannot;
 * - a paid order takes topping portions out of stock (one per cup), a failed
 *   payment takes nothing, and a cancelled PAID order gives them back;
 * - a topping without enough stock fails the whole payment with 409 OUT_OF_STOCK
 *   and nothing is decremented, even when two payments race for the last portion;
 * - GET /products/:id and GET /cart carry the current stock of drinks and toppings.
 */
describe('Admin stock and topping stock', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customer: { id: string; email: string };
  let customerToken: string;
  let adminToken: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    customer = await seedUser(prisma, 'stock-e2e@example.com');
    customerToken = await loginAs(app, customer.email);

    const admin = await seedUser(prisma, 'stock-admin@example.com');
    await prisma.user.update({ where: { id: admin.id }, data: { role: 'ADMIN' } });
    adminToken = await loginAs(app, admin.email);
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  function seedTopping(stock: number) {
    return prisma.topping.create({
      data: { id: randomUUID(), name: `Topping e2e ${randomUUID()}`, price: 5000, stock },
    });
  }

  async function createOrder(items: Array<{ productId: string; qty: number; toppingIds: string[] }>) {
    const res = await http()
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ items: items.map((item) => ({ ...item, size: 'S' })) });
    expect(res.status).toBe(201);
    return res.body as { id: string };
  }

  const pay = (orderId: string) =>
    http()
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', randomUUID())
      .send({ orderId, method: 'WALLET' });

  const toppingStock = async (id: string) =>
    (await prisma.topping.findUnique({ where: { id } }))!.stock;
  const productStock = async (id: string) =>
    (await prisma.product.findUnique({ where: { id } }))!.stock;

  describe('admin: drink stock', () => {
    it('lists drinks with their stock for the admin', async () => {
      const product = await seedProduct(prisma, { stock: 7 });

      const res = await http().get('/api/v1/admin/products').set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const row = res.body.find((p: { id: string }) => p.id === product.id);
      expect(row).toMatchObject({ id: product.id, name: product.name, price: product.price, stock: 7 });
    });

    it('sets the stock of a drink and bumps its version (optimistic lock)', async () => {
      const product = await seedProduct(prisma, { stock: 0 });

      const res = await http()
        .patch(`/api/v1/admin/products/${product.id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ stock: 25 });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: product.id, stock: 25 });
      const saved = await prisma.product.findUnique({ where: { id: product.id } });
      expect(saved?.stock).toBe(25);
      expect(saved?.version).toBe(product.version + 1);
    });

    it('rejects a negative or non-integer stock with 400', async () => {
      const product = await seedProduct(prisma, { stock: 3 });
      for (const stock of [-1, 2.5, 'abc']) {
        const res = await http()
          .patch(`/api/v1/admin/products/${product.id}/stock`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ stock });
        expect(res.status).toBe(400);
      }
      expect(await productStock(product.id)).toBe(3);
    });

    it('answers 404 PRODUCT_NOT_FOUND for an unknown or malformed id', async () => {
      for (const id of [randomUUID(), 'not-a-uuid']) {
        const res = await http()
          .patch(`/api/v1/admin/products/${id}/stock`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ stock: 1 });
        expect(res.status).toBe(404);
        expect(res.body.code).toBe('PRODUCT_NOT_FOUND');
      }
    });

    it('does not let a customer read or change drink stock (403)', async () => {
      const product = await seedProduct(prisma, { stock: 4 });

      const list = await http().get('/api/v1/admin/products').set('Authorization', `Bearer ${customerToken}`);
      const patch = await http()
        .patch(`/api/v1/admin/products/${product.id}/stock`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ stock: 99 });

      expect(list.status).toBe(403);
      expect(patch.status).toBe(403);
      expect(await productStock(product.id)).toBe(4);
    });
  });

  describe('topping stock in the payment', () => {
    it('a paid order takes one topping portion per cup', async () => {
      const product = await seedProduct(prisma, { stock: 10 });
      const topping = await seedTopping(5);
      const order = await createOrder([{ productId: product.id, qty: 2, toppingIds: [topping.id] }]);

      const res = await pay(order.id);

      expect(res.body.status).toBe('PAID');
      expect(await toppingStock(topping.id)).toBe(3);
      expect(await productStock(product.id)).toBe(8);
    });

    it('not enough topping for the whole order: 409 OUT_OF_STOCK and nothing changes', async () => {
      const product = await seedProduct(prisma, { stock: 10 });
      const topping = await seedTopping(2);
      // 2 + 1 = 3 portions needed across two lines, only 2 in stock.
      const order = await createOrder([
        { productId: product.id, qty: 2, toppingIds: [topping.id] },
        { productId: product.id, qty: 1, toppingIds: [topping.id] },
      ]);
      const pointsBefore = (await prisma.user.findUnique({ where: { id: customer.id } }))!.loyaltyPoints;

      const res = await pay(order.id);

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('OUT_OF_STOCK');
      expect(await toppingStock(topping.id)).toBe(2);
      expect(await productStock(product.id)).toBe(10);
      expect((await prisma.order.findUnique({ where: { id: order.id } }))?.status).toBe('PENDING');
      expect((await prisma.user.findUnique({ where: { id: customer.id } }))!.loyaltyPoints).toBe(pointsBefore);
      expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(0);
    });

    it('a failed payment does not touch topping stock', async () => {
      const product = await seedProduct(prisma, { stock: 10 });
      const topping = await seedTopping(5);
      const order = await createOrder([{ productId: product.id, qty: 1, toppingIds: [topping.id] }]);

      process.env.PAYMENT_MOCK_MODE = 'failure';
      try {
        const res = await pay(order.id);
        expect(res.body.status).toBe('PAYMENT_FAILED');
      } finally {
        delete process.env.PAYMENT_MOCK_MODE;
      }

      expect(await toppingStock(topping.id)).toBe(5);
    });

    it('cancelling a PAID order gives the topping portions back', async () => {
      const product = await seedProduct(prisma, { stock: 10 });
      const topping = await seedTopping(6);
      const order = await createOrder([{ productId: product.id, qty: 3, toppingIds: [topping.id] }]);
      expect((await pay(order.id)).body.status).toBe('PAID');
      expect(await toppingStock(topping.id)).toBe(3);

      const res = await http()
        .patch(`/api/v1/admin/orders/${order.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CANCELLED' });

      expect(res.status).toBe(200);
      expect(await toppingStock(topping.id)).toBe(6);
      expect(await productStock(product.id)).toBe(10);
    });

    it('two payments racing for the last topping portion: exactly one PAID', async () => {
      const topping = await seedTopping(1);
      // Different drinks with plenty of stock, so only the topping is contested.
      const first = await seedProduct(prisma, { stock: 10 });
      const second = await seedProduct(prisma, { stock: 10 });
      const orderA = await createOrder([{ productId: first.id, qty: 1, toppingIds: [topping.id] }]);
      const orderB = await createOrder([{ productId: second.id, qty: 1, toppingIds: [topping.id] }]);

      const results = await Promise.all([pay(orderA.id), pay(orderB.id)]);

      const paid = results.filter((r) => r.body.status === 'PAID');
      const rejected = results.filter((r) => r.status === 409);
      expect(paid).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].body.code).toBe('OUT_OF_STOCK');
      expect(await toppingStock(topping.id)).toBe(0);
    });
  });

  describe('stock in product detail and saved cart', () => {
    it('GET /products/:id gives each topping its stock', async () => {
      const product = await seedProduct(prisma, { stock: 4 });
      const topping = await seedTopping(0);

      const res = await http().get(`/api/v1/products/${product.id}`);

      expect(res.status).toBe(200);
      expect(res.body.toppings.find((t: { id: string }) => t.id === topping.id)).toMatchObject({ stock: 0 });
    });

    it('GET /cart gives the current stock of each drink and topping', async () => {
      const product = await seedProduct(prisma, { stock: 9 });
      const topping = await seedTopping(3);
      const put = await http()
        .put('/api/v1/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ items: [{ productId: product.id, size: 'M', qty: 2, toppingIds: [topping.id] }] });
      expect(put.status).toBe(200);

      // Stock changes after the cart was saved (another customer bought the last ones).
      await prisma.product.update({ where: { id: product.id }, data: { stock: 1 } });
      await prisma.topping.update({ where: { id: topping.id }, data: { stock: 0 } });

      const res = await http().get('/api/v1/cart').set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      const line = res.body.items.find((item: { productId: string }) => item.productId === product.id);
      expect(line.product.stock).toBe(1);
      expect(line.toppings).toEqual([expect.objectContaining({ id: topping.id, stock: 0 })]);
    });
  });
});
