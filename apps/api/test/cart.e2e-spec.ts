import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createE2EApp } from './setup/e2e-app.js';
import { seedProduct, seedUser } from './setup/fixtures.js';
import { loginAs } from './setup/auth.js';
import { PrismaService } from '../src/common/prisma.service.js';

const UUID_A = '00000000-0000-4000-8000-00000000000a';
const UUID_B = '00000000-0000-4000-8000-00000000000b';

describe('Cart API', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let otherToken: string;
  let userIds: string[];
  let productId: string;
  let toppingId: string;

  const put = (authToken: string, body: object) =>
    request(app.getHttpServer())
      .put('/api/v1/cart')
      .set('Authorization', `Bearer ${authToken}`)
      .send(body);

  const get = (authToken: string) =>
    request(app.getHttpServer())
      .get('/api/v1/cart')
      .set('Authorization', `Bearer ${authToken}`);

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    const user = await seedUser(prisma, 'cart-e2e@example.com');
    const other = await seedUser(prisma, 'cart-other@example.com');
    userIds = [user.id, other.id];
    token = await loginAs(app, user.email);
    otherToken = await loginAs(app, other.email);
    productId = (await seedProduct(prisma, { price: 35000 })).id;
    toppingId = (await prisma.topping.create({
      data: { name: `Cart topping ${randomUUID()}`, price: 5000 },
    })).id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.topping.deleteMany({ where: { id: toppingId } });
    await app.close();
  });

  it('requires a token', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/cart');
    expect(res.status).toBe(401);
  });

  it('returns an empty cart for a user who has never saved one', async () => {
    const res = await get(token);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], promoCode: '', promotion: null });
  });

  it('saves the cart and returns it with product details', async () => {
    const saved = await put(token, {
      items: [{ productId, size: 'M', qty: 2, toppingIds: [toppingId, randomUUID()] }],
      promoCode: 'BREW10',
    });
    expect(saved.status).toBe(200);

    const res = await get(token);
    expect(res.body.promoCode).toBe('BREW10');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      productId,
      size: 'M',
      qty: 2,
      toppingIds: [toppingId],
      toppings: [{ id: toppingId, price: 5000 }],
      product: { id: productId, price: 35000 },
    });
  });

  it('replaces the previous cart rather than adding to it', async () => {
    await put(token, { items: [{ productId, size: 'L', qty: 1 }] });

    const res = await get(token);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({ size: 'L', qty: 1, toppingIds: [] });
    expect(res.body.promoCode).toBe('');
  });

  it('merges duplicate lines and caps the quantity at 99', async () => {
    const res = await put(token, {
      items: [
        { productId, size: 'S', qty: 60, toppingIds: [UUID_A, UUID_B] },
        { productId, size: 'S', qty: 60, toppingIds: [UUID_B, UUID_A] },
      ],
    });
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].qty).toBe(99);
  });

  it('keeps one user cart separate from another', async () => {
    await put(token, { items: [{ productId, size: 'M', qty: 3 }] });

    const res = await get(otherToken);
    expect(res.body.items).toEqual([]);
  });

  it('clears the cart with an empty items array', async () => {
    await put(token, { items: [{ productId, size: 'M', qty: 3 }] });
    await put(token, { items: [] });

    const res = await get(token);
    expect(res.body.items).toEqual([]);
  });

  it('rejects an unknown product and keeps the saved cart', async () => {
    await put(token, { items: [{ productId, size: 'M', qty: 1 }] });

    const res = await put(token, { items: [{ productId: randomUUID(), size: 'M', qty: 1 }] });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('PRODUCT_NOT_FOUND');

    const after = await get(token);
    expect(after.body.items).toHaveLength(1);
  });

  it.each([
    ['qty 0', { productId: 'x', size: 'M', qty: 0 }],
    ['an invalid size', { size: 'XL', qty: 1 }],
    ['qty over 99', { qty: 100, size: 'M' }],
    ['a topping id that is not a UUID', { qty: 1, size: 'M', toppingIds: ['pearl'] }],
  ])('rejects %s with 400', async (_name, item) => {
    const res = await put(token, { items: [{ productId, ...item }] });
    expect(res.status).toBe(400);
  });
});

describe('Order pricing matches the cart (ui-decisions.md §4.2)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let productId: string;
  let toppingIds: string[];

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    const user = await seedUser(prisma, 'pricing-e2e@example.com');
    userId = user.id;
    token = await loginAs(app, user.email);
    productId = (await seedProduct(prisma, { price: 35000 })).id;
    const toppings = await Promise.all(
      [5000, 8000].map((price) =>
        prisma.topping.create({ data: { name: `Pricing topping ${randomUUID()}`, price } }),
      ),
    );
    toppingIds = toppings.map((topping) => topping.id);
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.topping.deleteMany({ where: { id: { in: toppingIds } } });
    await app.close();
  });

  it.each([
    ['S', 35000],
    ['M', 40000],
    ['L', 45000],
  ])('charges the size %s price', async (size, unitPrice) => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId, size, qty: 2, toppingIds: [] }] });

    expect(res.status).toBe(201);
    expect(res.body.items[0].unitPrice).toBe(unitPrice);
    expect(res.body.total).toBe(unitPrice * 2);
  });

  it('adds size and topping prices together', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId, size: 'L', qty: 2, toppingIds }] });

    expect(res.status).toBe(201);
    expect(res.body.items[0].unitPrice).toBe(58000); // 35000 + 10000 + 5000 + 8000
    expect(res.body.total).toBe(116000);
  });
});

describe('Order pages list what was bought', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let productId: string;
  let toppingId: string;
  let toppingName: string;
  let orderCode: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    const user = await seedUser(prisma, 'order-items-e2e@example.com');
    userId = user.id;
    token = await loginAs(app, user.email);
    productId = (await seedProduct(prisma, { name: 'Latte', price: 45000 })).id;
    toppingName = `Order topping ${randomUUID()}`;
    toppingId = (await prisma.topping.create({ data: { name: toppingName, price: 5000 } })).id;
    const order = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ productId, size: 'L', qty: 2, toppingIds: [toppingId] }] });
    orderCode = order.body.code;
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.topping.deleteMany({ where: { id: toppingId } });
    await app.close();
  });

  const expectedLine = () => ({
    productId,
    name: 'Latte',
    size: 'L',
    qty: 2,
    lineTotal: 120000,
    toppings: [{ id: toppingId, name: toppingName, price: 5000 }],
  });

  it('GET /orders/me includes items with toppings', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/orders/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items[0].items).toEqual([expectedLine()]);
  });

  it('GET /orders/:code includes items with toppings', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/orders/${orderCode}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([expectedLine()]);
  });
});
