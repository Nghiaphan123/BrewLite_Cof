# ADR 0003 — PostgreSQL + Prisma as the data layer

- **Status:** Proposed → Accepted when Task 1.0 (ERD) closes
- **Date:** 2026-10-22
- **Deciders:** H.Tài, Nghĩa
- **Related:** [ADR 0001](0001-record-architecture-decisions.md), [ADR 0002](0002-monorepo-two-apps.md), [Configuration](../../config.md) §2.1, §3, [Product Backlog](../../requirements/product-backlog.md) Task 1, Task 10c, [Scenarios](../../requirements/scenarios.md) S-ORD-6

## Context

BrewLite needs a relational database and a data-access layer in `apps/api` (NestJS). The assignment (PDF §6) specifies:

- **PostgreSQL** as the database (or "gợi ý PostgreSQL qua Prisma/TypeORM").
- **Prisma or TypeORM** as the ORM — the assignment names both and does not mandate one.

The entities are known from the assignment (PDF §12.2): `Product`, `User`, `Order`, `OrderItem`, `Payment`. Task 10 adds `Promotion`, `LoyaltyPoints` (or a column on `User`), and a stock/version field for optimistic locking. Task 1.0's ERD will finalize the schema.

The requirements that constrain the choice:

1. **Relational integrity matters.** `OrderItem` references `Order` and `Product`; `Payment` references `Order`. Foreign keys and cascade behavior must be explicit, not implicit.
2. **Transactions and locking are required.** Task 10c (PDF §9.3) requires "transaction + optimistic locking" for stock control under concurrency. The ORM must expose both clearly, and the team must be able to write the integration test in `scenarios.md` S-ORD-6.
3. **The schema changes across Sprints.** Phase 2 adds `Product`; Phase 3 adds `Order`, `OrderItem`, `User`; Phase 4 adds `Payment`; Phase 5 adds `Promotion` and loyalty. Migrations must be reviewable in PRs and reversible in dev.
4. **Seed data is part of the deliverable.** Task 9.0/14.0 requires a seeded menu; the seed must be re-runnable after a reset (`setup.md` §6).
5. **The team has limited ORM experience.** The decision should minimize the amount of new tooling learned under deadline, while still teaching a marketable skill.

The team has two real options (Prisma, TypeORM) and one fallback (raw `pg`), plus the database choice itself (PostgreSQL vs. SQLite vs. MySQL).

## Decision

BrewLite uses **PostgreSQL 16** as the database and **Prisma 6** as the ORM and migration tool, with **`prisma migrate dev`** for schema evolution and **`prisma db seed`** for seed data.

Rules that follow from this:

1. **The schema lives in `apps/api/prisma/schema.prisma`.** It is the single source of truth for the data model. No hand-written SQL `CREATE TABLE` in the repo; if a migration needs raw SQL, it is added as a Prisma migration file and reviewed like any other change.
2. **Every schema change is a migration.** `prisma migrate dev --name <slug>` creates a migration file under `prisma/migrations/`. The migration file is committed with the schema change in the same PR. `prisma migrate reset` is the dev recovery path (`setup.md` §6).
3. **The Prisma client is the only data-access path.** Services in `apps/api/src/modules/*/` call `PrismaService` (a Nest provider wrapping `PrismaClient`). No module imports `pg` directly.
4. **Transactions are `prisma.$transaction`.** Task 10c's stock control uses `prisma.$transaction` with an optimistic-lock `version` field on the stock-bearing row. The lock strategy is recorded in ADR 0004 (payment and state machine), not here; this ADR only says the transaction primitive is Prisma's.
5. **Seed data is `apps/api/prisma/seed.ts`.** It is idempotent-or-reset-dependent: it assumes a fresh DB or a `migrate reset`, and does not upsert in Phase 1 (recorded in `setup.md` troubleshooting).
6. **PostgreSQL runs via `docker-compose.yml`** in dev (`setup.md` §3). The host port is `5432` by default and may be remapped to `5433` if a local Postgres is present (`config.md` §1.3).
7. **The connection string is `DATABASE_URL`** in `apps/api/.env` (`config.md` §2.1). No connection parameters are hard-coded in code.
8. **Prisma Studio is the dev DB inspector.** `npx prisma studio` (port `5555`) is the documented way to inspect seeded data (`setup.md` §8). A direct `psql` client is optional.

The choice is conditional on Task 1.0's ERD confirming that the five entities plus Task 10's additions fit the relational model without surprises (they do, per PDF §12.2). If the ERD reveals a requirement that Prisma cannot express cleanly (e.g. a composite foreign key with a custom name that Prisma's migration output mangles), the team reopens this ADR **before** Task 1.0 closes — not after Phase 2 has written schema-dependent code.

## Consequences

### Positive

- **The schema is declarative and reviewable.** `schema.prisma` is a single readable file; a PR that adds `Order` and `OrderItem` shows the model, relations, and indexes in one diff. TypeORM's entity decorators spread the same information across TypeScript classes.
- **Migrations are generated and diffable.** `prisma migrate dev` produces a named SQL migration file; reviewers see the actual SQL. TypeORM's `synchronize: true` (the default in many tutorials) is unsafe in production and easy to leave on by accident; Prisma's model forces explicit migrations.
- **The Prisma client is type-safe end to end.** `prisma.order.findMany({ where: { userId } })` returns a typed result; no `any` casting, no manual row mapping. This pays off in `apps/api/src/modules/orders/` where the state machine and idempotency logic need to trust the types.
- **Seed data is a first-class script.** `prisma/seed.ts` is the documented seed entry point, configured in `package.json` under `prisma.seed`. No bespoke seeding script.
- **Prisma Studio is a zero-setup DB inspector.** Task 1.0's ERD review and Task 9.0's seed review can be done by a teammate who has never used `psql`.
- **It's the assignment's first-listed option.** PDF §6 says "Prisma/TypeORM"; choosing the first-listed one removes a question at grading time.
- **The team learns a tool that's in demand.** Prisma is widely used in NestJS + Next.js stacks; the skill transfers.

### Negative / costs

- **Prisma is a client-generation step.** After `npm install` or a schema change, `npx prisma generate` must run before the API builds. This is documented in `setup.md` §6 and §9, but it is a step TypeORM does not have. If a teammate's build fails with "Prisma client not found," the fix is one command — but they have to know it.
- **Raw SQL escape hatches are less ergonomic.** Complex queries (e.g. a future reporting query) may need `$queryRaw`; the team should avoid raw SQL in Phase 1. Task 10c's locking is the one place that may need `$transaction` with a raw `UPDATE ... WHERE version = ?` or Prisma's interactive transaction; record the exact form in ADR 0004.
- **Prisma's migration diff can be surprising.** Renaming a column can generate a drop + add instead of a rename, which loses data. In dev, `migrate reset` masks this; in a graded demo with seeded data, it matters. Mitigation: review every generated migration before committing; prefer adding columns over renaming.
- **`prisma migrate dev` is dev-only.** `migrate deploy` is the production path (Phase 2+ deployment doc). The team should not use `migrate dev` against a shared DB.
- **A second tool to learn.** The team already learns NestJS and Next.js; Prisma is a third. It's a smaller surface than TypeORM's, but it is non-zero.

### Neutral

- The database choice (PostgreSQL) is independent of the ORM choice. The assignment names PostgreSQL; the team is not debating SQLite vs. Postgres. If it were debated, the concurrency requirement (Task 10c) would rule out SQLite's single-writer model.
- Prisma's `version` field and optimistic locking are Prisma-idiomatic; TypeORM's `@VersionColumn()` is equally idiomatic. The ORM choice does not change the *strategy*, only the syntax.
- The choice does not affect the frontend. `apps/web` talks to the API, not the DB.

## Alternatives considered

| Alternative                                     | Why rejected                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TypeORM**                                     | The assignment's other named option. Rejected because: (a) `synchronize: true` is the default in most tutorials and is unsafe if left on; (b) entity decorators spread the schema across files, making ERD-to-code review harder; (c) migration generation is less deterministic than Prisma's; (d) the team's prior exposure is mixed. It is a viable fallback if Prisma's migration output proves unworkable during Task 1.0 — see "When to revisit." |
| **Raw `pg` (node-postgres)**                    | Rejected: no type safety, no migration tool, no relation modeling. The team would hand-write SQL for five entities and Task 10's locking. Too much surface for a one-semester MVP.                                                                                                                                                                                                                                                                      |
| **Drizzle ORM**                                 | Modern, type-safe, SQL-like. Rejected: less common in NestJS examples, smaller ecosystem, and the assignment names Prisma/TypeORM specifically. Choosing Drizzle invites a "why not the named options?" question at grading with no compensating benefit for this team.                                                                                                                                                                                 |
| **MongoDB / Mongoose**                          | Rejected: the entities are relational (Order → OrderItem → Product; Payment → Order). A document store would require application-level joins and would make the "transaction + optimistic locking" requirement (Task 10c) harder, not easier. The assignment names PostgreSQL.                                                                                                                                                                          |
| **SQLite**                                      | Rejected: single-writer concurrency model conflicts with Task 10c's "concurrent orders do not oversell" requirement. Also not the assignment's named DB.                                                                                                                                                                                                                                                                                                |
| **MySQL / MariaDB**                             | Viable, but the assignment names PostgreSQL and `docker-compose.yml` already uses a Postgres image. No reason to deviate.                                                                                                                                                                                                                                                                                                                               |
| **Prisma with `db push` instead of migrations** | Rejected: `db push` is for prototyping; it leaves no migration history, which the assignment's DoD (reviewable commits) and Task 10c (reviewable lock strategy) both benefit from.                                                                                                                                                                                                                                                                      |

## When to revisit

Reopen this ADR (new ADR superseding 0003) if any of the following becomes true:

- Task 1.0's ERD reveals a schema requirement Prisma cannot express cleanly (composite keys with custom names, partial indexes that Prisma's migration output mangles, etc.).
- Task 10c's locking proves to require a raw-SQL transaction that Prisma's interactive transactions cannot express safely, and the workaround is too fragile to review.
- The team's Prisma learning cost dominates Sprint 1 and threatens the schedule. (Unlikely — the scaffold's `prisma/schema.prisma` already exists.)
- A grading requirement or a teammate's prior experience makes TypeORM clearly cheaper. (The ADR records the trade-off either way.)

A switch to TypeORM after Phase 2 would require re-writing the schema, migrations, and seed — a multi-day cost. This is why the "revisit before Task 1.0 closes" condition is stated explicitly.

## Open questions

| Question                                                                                             | Owner | Closes when                                                        |
| ---------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------ |
| Confirm the five entities plus Task 10 additions fit the relational model without Prisma limitations | H.Tài | Task 1.0 `● Xong`; this ADR moves to `Accepted`                    |
| Decide the exact optimistic-lock form (interactive `$transaction` vs. `$queryRaw` with `version`)    | H.Tài | ADR 0004 (payment/state machine) is `Accepted`                     |
| Decide whether `loyaltyPoints` is a `User` column or a separate `LoyaltyLedger` table                | H.Tài | Task 1.0 ERD; record in this ADR or a new one                      |
| Decide whether `Promotion` is in the Task 1.0 ERD or added in Phase 5                                | Nghĩa | Task 1.0 `● Xong`; if added later, `prisma migrate dev` in Phase 5 |
| Confirm Prisma version pin (6.x) in `apps/api/package.json`                                          | Nghĩa | Task 1.0 or Task 11.0 PR                                           |
| Add a "Prisma generate" step to CI (Phase 2+)                                                        | H.Tài | First CI workflow                                                  |
| Review the generated migration for the first `Order`/`OrderItem` change before merging               | H.Tài | Task 22.0 / Task 14.0 PR                                           |

## References

- Assignment PDF §6 (technology: "PostgreSQL qua Prisma/TypeORM"), §9.3 (transaction + optimistic locking), §12.2 (entities).
- [ADR 0001](0001-record-architecture-decisions.md) — the ADR process this follows.
- [ADR 0002](0002-monorepo-two-apps.md) — the per-app install rule that puts Prisma in `apps/api`.
- [Configuration](../../config.md) §2.1 (`DATABASE_URL`), §1.3 (host-port remap), §3 (VND integer rule that shapes `price Int`).
- [Setup](../../setup.md) §3 (DB container), §6 (migrate + seed), §8 (Prisma Studio check), Troubleshooting (`P1001`, `P3005`, `prisma generate`).
- [Product Backlog](../../requirements/product-backlog.md) Task 1 (ERD), Task 2 (products schema), Task 10c (stock locking).
- [Scenarios](../../requirements/scenarios.md) S-ORD-6 (concurrent stock).

---

## Notes on choices I made (so you can accept or override)

1. **This ADR is `Proposed`, not `Accepted`, and that's deliberate.** The decision is *made* (the team is using PostgreSQL + Prisma), but the ADR's job is to be the record that Task 1.0's ERD was confirmed to fit the chosen ORM. If the ERD reveals a Prisma limitation, this ADR is the place to catch it *before* Phase 2 writes schema-dependent code. Marking it `Accepted` now would skip that check. The status line says exactly what closes it: "Proposed → Accepted when Task 1.0 (ERD) closes."

2. **The "When to revisit" section has one condition that's time-boxed** ("revisit before Task 1.0 closes"). That's unusual for an ADR — normally "when to revisit" is open-ended. But the cost of switching ORMs *after* Phase 2 is multi-day (re-write schema, migrations, seed, and every service that touches the client), and the cost *before* Phase 2 is near-zero. The time-box is the cheapest possible insurance against a mid-project ORM migration.

3. **I named Drizzle as a rejected alternative even though the assignment doesn't.** The alternatives table is for a future reader who asks "why not the modern thing?", and Drizzle is the modern thing a 2026 team might reach for. Rejecting it with a specific reason ("the assignment names Prisma/TypeORM; choosing a third invites a grading question with no compensating benefit") is more useful than pretending it doesn't exist.

4. **The `loyaltyPoints` design question is in the open-questions table, not silently decided.** It could be a `User` column (simple) or a `LoyaltyLedger` table (auditable, handles refunds). Task 1.0's ERD will decide, but the ADR flags that it's a decision, not an obvious default. If you'd rather it be a column (simpler for MVP), say so at Task 1.0 time and record it here; if you'd rather a ledger, that's a Task 1.0 schema addition and this ADR's ERD-fits-Prisma check covers it.

5. **The Prisma-vs-TypeORM trade-off is written so it could be flipped if the team's context changes.** The "When to revisit" section says "a teammate's prior experience makes TypeORM clearly cheaper." That's a real possibility — if someone on the team is fluent in TypeORM and has never used Prisma, the learning-cost argument in the Decision flips. The ADR doesn't pretend the choice is obvious; it says what would change the answer.

6. **One forward reference to honor:** the open-questions table says "Decide the exact optimistic-lock form (interactive `$transaction` vs. `$queryRaw` with `version`)" and points at ADR 0004. That's the right place — the locking strategy is a payment/order concern, not a DB-choice concern. But ADR 0004's author should know this ADR expects them to make it, and Task 10c's integration test (`scenarios.md` S-ORD-6) is the proof. If ADR 0004 doesn't address it, the open question goes stale.

7. **Small consistency check:** `config.md` §3 says "Currency: VND, integer minor-unit-free" and this ADR says `price Int`. They agree. If the ERD later uses `Decimal` for price (e.g. because someone worries about future currencies), the two docs and `ui-decisions.md` §4.1 all need updating in one PR. The "integer VND" rule is stated in three docs — that's the sign it's load-bearing.
