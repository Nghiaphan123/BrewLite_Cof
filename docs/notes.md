question: can you explain why do we need api/ and web/ folder separately? is the web/ is the frontend layer and the api/ is the backend layer where we work with docker?

answer:

# Why `apps/api/` and `apps/web/` are separate

Short version: **yes, `api/` is the backend and `web/` is the frontend**, but the separation is *not* primarily about Docker. It's about dependency isolation, independent build/test/run lifecycles, and a clean deploy boundary. Docker is a *consumer* of the separation, not the reason for it.

Here's the reasoning, from the concrete to the architectural.

## 1. They are genuinely two different programs

`apps/api` and `apps/web` are not two folders in one program. They are two programs that happen to talk to each other over HTTP:

|                | `apps/api`                           | `apps/web`                                                  |
| -------------- | ------------------------------------ | ----------------------------------------------------------- |
| Runtime        | Node.js server (long-lived process)  | Node.js server (SSR) **and** the user's browser (client JS) |
| Framework      | NestJS                               | Next.js (React)                                             |
| Entry point    | `src/main.ts` → `app.listen(PORT)`   | `src/app/layout.tsx` → Next's router                        |
| Output         | A JSON HTTP API                      | HTML + JS + CSS, plus client-side bundles                   |
| Consumes       | PostgreSQL, the mock payment gateway | The API over `fetch`                                        |
| Can run alone? | Yes — curl it                        | No — needs the API for data                                 |

A NestJS app and a Next.js app have almost nothing in common at the code level. They don't share a `main`, they don't share a bundler, they don't share a runtime model (one is a long-running server, the other is request-scoped SSR + browser hydration). Putting them in one folder would mean one `package.json` with two incompatible sets of scripts, or a build system that knows to build each half differently. Two folders is the honest representation of "two programs."

## 2. The real reason: dependency isolation (ADR 0002)

This is the load-bearing argument, and it's already recorded in `docs/architecture/adr/0002-monorepo-two-apps.md`.

`apps/api` and `apps/web` need different dependencies, and they can need *different versions of the same dependency*:

- `apps/api` depends on `@nestjs/*`, `prisma`, `@prisma/client`, `bcrypt`, `class-validator`, `passport-jwt`.
- `apps/web` depends on `next`, `react`, `react-dom`, `zustand`, `tailwindcss`.

If these shared one `package.json` (or an npm workspace with hoisting), the resolver would have to pick one version of any shared transitive dependency. The classic failure: `apps/api` needs `typescript@5.x` for a Nest feature, `apps/web` is pinned to `typescript@4.x` by a Next plugin, and hoisting silently gives one of them the wrong one. The error surfaces as a weird build failure in one app, caused by a change in the other.

With separate `package.json` and `package-lock.json` per app, **each app gets its own `node_modules` and its own resolution graph**. They cannot interfere. That isolation is not a side effect — it's the property the separation buys, and it's why ADR 0002 rejected npm workspaces for Phase 1.

## 3. Independent lifecycles (build, test, run, deploy)

Because they're separate programs, they have separate lifecycles, and separating the folders lets each lifecycle be simple:

| Lifecycle step | `apps/api`                                    | `apps/web`                    |
| -------------- | --------------------------------------------- | ----------------------------- |
| Install        | `cd apps/api && npm install`                  | `cd apps/web && npm install`  |
| Dev run        | `npm run start:dev` (Nest watch)              | `npm run dev` (Next dev)      |
| Test           | `npm test` (Vitest unit) + `npm run test:e2e` | `npm test` (Vitest component) |
| Build          | `npm run build` → `dist/`                     | `npm run build` → `.next/`    |
| Lint           | `apps/api/oxlint.json`                        | `apps/web/eslint.config.mjs`  |

If they were one folder, every one of those commands would need a flag (`npm run build:api` / `npm run build:web`), and the test runner would need to know which files belong to which app. Two folders means the *directory* is the selector — `cd apps/api` is the "I'm working on the backend" switch. This is also why `setup.md` §5 installs separately and §7 runs two terminals: the separation is the workflow.

## 4. The deploy boundary (where Docker comes in)

This is where your Docker intuition is right, but the causality is reversed.

Docker doesn't *cause* the separation; it *uses* it. The scaffold already has `apps/api/Dockerfile` and `apps/web/Dockerfile` — two Dockerfiles, one per app. Each one:

```dockerfile
# apps/api/Dockerfile (sketch)
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["node", "dist/main.js"]
```

The `COPY package.json package-lock.json ./` only works because `apps/api` has *its own* manifest. If the repo had one root `package.json`, the Dockerfile would have to copy the root manifest and the API's source separately, and the build context would span both apps. The per-app manifest is what makes the per-app Dockerfile clean.

At deploy time (Task 57.0 / Phase 6, `deployment.md`), the two containers are independent:

- **API container:** NestJS + Prisma client, connects to the Postgres container, exposes the API port.
- **Web container:** Next.js server, connects to the API container, exposes port 3000.

They scale independently (the API might need more instances than the web SSR layer, or vice versa), they restart independently, and a crash in one doesn't take down the other. `docker-compose.yml` wires them together with a shared network and a `depends_on`, but the images are separate builds from separate contexts.

If the two apps shared a folder, you'd have one Docker image containing both, which is an anti-pattern: you can't scale the API without scaling the web, you can't rebuild the API without rebuilding the web, and the image carries both apps' `node_modules` (double the size, and the browser bundle would be built next to server code).

## 5. What the separation is *not* about

Three things people sometimes assume:

- **Not about "frontend vs backend" as a language split.** Both apps are TypeScript. The split is runtime and framework, not language.
- **Not about a shared code layer.** ADR 0002 rule 4 says there's no `packages/shared` in Phase 1. The one piece of shared logic (the pricing rule) is duplicated with a fixture (`ui-decisions.md` §4.2), not extracted. The folders are separate *and* there's no shared package — those are two independent decisions.
- **Not about Docker being required in dev.** Phase 1 runs the apps directly (`npm run dev`), not in Docker. Docker is used for Postgres only (`docker compose up -d db`), and for the full stack at handover (Task 57.0). The folder separation is what makes the handover Dockerfiles possible; it's not a consequence of using Docker daily.

## 6. The mental model to keep

```
apps/
├── api/   ← backend program: NestJS, owns the DB, exposes /api/v1/*
│            runs on its own port (3001 provisional), has its own manifest
└── web/   ← frontend program: Next.js, owns the browser UI, calls the API
             runs on port 3000, has its own manifest
```

- **`api/` is the backend layer** — yes. It's where Docker's API container is built from, where Prisma lives, where the graded tests (state machine, idempotency, stock) are proven.
- **`web/` is the frontend layer** — yes. It's where the screens live, where the cart store lives, where the browser bundle is built.
- **Docker is the packaging tool for the deploy boundary**, not the reason for it. The reason is "two programs, two manifests, two lifecycles, two deployables."

---

question: The common/ folder

answer:

## The `common/` folder and the two files

`apps/api/src/common/` is the folder for **cross-cutting infrastructure**. The rule of thumb: if a file is used by more than one feature module (orders, payments, auth, products), it belongs in `common/`. If it is only used by one feature, it belongs inside that feature's folder (`src/modules/<feature>/`). This is the same convention recorded in `project-structure.md`: *"Put cross-cutting behavior in `src/common/`; do not create global `BrewLite.DTO` or `BrewLite.Controller` folders."*

`common/` is a sibling of `modules/`, not a feature itself. It has no controller, no route, no business logic. It exists so that `OrdersModule` and `PaymentsModule` can both depend on the same DB connection and the same error shape without duplicating code or importing from each other.

The two files in it have different jobs:

| File                       | Role                                                                                                            | Used by                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `prisma.service.ts`        | The Nest provider that wraps `PrismaClient` and manages its lifecycle (connect on boot, disconnect on shutdown) | Every module that needs the DB (`OrdersService`, `PaymentsService`, and future `ProductsService`, `AuthService`) |
| `http-exception.filter.ts` | The global filter that maps thrown exceptions to the response envelope in ADR 0005 C3                           | Registered once in `main.ts` and `test/setup/e2e-app.ts`; applies to every request                               |

Here is a file-header doc comment for each, in the style the project uses (`working-agreement.md` §6 says files are kebab-case and headers explain *why*). These comments go at the top of each file, before the imports.

---

### `apps/api/src/common/prisma.service.ts` — header

```typescript
/**
 * PrismaService — the single Prisma client provider for the API.
 *
 * Why it exists:
 * - Nest injects providers into feature services. Rather than each service
 *   constructing its own PrismaClient (which would open a connection pool
 *   per service and never close it), the whole app shares this one instance.
 * - It implements OnModuleInit / OnModuleDestroy so the connection is opened
 *   when the Nest app boots and closed when it shuts down. Tests rely on this:
 *   `e2e-app.ts` boots the app, uses the same instance for fixture setup, and
 *   `app.close()` disconnects it.
 *
 * Connection string:
 * - Reads DATABASE_URL from the environment. The `config()` call loads
 *   `.env` from the app directory first, then the repo root, so both
 *   `apps/api/.env` and the root `.env` work without extra setup.
 * - The fallback URL is a local development default; it must match the
 *   POSTGRES_* values in the root `.env` (database `brewlite`, user
 *   `brewlite`). If they drift, Prisma connects as one role while the
 *   container created another and you get "role does not exist".
 * - In Docker Compose, the api container gets its own DATABASE_URL with
 *   host `db` (see docker-compose.yml); this file does not need to know.
 *
 * Convention:
 * - This file lives in `common/` because every feature module uses it.
 *   Do not create a second PrismaService per feature.
 */
```

---

### `apps/api/src/common/http-exception.filter.ts` — header

```typescript
/**
 * HttpExceptionFilter — the global error filter that turns thrown exceptions
 * into the standard JSON envelope described in ADR 0005 C3.
 *
 * Why it exists:
 * - Nest's default exception layer returns a shape close to C3 but not
 *   identical: it has no `code`, no `details`, and it does not know about
 *   domain errors such as InvalidStateTransitionError (Task 10a). Without
 *   this filter, the same failure returns different shapes depending on
 *   where it was thrown, and the frontend's single error parser
 *   (apps/web/src/lib/api.ts) breaks.
 * - It is registered once, in main.ts and in test/setup/e2e-app.ts, so every
 *   route uses it. A feature does not register its own filter.
 *
 * What it maps:
 * - InvalidStateTransitionError  -> 409, code INVALID_STATE_TRANSITION
 * - HttpException with an object body -> status, error, message, code, details
 * - HttpException with a string body  -> status, error, message
 * - Anything else                     -> 500, generic message
 *   (the real error is logged; it never reaches the client)
 *
 * Contract:
 * - The envelope is ADR 0005 C3: { statusCode, error, message, code?, details? }.
 *   Feature services throw Nest exceptions (BadRequestException,
 *   ConflictException, NotFoundException) and pass the `code` in the
 *   exception body; this filter copies it through. Services do not format
 *   the HTTP response themselves.
 *
 * Placement:
 * - Lives in `common/` because every module's errors flow through it.
 */
```

---

## Why these two files are in `common/` and not in a feature

A quick way to see the boundary:

- `order-state-machine.ts` is in `modules/orders/` because only orders use the state machine. (Payments import it, but it is conceptually an order concern; the import is the exception, not the rule.)
- `payment-hash.ts` is in `modules/payments/` because only payments compute the idempotency hash.
- `prisma.service.ts` is in `common/` because `OrdersService` and `PaymentsService` both need it, and future `ProductsService` and `AuthService` will too.
- `http-exception.filter.ts` is in `common/` because it is global — it applies to every route in every module, and it is registered in `main.ts` before any module is mounted.

If you ever find yourself importing `common/prisma.service` from a feature and also importing a feature service from `common/`, the boundary is wrong: `common/` should not depend on `modules/`. Right now `http-exception.filter.ts` imports `InvalidStateTransitionError` from `modules/orders/order-state-machine.js` — that is a small violation of the boundary (the filter depends on a feature). It works, but the cleaner shape would be to move `InvalidStateTransitionError` into `common/errors/` and have both the filter and the orders module import it from there. That is not blocking Task 10; note it as a follow-up.

---
