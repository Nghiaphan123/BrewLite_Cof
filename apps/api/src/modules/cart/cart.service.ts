/**
 * CartService — read and replace the caller's saved cart.
 *
 * Why it exists:
 * - Keeps a logged-in customer's cart across devices and browsers. The web app
 *   still owns cart editing (Zustand) and sends the whole cart after a change.
 *
 * Contract (api-contract.md §11.1):
 * - get: 200 { items, promoCode }; a user with no saved cart gets an empty one.
 * - replace: 200 with the same shape. Unknown product is 404 PRODUCT_NOT_FOUND.
 * - Each line carries the current stock of its drink (product.stock) and of
 *   each topping (toppings[].stock), so the web app can warn about a sold-out
 *   item in a saved cart. The payment is still the step that enforces stock.
 *
 * Pricing:
 * - Nothing here is a price the customer pays. POST /orders computes the total
 *   from server prices, so a cart can never change what an order costs.
 *
 * Boundary:
 * - Depends on PrismaService (common/). Throws Nest exceptions; the global
 *   filter formats them.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';
import { toAbsoluteImageUrl } from '../products/products.service.js';

const MAX_QTY = 99;

interface CartItemInput {
  productId: string;
  size: 'S' | 'M' | 'L';
  qty: number;
  toppingIds?: string[];
}

const cartInclude = {
  items: {
    include: { product: true },
    orderBy: { id: 'asc' },
  },
} as const;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) { }

  async get(userId: string) {
    return this.toResponse(await this.findForResponse(userId));
  }

  async replace(userId: string, items: CartItemInput[], promoCode?: string) {
    const lines = this.mergeLines(items);

    await this.prisma.$transaction(async (tx) => {
      const productIds = [...new Set(lines.map((line) => line.productId))];
      const found = await tx.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true },
      });
      const foundIds = new Set(found.map((product) => product.id));
      const missing = productIds.find((id) => !foundIds.has(id));
      if (missing) {
        throw new NotFoundException({
          statusCode: 404,
          error: 'Not Found',
          message: `Product ${missing} not found`,
          code: 'PRODUCT_NOT_FOUND',
        });
      }

      const saved = await tx.cart.upsert({
        where: { userId },
        update: { promoCode: promoCode || null },
        create: { userId, promoCode: promoCode || null },
      });
      await tx.cartItem.deleteMany({ where: { cartId: saved.id } });
      await tx.cartItem.createMany({
        data: lines.map((line) => ({ ...line, cartId: saved.id })),
      });
    });

    return this.get(userId);
  }

  /** The same product, size, and toppings is one line, whatever order the toppings came in. */
  private mergeLines(items: CartItemInput[]) {
    const lines = new Map<string, Required<CartItemInput>>();
    for (const item of items) {
      const toppingIds = [...new Set(item.toppingIds ?? [])].sort();
      const key = `${item.productId}|${item.size}|${toppingIds.join(',')}`;
      const existing = lines.get(key);
      lines.set(key, {
        productId: item.productId,
        size: item.size,
        toppingIds,
        qty: Math.min((existing?.qty ?? 0) + item.qty, MAX_QTY),
      });
    }
    return [...lines.values()];
  }

  private async toResponse(cart: Awaited<ReturnType<CartService['findForResponse']>>) {
    const toppingIds = [...new Set((cart?.items ?? []).flatMap((item) => item.toppingIds))];
    const toppings = await this.prisma.topping.findMany({
      where: { id: { in: toppingIds }, active: true },
      select: { id: true, name: true, price: true, stock: true },
    });
    const toppingById = new Map(toppings.map((topping) => [topping.id, topping]));

    return {
      items: (cart?.items ?? []).map((item) => {
        // A topping that was removed or hidden drops out of the line here.
        const lineToppings = item.toppingIds.flatMap((id) => toppingById.get(id) ?? []);
        return {
          productId: item.productId,
          size: item.size,
          qty: item.qty,
          toppingIds: lineToppings.map((topping) => topping.id),
          toppings: lineToppings,
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            imageUrl: toAbsoluteImageUrl(item.product.imageUrl),
            // Stock is read live, so a cart saved days ago still shows that a
            // drink or a topping has run out before the customer pays.
            stock: item.product.stock,
          },
        };
      }),
      promoCode: cart?.promoCode ?? '',
      promotion: await this.findUsablePromotion(cart?.promoCode),
    };
  }

  /** The rule the web needs to preview the discount; null when the code can no longer be used. */
  private async findUsablePromotion(code?: string | null) {
    if (!code) return null;
    const promo = await this.prisma.promotion.findUnique({ where: { code } });
    const now = new Date();
    const usable =
      promo?.active &&
      now >= promo.validFrom &&
      now <= promo.validTo &&
      (promo.usageLimit === null || promo.usedCount < promo.usageLimit);
    return usable
      ? { code: promo.code, type: promo.type, value: promo.value, minOrderTotal: promo.minOrderTotal }
      : null;
  }

  private findForResponse(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: cartInclude,
    });
  }
}
