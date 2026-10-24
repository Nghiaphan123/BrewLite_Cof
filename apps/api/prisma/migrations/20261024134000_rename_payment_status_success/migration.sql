-- schema.prisma uses SUCCESS. The init migration created SUCCEEDED.
ALTER TYPE "PaymentStatus" RENAME VALUE 'SUCCEEDED' TO 'SUCCESS';
