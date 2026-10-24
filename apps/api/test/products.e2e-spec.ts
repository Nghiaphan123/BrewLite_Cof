/**
 * Products API e2e (Task 15, api-contract.md §4–§5).
 *
 * Hits the real Nest app and the Compose Postgres. Creates its own rows so it
 * does not depend on seed data being loaded.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createE2EApp } from './setup/e2e-app.js';
import { PrismaService } from '../src/common/prisma.service.js';

describe('Products API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const productId = randomUUID();
  const toppingId = randomUUID();
  const productName = `e2e-product-${productId.slice(0, 8)}`;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    await prisma.product.create({
      data: {
        id: productId,
        name: productName,
        price: 35000,
        imageUrl: '/images/products/e2e.jpg',
        stock: 7,
      },
    });
    await prisma.topping.create({
      data: {
        id: toppingId,
        name: `e2e-topping-${toppingId.slice(0, 8)}`,
        price: 5000,
        active: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.topping.deleteMany({ where: { id: toppingId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await app.close();
  });

  it('GET /products returns the item without sizes or toppings', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/products');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.total).toBe(res.body.items.length);

    const item = res.body.items.find(
      (row: { id: string }) => row.id === productId,
    );
    expect(item).toEqual({
      id: productId,
      name: productName,
      price: 35000,
      imageUrl: 'http://localhost:3000/images/products/e2e.jpg',
      stock: 7,
    });
  });

  it('GET /products/:id returns sizes, toppings, and 404 for a missing id', async () => {
    const found = await request(app.getHttpServer()).get(
      `/api/v1/products/${productId}`,
    );

    expect(found.status).toBe(200);
    expect(found.body.id).toBe(productId);
    expect(found.body.price).toBe(35000);
    expect(found.body.sizes).toEqual(['S', 'M', 'L']);
    expect(found.body.toppings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: toppingId, price: 5000 }),
      ]),
    );

    const missing = await request(app.getHttpServer()).get(
      `/api/v1/products/${randomUUID()}`,
    );
    expect(missing.status).toBe(404);
    expect(missing.body).toMatchObject({
      statusCode: 404,
      code: 'PRODUCT_NOT_FOUND',
    });

    const malformed = await request(app.getHttpServer()).get(
      '/api/v1/products/not-a-uuid',
    );
    expect(malformed.status).toBe(404);
    expect(malformed.body.code).toBe('PRODUCT_NOT_FOUND');
  });
});
