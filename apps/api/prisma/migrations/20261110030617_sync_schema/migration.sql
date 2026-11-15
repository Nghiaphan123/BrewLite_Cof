/*
  Warnings:

  - You are about to drop the `loyalty_transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "loyalty_transactions" DROP CONSTRAINT "loyalty_transactions_order_id_fkey";

-- DropForeignKey
ALTER TABLE "loyalty_transactions" DROP CONSTRAINT "loyalty_transactions_user_id_fkey";

-- DropTable
DROP TABLE "loyalty_transactions";

-- DropEnum
DROP TYPE "LoyaltyTransactionType";
