# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

Always reply to the user in Vietnamese with full diacritics (tiếng Việt có dấu), even when the user writes without diacritics.

## Project

BrewLite is a mobile-first coffee ordering web app (Software Engineering course project). It is a monorepo with two independent apps and **no root `package.json`**. Run `npm install` and all scripts inside each app directory.

- `apps/api`: NestJS 12 + Prisma 7 + PostgreSQL, port 3001, ESM (`"type": "module"`)
- `apps/web`: Next.js 16 App Router + React 19 + Tailwind 4 + Zustand, port 3000

Configuration lives in a root `.env` (copy it from `.env.example`). Both the API and the Prisma CLI load `.env` from `apps/api` first and then from the repo root.

## Commands

Database only (for local development): `docker compose up -d db`. Full stack: `docker compose up --build -d`, then `docker compose exec api npm run db:seed`.

`apps/api`:
```
npm run start:dev                 # watch mode
npm test                          # unit tests (*.spec.ts, Vitest)
npx vitest run src/modules/orders/pricing.spec.ts     # single unit test file
npx vitest run -t "name of test"                       # by test name
npm run test:e2e                  # Supertest e2e (*.e2e-spec.ts), needs Postgres running
npx vitest run --config ./vitest.config.e2e.ts test/payments.e2e-spec.ts   # single e2e file
npm run lint                      # oxlint (not ESLint)
npm run format                    # prettier
npm run db:generate               # regenerate Prisma client after schema changes
npm run db:migrate                # create + apply migration (dev)
npm run db:deploy / db:seed / db:reset
```

`apps/web`:
```
npm run dev
npm test                          # Vitest + jsdom + Testing Library
npx vitest run src/__tests__/unit/pricing-and-cart.spec.ts
npm run lint                      # eslint
npm run build
```

## Next.js version warning (from apps/web/AGENTS.md)

This Next.js version has breaking changes compared with older releases, so APIs and conventions may not match your training data. Read the relevant guide in `apps/web/node_modules/next/dist/docs/` before you write Next.js code. `next dev` rewrites the block in `apps/web/AGENTS.md` automatically, so leave it alone.

## API architecture

- **Bootstrap** (`src/main.ts`): global prefix `api/v1`, `ValidationPipe({ whitelist, transform })`, and the global `HttpExceptionFilter`. `test/setup/e2e-app.ts` repeats this setup by hand, so a new global pipe, filter or prefix must be added in **both** files.
- **Modules** are in `src/modules/<feature>/` (auth, products, cart, orders, payments, promotions, admin), and each one is registered in `app.module.ts`. DTOs use class-validator and go in `dto/`.
- **Imports use explicit `.js` extensions** (ESM/NodeNext), for example `import { X } from './x.js'`.
- **Prisma client** is generated into `src/generated/prisma/` (gitignored), so run `db:generate` after a fresh clone or a schema change. Import from `../generated/prisma/client.js` / `enums.js`, not `@prisma/client`. The app uses the `@prisma/adapter-pg` driver adapter. A single shared `PrismaService` lives in `src/common/`; do not create another one.
- **Error envelope** (ADR 0005): throw Nest exceptions with an object of the form `{ statusCode, error, message, code }`, where `code` is a machine-readable string such as `IDEMPOTENCY_CONFLICT`. `common/http-exception.filter.ts` formats the response and also maps `InvalidStateTransitionError` to 409 `INVALID_STATE_TRANSITION`.
- **Auth**: JWT via `@nestjs/jwt`. `common/guards/jwt-auth.guard.ts` sets `req.user`, and `admin.guard.ts` requires `role === 'ADMIN'`.
- **Domain rules are pure modules** with unit tests next to them, and services call into them. Keep business rules in these modules, not inline in services:
  - `orders/order-state-machine.ts`: the only source of legal order status transitions (PENDING→PAID|PAYMENT_FAILED|CANCELLED, PAYMENT_FAILED→PAID|CANCELLED, PAID→PREPARING→READY→COMPLETED). Use `assertTransition`.
  - `orders/pricing.ts`, `promotions/promotion.ts`, `payments/loyalty.ts` (points = floor(total/1000)), `payments/payment-hash.ts`.
- **Payment flow** (`payments.service.ts`, ADR 0004): the `Idempotency-Key` header is required. The same key with the same request hash replays the stored response; the same key with a different hash returns 409. Everything runs inside one `$transaction`. **Stock decrements at PAID, not at order creation**, and uses an optimistic lock on `Product.version`. Loyalty points accrue on success. The payment provider is a mock controlled by `PAYMENT_MOCK_MODE` / `mockMode`.
- Order codes come from a Postgres sequence (`nextval` via `$queryRaw`).

## API tests

- Unit tests: `*.spec.ts` under `src/`.
- E2E tests: `test/*.e2e-spec.ts`. They run against a separate database whose name is `DATABASE_URL`'s name with `_test` appended (for example `brewlite_test`). `test/setup/global-setup.ts` creates that database and runs `prisma migrate deploy` on it, so dev and demo data stay untouched. Shared helpers for auth and fixtures are in `test/setup/`.

## Web architecture

- Pages are in `src/app/<route>/page.tsx`. Feature logic is in `src/features/<feature>/`, shared UI in `src/components/`, Zustand stores in `src/store/`, and shared types in `src/types/index.ts`. The `@/` alias points to `src/`.
- `src/lib/api.ts` (`apiClient`) handles every backend call. It builds the base URL from `NEXT_PUBLIC_API_URL` (which must end in `/api/v1`), adds the Bearer token from `localStorage['brewlite_token']`, and unwraps either `{ data }` or a bare payload, and `{ items, total }` lists. Error messages come from `lib/api-errors.ts`.
- The cart is a persisted Zustand store (`localStorage['brewlite-cart']`). `features/cart/cart-sync.ts` and `components/CartSync.tsx` sync it with the server-side cart (`/cart`) and track the owning account and a dirty flag. Line identity is `buildCartItemId(productId, size, toppings)`. Client-side prices come from `features/product/pricing.ts`, which mirrors the API pricing rules.
- User-facing strings and many code comments are in Vietnamese.

## Workflow conventions (CONTRIBUTING.md)

- Never commit directly to `main`. Name branches `<type>/<kebab-name>` with type `feat|fix|docs|test|ci|chore` (no task ID in the name).
- Commit messages follow Conventional Commits with a task suffix, for example `feat(fe-cart): implement cart total calculation (Task 5)`.
- PRs use `.github/pull_request_template.md` and need review from a teammate; lint, test or build failures block the merge.
- Design decisions are recorded in `docs/architecture/adr/` (0002 monorepo, 0003 Postgres/Prisma, 0004 payment and order lifecycle, 0005 API contract conventions). Code comments refer to them as "ADR 0004 D1" and so on. The API contract is in `docs/architecture/api-contract.md`.
