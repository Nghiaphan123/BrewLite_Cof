import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrdersService } from './orders.service.js';

const USER_ID = '30000000-0000-4000-8000-000000000001';
const OTHER_ID = '30000000-0000-4000-8000-000000000002';

function mockPrisma() {
  return {
    order: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  };
}

describe('OrdersService read endpoints', () => {
  let prisma: ReturnType<typeof mockPrisma>;
  let service: OrdersService;

  beforeEach(() => {
    prisma = mockPrisma();
    service = new OrdersService(prisma as never, {} as never);
  });

  it('lists only the caller orders, newest first', async () => {
    const createdAt = new Date('2026-10-22T14:30:00.000Z');
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'order-1',
        code: 'BL-2026-0002',
        status: 'PAID',
        total: 95000,
        createdAt,
      },
    ]);

    const result = await service.listMine(USER_ID);

    expect(prisma.order.findMany).toHaveBeenCalledWith({
      where: { userId: USER_ID },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        status: true,
        total: true,
        createdAt: true,
      },
    });
    expect(result).toEqual({
      items: [
        {
          id: 'order-1',
          code: 'BL-2026-0002',
          status: 'PAID',
          total: 95000,
          createdAt,
        },
      ],
      total: 1,
    });
  });

  it('returns an empty history instead of 404', async () => {
    prisma.order.findMany.mockResolvedValue([]);
    await expect(service.listMine(USER_ID)).resolves.toEqual({
      items: [],
      total: 0,
    });
  });

  it('returns detail with a successful payment and earned points', async () => {
    const createdAt = new Date('2026-10-22T14:30:00.000Z');
    const paidAt = new Date('2026-10-22T14:31:00.000Z');
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      code: 'BL-2026-0001',
      userId: USER_ID,
      status: 'PAID',
      total: 95000,
      createdAt,
      items: [
        {
          productId: 'product-1',
          product: { name: 'Cà phê sữa' },
          size: 'M',
          qty: 2,
          lineTotal: 80000,
        },
      ],
      payments: [
        {
          method: 'WALLET',
          amount: 95000,
          createdAt: paidAt,
          status: 'SUCCESS',
        },
      ],
    });

    const result = await service.findByCode(USER_ID, 'BL-2026-0001');

    expect(result.payment).toEqual({
      method: 'WALLET',
      paidAt,
      loyaltyPointsEarned: 95,
    });
    expect(result.items[0].name).toBe('Cà phê sữa');
  });

  it('returns payment null when the order was never paid', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      code: 'BL-2026-0001',
      userId: USER_ID,
      status: 'PENDING',
      total: 35000,
      createdAt: new Date(),
      items: [],
      payments: [],
    });

    const result = await service.findByCode(USER_ID, 'BL-2026-0001');
    expect(result.payment).toBeNull();
  });

  it('hides another user order as 404', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      code: 'BL-2026-0001',
      userId: OTHER_ID,
      items: [],
      payments: [],
    });

    await expect(service.findByCode(USER_ID, 'BL-2026-0001')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
