import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ProductsService,
  toAbsoluteImageUrl,
} from './products.service.js';

const PRODUCT_ID = '10000000-0000-4000-8000-000000000001';

function mockPrisma() {
  return {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    topping: {
      findMany: vi.fn(),
    },
  };
}

describe('toAbsoluteImageUrl', () => {
  it('leaves an absolute URL unchanged', () => {
    expect(toAbsoluteImageUrl('https://cdn.example.com/ca-phe-sua.jpg')).toBe(
      'https://cdn.example.com/ca-phe-sua.jpg',
    );
  });

  it('prefixes a seed path with WEB_ORIGIN', () => {
    process.env.WEB_ORIGIN = 'http://localhost:3000/';
    expect(toAbsoluteImageUrl('/images/products/1.jpg')).toBe(
      'http://localhost:3000/images/products/1.jpg',
    );
  });
});

describe('ProductsService', () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let service: ProductsService;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new ProductsService(prisma as never);
  });

  it('lists products as { items, total } without sizes or toppings', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: PRODUCT_ID,
        name: 'Cà phê sữa',
        price: 35000,
        imageUrl: '/images/products/2.jpg',
        stock: 20,
      },
    ]);

    const result = await service.list();

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        stock: true,
      },
    });
    expect(result.total).toBe(1);
    expect(result.items[0]).toEqual({
      id: PRODUCT_ID,
      name: 'Cà phê sữa',
      price: 35000,
      imageUrl: 'http://localhost:3000/images/products/2.jpg',
      stock: 20,
    });
    expect(result.items[0]).not.toHaveProperty('sizes');
    expect(result.items[0]).not.toHaveProperty('toppings');
    expect(result.items[0]).not.toHaveProperty('version');
  });

  it('returns an empty collection, not 404, when the menu is empty', async () => {
    prisma.product.findMany.mockResolvedValue([]);

    await expect(service.list()).resolves.toEqual({ items: [], total: 0 });
  });

  it('returns one product with sizes and active toppings', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: PRODUCT_ID,
      name: 'Cà phê sữa',
      price: 29000,
      imageUrl: 'https://cdn.example.com/ca-phe-sua.jpg',
      stock: 50,
    });
    prisma.topping.findMany.mockResolvedValue([
      { id: 't1', name: 'Kem cheese', price: 5000 },
      { id: 't2', name: 'Trân châu đen', price: 5000 },
    ]);

    const result = await service.findOne(PRODUCT_ID);

    expect(result).toEqual({
      id: PRODUCT_ID,
      name: 'Cà phê sữa',
      price: 29000,
      imageUrl: 'https://cdn.example.com/ca-phe-sua.jpg',
      stock: 50,
      sizes: ['S', 'M', 'L'],
      toppings: [
        { id: 't1', name: 'Kem cheese', price: 5000 },
        { id: 't2', name: 'Trân châu đen', price: 5000 },
      ],
    });
    expect(prisma.topping.findMany).toHaveBeenCalledWith({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, price: true },
    });
  });

  it('returns 404 PRODUCT_NOT_FOUND for a malformed id', async () => {
    await expect(service.findOne('not-a-uuid')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.product.findUnique).not.toHaveBeenCalled();
  });

  it('returns 404 PRODUCT_NOT_FOUND when the id is missing', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    try {
      await service.findOne(PRODUCT_ID);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).getResponse()).toMatchObject({
        statusCode: 404,
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND',
      });
    }
  });
});
