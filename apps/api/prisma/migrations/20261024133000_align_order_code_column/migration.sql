-- The sequence migration assumed "orders.code" already existed.
-- A database created from 20261019095737_init does not have that column,
-- and still has expires_at / stock_held, which are no longer in schema.prisma.
-- This migration makes the orders table match the current schema.

ALTER TABLE "orders" ADD COLUMN "code" TEXT;
ALTER TABLE "orders" ADD COLUMN "promo_code" TEXT;

UPDATE "orders"
SET "code" = 'BL-' || to_char(created_at, 'YYYY') || '-' || lpad(nextval('order_code_seq')::text, 4, '0')
WHERE "code" IS NULL;

ALTER TABLE "orders" ALTER COLUMN "code" SET NOT NULL;

CREATE UNIQUE INDEX "orders_code_key" ON "orders"("code");

DROP INDEX IF EXISTS "orders_status_expires_at_idx";

ALTER TABLE "orders" DROP COLUMN "expires_at";
ALTER TABLE "orders" DROP COLUMN "stock_held";
