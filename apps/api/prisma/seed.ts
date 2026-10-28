// BrewLite - seed data (C-03)
//
// Run with `npm run db:seed` (Prisma runs `tsx prisma/seed.ts`, see prisma.config.ts).
// The seed is repeatable: every row has a fixed key and is upserted, so running it
// twice does not create duplicates (NFR-12, test DB-T02).
//
// Data volume follows decision 12 (performance method): about 30 products and
// 10 users, bcrypt cost 10. Prices are whole VND (ADR 006). Stock counts finished
// drinks (ADR 007). Promotions follow ADR 009.
//
// All data is synthetic. Do not put real customer data here.
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/client.js';

config({ path: ['.env', '../../.env'], quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env first.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

/** Fixed UUIDs keep the seed repeatable. Prefix by table, suffix by number. */
const id = (prefix: string, n: number): string =>
  `${prefix}-0000-4000-8000-${n.toString().padStart(12, '0')}`;

const BCRYPT_COST = 10;
/** Demo password for every seeded user. Override with SEED_USER_PASSWORD. */
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD ?? 'Brewlite@123';
const SEED_USER_COUNT = 10;

/** [name, size S price in VND, stock] */
const products: Array<[string, number, number]> = [
  ['Cà phê đen', 25000, 50],
  ['Cà phê sữa', 29000, 50],
  ['Bạc xỉu', 32000, 40],
  ['Cà phê muối', 35000, 40],
  ['Cà phê trứng', 39000, 30],
  ['Cà phê cốt dừa', 39000, 30],
  ['Espresso', 30000, 40],
  ['Americano', 35000, 40],
  ['Cappuccino', 45000, 30],
  ['Latte', 45000, 30],
  ['Caramel Macchiato', 49000, 25],
  ['Mocha', 49000, 25],
  ['Cold Brew', 45000, 20],
  ['Cold Brew cam sả', 49000, 20],
  ['Trà đào cam sả', 39000, 40],
  ['Trà vải', 39000, 40],
  ['Trà sen vàng', 42000, 30],
  ['Trà ô long sữa', 39000, 30],
  ['Trà sữa trân châu', 35000, 50],
  ['Trà xanh Matcha Latte', 45000, 25],
  ['Matcha đá xay', 52000, 20],
  ['Cookie đá xay', 52000, 20],
  ['Chocolate nóng', 42000, 25],
  ['Chocolate đá xay', 52000, 20],
  ['Sinh tố bơ', 45000, 15],
  ['Sinh tố xoài', 42000, 15],
  ['Nước ép cam', 39000, 20],
  ['Nước ép dưa hấu', 35000, 20],
  ['Yogurt việt quất', 42000, 15],
  // Low stock on purpose: used by the out-of-stock and concurrency tests (AC-05, AC-06).
  ['Cà phê phin giới hạn', 55000, 1],
];

/** Topping price is +5,000 VND each (decision 6). */
const toppings: string[] = [
  'Trân châu đen',
  'Thạch cà phê',
  'Kem cheese',
  'Shot espresso',
  'Thạch đào',
];
const TOPPING_PRICE = 5000;

async function seedProducts(): Promise<void> {
  for (const [index, [name, price, stock]] of products.entries()) {
    const productId = id('10000000', index + 1);
    await prisma.product.upsert({
      where: { id: productId },
      // Re-running the seed refreshes the menu but does not reset live stock.
      update: { name, price, imageUrl: `/images/products/${index + 1}.jpg` },
      create: {
        id: productId,
        name,
        price,
        imageUrl: `/images/products/${index + 1}.jpg`,
        stock,
      },
    });
  }
}

async function seedToppings(): Promise<void> {
  for (const [index, name] of toppings.entries()) {
    await prisma.topping.upsert({
      where: { id: id('20000000', index + 1) },
      update: { name, price: TOPPING_PRICE, active: true },
      create: { id: id('20000000', index + 1), name, price: TOPPING_PRICE },
    });
  }
}

async function seedUsers(): Promise<void> {
  const passwordHash = await bcrypt.hash(SEED_USER_PASSWORD, BCRYPT_COST);
  for (let n = 1; n <= SEED_USER_COUNT; n++) {
    const email = `customer${n.toString().padStart(2, '0')}@brewlite.test`;
    await prisma.user.upsert({
      where: { email },
      // Existing users keep their password and points.
      update: {},
      create: {
        id: id('30000000', n),
        name: `Customer ${n.toString().padStart(2, '0')}`,
        email,
        passwordHash,
      },
    });
  }
}

async function seedPromotions(): Promise<void> {
  const validFrom = new Date('2026-01-01T00:00:00Z');
  const validTo = new Date('2027-12-31T23:59:59Z');
  const promotions = [
    // 10 percent off, no minimum (ADR 009).
    { code: 'BREW10', type: 'PERCENT' as const, value: 10, minOrderTotal: 0 },
    // 20,000 VND off. The minimum keeps the discount below the subtotal (decision 16).
    {
      code: 'WELCOME20K',
      type: 'FIXED' as const,
      value: 20000,
      minOrderTotal: 50000,
    },
  ];
  for (const [index, promo] of promotions.entries()) {
    await prisma.promotion.upsert({
      where: { code: promo.code },
      // usedCount is live data and is not reset.
      update: { ...promo, validFrom, validTo, active: true },
      create: { id: id('40000000', index + 1), ...promo, validFrom, validTo },
    });
  }
}

async function main(): Promise<void> {
  await seedProducts();
  await seedToppings();
  await seedUsers();
  await seedPromotions();
  const [productCount, toppingCount, userCount, promotionCount] =
    await Promise.all([
      prisma.product.count(),
      prisma.topping.count(),
      prisma.user.count(),
      prisma.promotion.count(),
    ]);
  console.log(
    `Seed done: ${productCount} products, ${toppingCount} toppings, ` +
      `${userCount} users, ${promotionCount} promotions.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
