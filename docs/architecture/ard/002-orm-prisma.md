# ADR 002: Use Prisma as the ORM

**Status:** Accepted  
**Date:** 2026-10-19  
**Decision log:** [Decision 1](../../plans/decision-log.md)  
**Related tasks:** C-03, S-04, D-09, D-10, T-02

## Context

The assignment allows Prisma or TypeORM. The design needs transactions, optimistic-lock updates on stock, a composite unique constraint for idempotency, reproducible migrations, and a seed (Assignment 2, Task 5.2).

## Options considered

- Prisma
- TypeORM

## Decision

Use **Prisma** with PostgreSQL.

## Consequences

**Benefits**

- The stock update with a version check maps to `updateMany` with a conditional `where`, and a count of zero is the "no rows updated" branch in the sequence diagram.
- Migrations and seed are built in and reproducible.
- Interactive transactions (`$transaction`) and composite unique constraints (`@@unique([userId, idempotencyKey])`) are supported.
- Generated types are easier for a five-person team than decorator-based entities.

**Costs and risks**

- Prisma cannot express every constraint in its schema. Checks such as `stock >= 0`, `qty > 0`, and `discountAmount <= subtotal` must be added by editing the migration SQL (create the migration with `--create-only`, then add the checks) **(verify with the Prisma version in use)**.
- Less flexible than raw SQL for unusual queries; use `$queryRaw` only where needed.
- The Prisma client must be generated in CI and in the Docker build.

**Follow-up**

- Write `schema.prisma`, migrations, and seed (`C-03`); name the `db:migrate` and `db:seed` scripts.
- Run `prisma migrate deploy` as an explicit step before the API starts in CI and production.
- Remove the "Prisma or TypeORM" wording from the other documents (`D-10` done, `deployment.md` pending).

## Revisit if

The team already has strong TypeORM experience, or a required feature cannot be expressed with Prisma.

---
Back to the [ADR index](README.md). Architecture overview: [architecture.md](../architecture.md).
