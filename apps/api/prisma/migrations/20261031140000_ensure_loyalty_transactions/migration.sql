-- The init migration creates loyalty_transactions. Some local databases
-- were applied before that table was in the init file, so Prisma thinks
-- init ran and never creates the table. This migration is a no-op when
-- the table already exists.

DO $$ BEGIN
  CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARN', 'REVERSAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "loyalty_transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "type" "LoyaltyTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "loyalty_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "loyalty_transactions_user_id_idx" ON "loyalty_transactions"("user_id");

CREATE UNIQUE INDEX IF NOT EXISTS "loyalty_transactions_order_id_type_key" ON "loyalty_transactions"("order_id", "type");

DO $$ BEGIN
  ALTER TABLE "loyalty_transactions"
    ADD CONSTRAINT "loyalty_transactions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "loyalty_transactions"
    ADD CONSTRAINT "loyalty_transactions_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "loyalty_transactions"
    ADD CONSTRAINT "loyalty_transactions_points_check"
    CHECK (("type" = 'EARN' AND "points" >= 0) OR ("type" = 'REVERSAL' AND "points" <= 0));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
