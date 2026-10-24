import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

const PRODUCT_ID = '10000000-0000-4000-8000-000000000001';

describe('ProductsController', () => {
  let controller: ProductsController;
  const productsService = {
    list: vi.fn(),
    findOne: vi.fn(),
  };

  beforeEach(async () => {
    productsService.list.mockReset();
    productsService.findOne.mockReset();

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: productsService }],
    }).compile();

    controller = moduleRef.get(ProductsController);
  });

  it('returns the menu collection from the service', async () => {
    const body = {
      items: [
        {
          id: PRODUCT_ID,
          name: 'Americano',
          price: 35000,
          imageUrl: 'https://cdn.example.com/americano.jpg',
          stock: 15,
        },
      ],
      total: 1,
    };
    productsService.list.mockResolvedValue(body);

    await expect(controller.list()).resolves.toEqual(body);
  });

  it('returns one product from the service', async () => {
    const body = {
      id: PRODUCT_ID,
      name: 'Americano',
      price: 35000,
      imageUrl: 'https://cdn.example.com/americano.jpg',
      stock: 15,
      sizes: ['S', 'M', 'L'],
      toppings: [],
    };
    productsService.findOne.mockResolvedValue(body);

    await expect(controller.findOne(PRODUCT_ID)).resolves.toEqual(body);
    expect(productsService.findOne).toHaveBeenCalledWith(PRODUCT_ID);
  });

  it('propagates 404 when the product does not exist', async () => {
    productsService.findOne.mockRejectedValue(
      new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND',
      }),
    );

    await expect(controller.findOne(PRODUCT_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
