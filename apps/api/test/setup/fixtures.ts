import { PrismaService } from '../../src/common/prisma.service.js';
import { randomUUID, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export async function seedUser(
  prisma: PrismaService,
  email?: string,
  password = 'correct-horse-battery',
) {
  // Ensure email uniqueness across test runs. If an email is provided, append a UUID to the local part.
  // If no email is provided, generate a random one.
  const finalEmail = email
    ? `${email.split('@')[0]}-${randomUUID()}@${email.split('@')[1]}`
    : `e2e-${randomUUID()}@example.com`;
  return prisma.user.create({
    data: {
      id: randomUUID(),
      email: finalEmail,
      passwordHash: hashPassword(password),
      loyaltyPoints: 0,
    },
  });
}

export async function seedProduct(
  prisma: PrismaService,
  overrides: { stock?: number; price?: number; name?: string } = {},
) {
  return prisma.product.create({
    data: {
      id: randomUUID(),
      name: overrides.name ?? 'Cà phê sữa',
      price: overrides.price ?? 35000,
      imageUrl: 'https://example.com/x.jpg',
      stock: overrides.stock ?? 10,
      version: 0,
    },
  });
}

export async function seedOrder(
  prisma: PrismaService,
  userId: string,
  productId: string,
  overrides: { qty?: number; total?: number } = {},
) {
  const qty = overrides.qty ?? 1;
  const total = overrides.total ?? 35000 * qty;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);

  return prisma.order.create({
    data: {
      id: randomUUID(),
      userId,
      status: 'PENDING',
      subtotal: total,
      discountAmount: 0,
      total,
      stockHeld: true,
      expiresAt,
      items: {
        create: [
          {
            id: randomUUID(),
            productId,
            size: 'M',
            qty,
            unitPrice: 35000,
            lineTotal: total,
          },
        ],
      },
    },
    include: { items: true },
  });
}

/** Compute the same hash the payments service computes for idempotency. */
export function hashPaymentRequest(input: { orderId: string; method: string }): string {
  const canonical = JSON.stringify({ orderId: input.orderId, method: input.method });
  return createHash('sha256').update(canonical).digest('hex');
}
