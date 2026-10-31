# BrewLite — Architecture overview

**Status:** Assignment 2, Task 3.1  
**Owner:** team  
**Related:** [ADR 0002](adr/0002-monorepo-two-apps.md), [ADR 0003](adr/0003-database-postgres-prisma.md), [ADR 0004](adr/0004-payment-mock-and-order-lifecycle.md), [ADR 0005](adr/0005-api-contract-conventions.md), [ADR 0007](adr/0007-hosting-platform.md), [deployment diagram](../diagrams/deployment-production.puml), [SRS](../requirements/srs.md)

This is the architecture description for Assignment 2. It is a container view plus the decisions a reviewer needs. `architecture.md` in this folder is the repository tree, not this document.

The production drawing is [deployment-production.puml](../diagrams/deployment-production.puml). It describes Render as chosen in ADR 0007. It is the intended layout. The services are not created yet, and this file does not invent a live URL.

## 1. Context

A customer uses a phone browser to order a drink and pay with a simulated Wallet or Card. Counter staff do not get a screen. The payment provider is not a bank. It is a mock inside the API process.

```text
Customer browser
    |  HTTPS
    v
Next.js web  -------- HTTPS / CORS -------->  NestJS API  --->  PostgreSQL
                                                    |
                                                    +--> mock payment (in-process)
```

The browser does not talk to the database. The web app does not call the database. Only the API does.

## 2. Containers

| Container | Technology | Responsibility | Talks to |
| --- | --- | --- | --- |
| Web | Next.js 16 App Router, React, Tailwind, Zustand | Menu, product options, cart, login, checkout, confirmation, history. Mobile-first. PWA shell is required (NFR-04) and not built yet. | API only, from the browser, using `NEXT_PUBLIC_API_URL` |
| API | NestJS, Prisma | Auth, catalog, orders, mock payment, promotions, loyalty rules. Validates every mutation again. | PostgreSQL. Payment mock in the same process. |
| Database | PostgreSQL 17 | Users, products, toppings, orders, payments, promotions. `LoyaltyTransaction` is required by the class diagram and is not a table yet. | API only |
| Payment mock | In-process module | Approves or declines Wallet and Card. No network call. No card numbers. | Called by the payments module |

Local run is Docker Compose: web on port 3000, API on port 3001, Postgres with a named volume. Compose may publish Postgres to the developer machine. Production must not.

## 3. API modules

The API is one Nest application with a global prefix `/api/v1` (ADR 0005).

| Module | Job |
| --- | --- |
| `auth` | Register, login, JWT, current user, password change. Passwords are hashed. |
| `products` | Public menu and product detail. |
| `orders` | Create an order, read the caller's orders, enforce the state machine. |
| `payments` | Mock charge, idempotency key, stock decrement at `PAID`, loyalty points. |
| `promotions` | Validate a promo code. |
| `health` | `GET /api/v1/health`. Public. Does not touch the database. |

Cross-cutting rules:

- Money is an integer number of VND. The server recomputes the total.
- A new order is `PENDING` and does not reserve stock. Stock changes in the transaction that sets `PAID` (ADR 0004).
- The same `Idempotency-Key` and the same body have one payment effect.
- Order reads are limited to the authenticated owner.
- Input is validated on the client and again on the server.

## 4. Why this shape

| Choice | Benefit | Cost |
| --- | --- | --- |
| Next.js and NestJS in two apps (ADR 0002) | Matches the required stack. Each app builds and deploys alone. | No shared package. Types are duplicated or copied by hand. |
| PostgreSQL and Prisma (ADR 0003) | Migrations are files in git. The schema is the data model. | Prisma must be generated in the image. A failed migration must fail the deploy. |
| Mock payment inside the API (ADR 0004) | No gateway account, no webhook, no card data. Success and failure are testable. | It is not evidence of a real payment integration. The assignment does not ask for one. |
| Browser calls the API directly | The existing client already does this. Checkout does not need a Next.js proxy. | CORS must list the web origin. The API URL is fixed when the web image is built. |
| Render, two web services, private Postgres, GHCR (ADR 0007) | HTTPS without operating a server. Rollback is a previous image SHA. The database is not public. | Free instances sleep. Two origins must stay in sync. The pipeline is not written yet. |

## 5. Configuration, logs, and health

Configuration comes from the environment, not from committed secrets. `.env.example` documents the names. Production values live in the Render service settings.

| Name | Where | Secret? |
| --- | --- | --- |
| `DATABASE_URL` | API runtime | Yes. Render internal Postgres URL. |
| `JWT_SECRET` | API runtime | Yes. |
| `CORS_ORIGIN` | API runtime | No. Exact web origin. |
| `PAYMENT_PROVIDER` / mock mode | API runtime | No. |
| `NEXT_PUBLIC_API_URL` | Web image build arg | No. Must not hold a secret. |

Logs are process stdout. Render stores them. They must not include secrets or tokens. A dedicated logging interceptor is not in the code yet. `LOG_LEVEL` is named in `config.md` and is not wired to a custom logger yet.

The health contract is `GET /api/v1/health` → `200 { "status": "ok", "version": "v1" }` (ADR 0005). The route is implemented and Compose probes that path. Render will call the same path once the service exists. The public URL is not assigned.

## 6. Local, CI, and production

| Boundary | What runs | Database | Secrets |
| --- | --- | --- | --- |
| Local | Docker Compose, or host processes against the Compose database | Postgres in Compose. Port may be published on localhost. | `.env`, not committed |
| CI | GitHub Actions, not added yet. Install, lint, unit test, build on a pull request. | Ephemeral test database, not Render | CI secrets only. Logs must not print them. |
| Production | Render web services pulling GHCR images tagged by commit SHA | Render Postgres, private disk, no public port | Render environment. Not in the repo, not in logs. |

A pull request must not deploy. A tag or a protected branch deploy builds the images, pushes them, tells Render to roll forward, runs migrations as the API container starts, then calls the health URL. If health fails, the pipeline stops and the previous SHA remains the rollback target.

## 7. What this overview refuses to claim

- There is no production URL yet.
- There is no GitHub Actions workflow yet.
- The PWA manifest and service worker are not in `apps/web` yet. The web service is still where they will be served.
- `LoyaltyTransaction` is on the class diagram and not in `schema.prisma`.
- Confirmation in the running app is `/orders/[id]`. ADR 0004 names `/orders/[code]/confirmation`. The architecture still treats the order code as the customer-facing identifier.
- A demo QR on checkout is not a payment service and is not a node in the deployment diagram.

## 8. Trace

| Assignment 2 item | Where it is |
| --- | --- |
| Next.js / PWA | §2 Web. PWA files are a later code change. |
| NestJS modules | §3 |
| PostgreSQL and migrations | §2, §6, API Dockerfile `prisma migrate deploy` |
| Mock payment | §2, ADR 0004 |
| Logging, health, configuration | §5 |
| Trade-offs | §4 |
| Deployment diagram of the real platform | [deployment-production.puml](../diagrams/deployment-production.puml), ADR 0007 |
