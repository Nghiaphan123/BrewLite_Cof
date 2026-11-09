/**
 * AdminService — Business logic for Admin operations:
 * - Products (view drink stock, update drink stock)
 * - Toppings (view stock, update stock)
 * - Users (view all users)
 * - Promotions (view promotions, add new promo code)
 * - Orders (view order history across all users)
 */
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';
import { OrderStatus } from '../../generated/prisma/enums.js';
import { OrdersService } from '../orders/orders.service.js';
import { toAbsoluteImageUrl } from '../products/products.service.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) { }

  // -------------------------------------------------- Toppings
  async listToppings() {
    return this.prisma.topping.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        active: true,
      },
    });
  }

  async updateToppingStock(id: string, stock: number) {
    // A malformed id is a 404 like an unknown one, not a 500 from Postgres (uuid column).
    const existing = UUID_PATTERN.test(id)
      ? await this.prisma.topping.findUnique({ where: { id } })
      : null;
    if (!existing) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Topping not found',
        code: 'TOPPING_NOT_FOUND',
      });
    }

    return this.prisma.topping.update({
      where: { id },
      data: { stock },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        active: true,
      },
    });
  }

  // -------------------------------------------------- Products (drink stock)
  async listProducts() {
    const products = await this.prisma.product.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, price: true, imageUrl: true, stock: true },
    });
    return products.map((p) => ({ ...p, imageUrl: toAbsoluteImageUrl(p.imageUrl) }));
  }

  /**
   * Sets the number of cups in stock. The version is bumped as well, because
   * the payment decrements stock under an optimistic lock on Product.version
   * (ADR 0004 D1): a payment that read the old stock must not overwrite the
   * admin's new value.
   */
  async updateProductStock(id: string, stock: number) {
    const existing = UUID_PATTERN.test(id)
      ? await this.prisma.product.findUnique({ where: { id }, select: { id: true } })
      : null;
    if (!existing) {
      throw new NotFoundException({
        statusCode: 404,
        error: 'Not Found',
        message: 'Product not found',
        code: 'PRODUCT_NOT_FOUND',
      });
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { stock, version: { increment: 1 } },
      select: { id: true, name: true, price: true, imageUrl: true, stock: true },
    });
    return { ...updated, imageUrl: toAbsoluteImageUrl(updated.imageUrl) };
  }

  // -------------------------------------------------- Users
  async listUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        loyaltyPoints: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
    });
  }

  // -------------------------------------------------- Promotions
  async listPromotions() {
    return this.prisma.promotion.findMany({
      orderBy: { validFrom: 'desc' },
    });
  }

  async createPromotion(dto: CreatePromotionDto) {
    const normalizedCode = dto.code.trim().toUpperCase();

    const existing = await this.prisma.promotion.findUnique({
      where: { code: normalizedCode },
    });

    if (existing) {
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: `Promotion code ${normalizedCode} already exists`,
        code: 'PROMOTION_CODE_EXISTS',
      });
    }

    const validFrom = dto.validFrom ? new Date(dto.validFrom) : new Date();
    const validTo = new Date(dto.validTo);

    return this.prisma.promotion.create({
      data: {
        code: normalizedCode,
        type: dto.type,
        value: dto.value,
        minOrderTotal: dto.minOrderTotal ?? 0,
        validFrom,
        validTo,
        active: dto.active ?? true,
        usageLimit: dto.usageLimit ?? null,
        usedCount: 0,
      },
    });
  }

  // -------------------------------------------------- Orders
  async listOrders() {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
            toppings: {
              include: {
                topping: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      code: order.code,
      userId: order.userId,
      user: order.user,
      status: order.status,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      total: order.total,
      promoCode: order.promoCode,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        imageUrl: item.product.imageUrl,
        size: item.size,
        qty: item.qty,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        toppings: item.toppings.map((t) => ({
          id: t.topping.id,
          name: t.topping.name,
          unitPrice: t.unitPrice,
        })),
      })),
    }));
  }

  /**
   * Goes through OrdersService.transition, so the admin page obeys the same
   * state machine as everything else (PDF §9.1): illegal or payment-only
   * transitions get 409 INVALID_STATE_TRANSITION, a missing order gets 404.
   */
  async updateOrderStatus(id: string, status: OrderStatus) {
    const updated = await this.ordersService.transition(id, status);
    return {
      id: updated.id,
      code: updated.code,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }
}

