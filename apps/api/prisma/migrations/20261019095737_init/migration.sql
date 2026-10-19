-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'PAYMENT_FAILED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Size" AS ENUM ('S', 'M', 'L');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('WALLET', 'CARD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARN', 'REVERSAL');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "loyalty_points" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "toppings" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "toppings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotal" INTEGER NOT NULL,
    "discount_amount" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "promotion_id" UUID,
    "stock_held" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "size" "Size" NOT NULL,
    "qty" INTEGER NOT NULL,
    "unit_price" INTEGER NOT NULL,
    "line_total" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_toppings" (
    "order_item_id" UUID NOT NULL,
    "topping_id" UUID NOT NULL,
    "unit_price" INTEGER NOT NULL,

    CONSTRAINT "order_item_toppings_pkey" PRIMARY KEY ("order_item_id","topping_id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refunded_at" TIMESTAMPTZ(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL,
    "value" INTEGER NOT NULL,
    "min_order_total" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMPTZ(3) NOT NULL,
    "valid_to" TIMESTAMPTZ(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "usage_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "type" "LoyaltyTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "toppings_name_key" ON "toppings"("name");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "orders_status_expires_at_idx" ON "orders"("status", "expires_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_user_id_idempotency_key_key" ON "payments"("user_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "loyalty_transactions_user_id_idx" ON "loyalty_transactions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "loyalty_transactions_order_id_type_key" ON "loyalty_transactions"("order_id", "type");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_toppings" ADD CONSTRAINT "order_item_toppings_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_toppings" ADD CONSTRAINT "order_item_toppings_topping_id_fkey" FOREIGN KEY ("topping_id") REFERENCES "toppings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Hand-written CHECK constraints (C-03).
-- Prisma cannot express these in schema.prisma (ADR 002), so they live here.
-- Keep them in sync with docs/diagrams/class-domain.md, section 5.
-- ---------------------------------------------------------------------------

-- Money and stock (ADR 006, ADR 007, FR-11)
ALTER TABLE "products" ADD CONSTRAINT "products_price_check" CHECK ("price" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_stock_check" CHECK ("stock" >= 0);
ALTER TABLE "products" ADD CONSTRAINT "products_version_check" CHECK ("version" >= 0);
ALTER TABLE "toppings" ADD CONSTRAINT "toppings_price_check" CHECK ("price" >= 0);

-- Orders: total = subtotal - discount, never negative (ADR 006, ADR 009)
ALTER TABLE "orders" ADD CONSTRAINT "orders_subtotal_check" CHECK ("subtotal" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_check" CHECK ("discount_amount" >= 0 AND "discount_amount" <= "subtotal");
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_check" CHECK ("total" >= 0 AND "total" = "subtotal" - "discount_amount");

-- Order lines
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_qty_check" CHECK ("qty" > 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_unit_price_check" CHECK ("unit_price" >= 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_line_total_check" CHECK ("line_total" = "unit_price" * "qty");
ALTER TABLE "order_item_toppings" ADD CONSTRAINT "order_item_toppings_unit_price_check" CHECK ("unit_price" >= 0);

-- Payments
ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_check" CHECK ("amount" >= 0);

-- Promotions: PERCENT is 1..100, FIXED is a positive VND amount (ADR 009)
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_code_check" CHECK ("code" ~ '^[A-Z0-9]+$');
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_value_check" CHECK ("value" > 0 AND ("type" <> 'PERCENT' OR "value" <= 100));
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_min_order_total_check" CHECK ("min_order_total" >= 0);
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_validity_check" CHECK ("valid_to" > "valid_from");
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_usage_check" CHECK ("used_count" >= 0 AND ("usage_limit" IS NULL OR "usage_limit" >= 0));

-- Loyalty: EARN is positive, REVERSAL is negative (ADR 009)
ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_points_check" CHECK (("type" = 'EARN' AND "points" >= 0) OR ("type" = 'REVERSAL' AND "points" <= 0));
