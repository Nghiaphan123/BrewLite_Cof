# BrewLite

BrewLite is a mobile-first web app for ordering coffee at a counter. A customer browses the menu, chooses size and toppings, builds a cart, signs in, pays through a simulated Wallet or Card gateway, and sees the confirmation and order history. It is the course project for Assignment 1 (Software Engineering).

> **Status:** Sprint 3 (handover). All 10 backlog tasks are implemented: menu, product options, cart, orders, JWT auth, mock payment, confirmation and history, Docker Compose, and the order state machine with idempotent payments and stock control. The demo walkthrough is in [docs/demo-script.md](docs/demo-script.md).

## Features

| Area          | What the user can do                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Menu          | Browse 30 drinks with image, name and price; pick size S/M/L on the card, then "Thêm vào giỏ" or "Mua ngay" (straight to checkout) |
| Product       | Choose size S/M/L and toppings; the price updates as options change; a sold-out drink or topping cannot be chosen       |
| Cart          | Add, change quantity, remove; the total and the cart badge update automatically; the cart is kept per account and warns when a drink or topping runs short |
| Account       | Register (name, email, password) and sign in with JWT; the profile shows loyalty points, past orders, password change   |
| Checkout      | Apply a promotion code, pay by Wallet or Card; the "Thanh toán" button shows the total                                  |
| Payment       | Success marks the order `PAID` and takes drink and topping stock; failure marks it `PAYMENT_FAILED` and keeps the cart so the customer can retry |
| Confirmation  | The order code, status and items; order history at `/orders`                                                            |
| Admin         | `/admin`: drink stock, topping stock and price, block / open user accounts, create and cancel promotion codes, order status changes that follow the state machine |

## Tech stack

| Part      | Technology                                                                  |
| --------- | --------------------------------------------------------------------------- |
| Web       | Next.js (App Router), React, TypeScript, Tailwind CSS, Zustand for the cart |
| API       | NestJS, TypeScript, Prisma ORM, Vitest and Supertest                        |
| Database  | PostgreSQL                                                                  |
| Payment   | Mock provider (no real money), controlled by `PAYMENT_MOCK_MODE`            |
| Local run | Docker Compose                                                              |

Design decisions and their reasons are in the [ADRs](docs/architecture/adr/).

## Repository structure

```text
BrewLite_Cof/
|-- apps/
|   |-- api/                 # NestJS API, Prisma schema/migrations/seed, tests, port 3001
|   `-- web/                 # Next.js App Router, tests, port 3000
|-- docs/                    # requirements, design, diagrams, architecture, testing, demo
|-- .github/                 # PR template
|-- docker-compose.yml       # db + api + web
|-- .env.example
`-- README.md
```

## Prerequisites

- Git
- Docker Desktop with Docker Compose v2 (enough for the whole stack)
- Node.js 24 LTS and npm (only to run the apps or tests outside Docker)

## Quick start with Docker Compose (whole stack)

```powershell
git clone https://github.com/Nghiaphan123/BrewLite_Cof.git
cd BrewLite_Cof
Copy-Item .env.example .env              # macOS/Linux: cp .env.example .env
docker compose up --build -d             # builds and starts db, api, web
docker compose ps                        # wait until api shows (healthy)
docker compose exec api npm run db:seed  # sample menu, users and promotion codes
```

Then open:

- Web: http://localhost:3000 (starts at sign-in; after signing in you land on `/menu`)
- API: http://localhost:3001/api/v1 (for example `GET /api/v1/products`)

Notes:

- The API applies database migrations every time it starts. On a slow machine `docker compose ps` can show the API as `health: starting` or `unhealthy` for the first minutes; it becomes `healthy` once NestJS has started.
- The first build downloads and installs all packages and can take a long time on a low-memory machine. Later runs without code changes only need `docker compose up -d`.
- If port 5432 is already used on your machine, set `POSTGRES_PORT` (and the port in `DATABASE_URL`) in `.env` to a free port.
- Change `JWT_SECRET` in `.env` to your own random value of at least 32 characters. Never commit `.env`.

Stop with `docker compose down` (data is kept); add `-v` to delete the local database. **After `git pull`, rebuild with `docker compose up --build -d`**: the images contain the code from the last build, so without `--build` the stack keeps running the old version. New migrations (for example `add_user_blocked`) are applied when the API starts. More detail and troubleshooting: [docs/deployment.md](docs/deployment.md).

## Demo accounts and data

The seed (`npm run db:seed`) is safe to run again. It creates:

| Data             | Value                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| Customers        | `customer01@brewlite.test` to `customer10@brewlite.test`, password `Brewlite@123` (`SEED_USER_PASSWORD`) |
| Admin            | `admin@brewlite.vn`, password `123456`                                                             |
| Promotion codes  | `BREW10` (10% off), `WELCOME20K` (20,000 VND off orders from 50,000 VND)                           |
| Low-stock item   | "Cà phê phin giới hạn" starts with stock 1, for the sold-out demo                                  |

These are demo values only. Re-running the seed refreshes the menu but does not reset live stock or loyalty points.

## Run the apps on your machine (development)

Start only the database in Docker, then run each app in its own terminal:

```powershell
docker compose up -d db

cd apps/api
npm install
npm run db:generate      # Prisma client into src/generated/
npm run db:deploy        # apply migrations (DATABASE_URL from .env uses localhost)
npm run db:seed
npm run start:dev        # http://localhost:3001

cd apps/web
npm install
npm run dev              # http://localhost:3000
```

There is no root `package.json`; install and run scripts inside each app. Step-by-step onboarding: [docs/setup.md](docs/setup.md).

After every `git pull`, run `npm run db:deploy` and `npm run db:generate` in `apps/api` before starting the API: a pull can bring a new migration, and the API fails at login if the database misses a column the code reads.

### Simulating a failed payment

The mock gateway reads `PAYMENT_MOCK_MODE` (`success` or `failure`). Set `PAYMENT_MOCK_MODE=failure` in `.env` and restart the API (`docker compose up -d api`, or restart `npm run start:dev`). A payment then returns `PAYMENT_FAILED` and the cart is kept. Set it back to `success` and pay the same order again to see it become `PAID`.

## Database scripts (`apps/api`)

| Script                | What it does                                     |
| --------------------- | ------------------------------------------------ |
| `npm run db:generate` | Generate the Prisma client into `src/generated/` |
| `npm run db:validate` | Check `prisma/schema.prisma`                     |
| `npm run db:migrate`  | Create and apply a migration (development)       |
| `npm run db:deploy`   | Apply committed migrations                       |
| `npm run db:seed`     | Load sample data; safe to run again              |
| `npm run db:reset`    | Drop and rebuild the local database              |

## Test and lint

```powershell
cd apps/api
npm test                 # unit tests (Vitest)
npm run test:e2e         # API tests with Supertest; needs the database running
npm run lint

cd apps/web
npm test                 # unit and component tests (Vitest + Testing Library)
npm run lint
npm run build
```

The e2e tests use a separate database (`brewlite_test`, created automatically), so demo data is not touched.

### Graded business-rule tests (Task 10)

| Rule                                                       | Test file                                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| (a) Invalid order state transitions are rejected           | `apps/api/src/modules/orders/order-state-machine.spec.ts`, `apps/api/test/order-state-machine.e2e-spec.ts`    |
| (b) The same `Idempotency-Key` twice creates one payment   | `apps/api/test/payments.e2e-spec.ts`                                                                         |
| (c) Concurrent orders never oversell stock                 | `apps/api/test/orders-concurrent-stock.e2e-spec.ts`                                                          |

Run one file, for example: `npx vitest run --config ./vitest.config.e2e.ts test/payments.e2e-spec.ts` (inside `apps/api`).

The order lifecycle follows the assignment diagram (§9.1): `PENDING → PAID → PREPARING → READY → COMPLETED`, with `PENDING → PAYMENT_FAILED → PENDING` for a retry and `CANCELLED` from `PENDING`, `PAYMENT_FAILED` or `PAID`. Details: [ADR 0004](docs/architecture/adr/0004-payment-mock-and-order-lifecycle.md).

## Documentation

| Topic                   | Document                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Demo and handover       | [Demo script](docs/demo-script.md), Sprint Retrospectives: [Sprint 1](docs/plans/retro-sprint-1.md), [Sprint 2](docs/plans/retro-sprint-2.md), [Sprint 3](docs/plans/retro-sprint-3.md), [assignment checklist](docs/brewlite-checklist.md) |
| Requirements            | [Product backlog](docs/requirements/product-backlog.md), [scenarios](docs/requirements/scenarios.md)                 |
| Design                  | [Wireframes](docs/design/wireframes.md), [UI decisions](docs/design/ui-decisions.md)                                 |
| Diagrams                | [docs/diagrams/](docs/diagrams/), [Sprint plan](docs/diagrams/sprint-plan.md)                                         |
| Architecture            | [Architecture](docs/architecture/architecture.md), [API contract](docs/architecture/api-contract.md), [ADRs](docs/architecture/adr/) |
| Setup and configuration | [Setup](docs/setup.md), [configuration](docs/config.md), [local deployment](docs/deployment.md)                      |
| Testing                 | [Test strategy](docs/testing/test-strategy.md), [traceability matrix](docs/traceability-matrix.md)                   |
| Team process            | [Working agreement](docs/working-agreement.md), [kickoff note](docs/plans/kickoff-2026-10-22.md)                     |

## Working rules

- Branch, commit, and PR naming rules and review checklists are in [CONTRIBUTING.md](CONTRIBUTING.md). The PR description template is in [.github/pull_request_template.md](.github/pull_request_template.md).
- All changes go through pull requests with a teammate review; lint, test, or build failures block the merge.
- A task counts as done when it meets the Definition of Done (assignment §10): it builds and meets its acceptance criteria, has clear reviewed commits, the API validates input, the UI handles loading and error states, and this README explains how to run it.
