/**
 * ProductsService — menu list and product detail.
 *
 * Contract (api-contract.md §4–§5, ADR 0005 C2/C7):
 * - GET /products returns { items, total }. Each item is id, name, price,
 *   imageUrl, stock. No sizes or toppings (keeps the menu payload small).
 * - GET /products/:id returns the same fields plus sizes and the topping
 *   catalogue. Unknown or malformed id is 404 PRODUCT_NOT_FOUND, not 400.
 * - price and topping prices are integers in VND.
 * - Relative seed image paths are expanded to an absolute URL on WEB_ORIGIN,
 *   because the files live in apps/web/public.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Phase 1 every drink offers S/M/L. Price on the product is the S price. */
export const PRODUCT_SIZES = ['S', 'M', 'L'] as const;

export type ProductListItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
};

export type ToppingItem = {
  id: string;
  name: string;
  price: number;
};

export type ProductDetail = ProductListItem & {
  sizes: readonly string[];
  toppings: ToppingItem[];
};

export function toAbsoluteImageUrl(imageUrl: string): string {
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }
  const origin = (process.env.WEB_ORIGIN ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  return `${origin}${path}`;
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<{ items: ProductListItem[]; total: number }> {
    const rows = await this.prisma.product.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        stock: true,
      },
    });

    const items = rows.map((row) => this.toListItem(row));
    return { items, total: items.length };
  }

  async findOne(id: string): Promise<ProductDetail> {
    if (!UUID_PATTERN.test(id)) {
      this.notFound();
    }

    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        price: true,
        imageUrl: true,
        stock: true,
      },
    });

    if (!product) {
      this.notFound();
    }

    const toppings = await this.prisma.topping.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, price: true },
    });

    return {
      ...this.toListItem(product),
      sizes: PRODUCT_SIZES,
      toppings,
    };
  }

  private toListItem(row: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    stock: number;
  }): ProductListItem {
    return {
      id: row.id,
      name: row.name,
      price: row.price,
      imageUrl: toAbsoluteImageUrl(row.imageUrl),
      stock: row.stock,
    };
  }

  private notFound(): never {
    throw new NotFoundException({
      statusCode: 404,
      error: 'Not Found',
      message: 'Product not found',
      code: 'PRODUCT_NOT_FOUND',
    });
  }
}
