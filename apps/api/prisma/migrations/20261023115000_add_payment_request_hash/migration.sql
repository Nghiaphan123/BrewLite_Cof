-- AlterTable
ALTER TABLE "payments" ADD COLUMN "request_hash" TEXT NOT NULL DEFAULT '';

-- Remove default constraint so future inserts require a valid hash
ALTER TABLE "payments" ALTER COLUMN "request_hash" DROP DEFAULT;
