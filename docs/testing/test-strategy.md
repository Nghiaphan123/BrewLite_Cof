# BrewLite - Test Strategy and Test Case List

**Version:** 0.1  
**Status:** Draft for team review (task T-01)  
**Location:** `docs/testing/test-strategy.md`  
**Replaces:** the older draft `docs/drafts/from-assistant/test-strategy-initial.md` (its `TST-*` IDs are replaced by the IDs below)  
**Related:** [Testing plan](../plans/04-testing-plan.md), [SRS](../requirements/srs.md), [UC-01 spec](../requirements/use-case-uc01-place-and-pay.md), [ADR 011 test tooling](../architecture/adr/011-test-tooling.md), [ADR 015 Vitest](../architecture/adr/015-test-runner-vitest.md), [Class diagram and data model](../diagrams/class-domain.md), [Traceability matrix](../traceability-matrix.md)  
**Sources:** Assignment 1 (section 4.2, Task 10) and Assignment 2 (Task 4.3, Task 5.2, section 8)

This document defines how BrewLite is tested: the test levels, tools, environments, test data, and gates, plus the list of planned test cases with their IDs. The test IDs are the ones used in the [traceability matrix](../traceability-matrix.md) (`D-14`). It describes planned tests; a test counts as evidence only when it exists in the repository and passes in CI. Items marked **(proposed)** are team suggestions to confirm.

## 1. Scope

**In scope**

- Business rules in `apps/api`: order state machine, pricing, promotion, loyalty, stock holding and release, idempotent payment.
- The REST API: validation, JWT protection, ownership checks, status codes, and persistence.
- Database behavior on real PostgreSQL: migrations, seed, constraints, transactions, and concurrency.
- The web UI in `apps/web`: loading, empty, and error states; product options and price; cart; checkout retry.
- One or more end-to-end journeys from the menu to the payment confirmation (Assignment 2, Task 5.2).
- Non-functional checks: response time, password hashing, authorization, validation, browsers, health check, CI gate, deployment.

**Out of scope**

- Real payment providers and real money (WN-02, WN-03). The sandbox adapter (`C-22`, Could) gets a contract test only.
- Load or stress testing beyond the performance method in decision 12.
- Barista screens and admin screens (WN-01, WN-04).

## 2. Test levels, tools, and locations

| Level          | What it proves                                                                         | Tool                                                            | Location                                      | Run with                                        |
| -------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------- |
| Unit (API)     | Pure domain rules with no network or database                                          | Vitest                                                          | `apps/api/src/**/*.spec.ts`, next to the code | `npm test` in `apps/api`                        |
| Unit (web)     | Component states and interactions with a mocked API                                    | Vitest and React Testing Library **(proposed, chosen in T-02)** | `apps/web/src/**/*.test.tsx`                  | `npm test` in `apps/web` (added in T-02)        |
| API            | HTTP behavior of one running NestJS app: validation, guards, status codes, persistence | Vitest and Supertest, real PostgreSQL                           | `apps/api/test/**/*.e2e-spec.ts`              | `npm run test:e2e` in `apps/api`                |
| Integration    | Database-level guarantees: constraints, transactions, concurrency, migrations, seed    | Vitest, Prisma, real PostgreSQL                                 | `apps/api/test/integration/**/*.e2e-spec.ts`  | `npm run test:e2e` in `apps/api`                |
| End to end     | A customer journey through the browser, web, API, and database together                | Playwright (Chromium and WebKit)                                | `tests/e2e/`                                  | `npx playwright test` against the Compose stack |
| Non-functional | Performance, security, browsers, handover, deployment                                  | `autocannon`, scripts, manual checklists                        | `tests/nfr/` and evidence notes               | Scripts and checklists in T-10 and T-11         |

**Note on tools.** [ADR 011](../architecture/adr/011-test-tooling.md) chose Jest. The NestJS 12 scaffold in `apps/api` already uses Vitest (`vitest.config.ts`, `vitest.config.e2e.ts`), and its sample test passes. This strategy uses Vitest, as proposed in [ADR 015](../architecture/adr/015-test-runner-vitest.md) and decision 14 in the [decision log](../plans/decision-log.md). Supertest, Playwright, React Testing Library, and real PostgreSQL stay as ADR 011 decided. If the team rejects ADR 015, only the runner changes; the test IDs and cases below stay the same.

**Note on names.** The scaffold calls its Supertest suite `test:e2e`. In this strategy those are **API** and **Integration** tests. "End to end" means only the Playwright tests in `tests/e2e/`. T-02 may rename the script to `test:api` **(proposed)**.

## 3. Test ID convention

- Format: `<LEVEL>-T<nn>`, following the Assignment 2 example style (`API-T01`) and the level prefixes in ADR 011.
- Prefixes: `UNIT-` unit (API and web), `API-` API tests, `INT-` integration tests on PostgreSQL, `E2E-` Playwright journeys, `NFR-` non-functional checks.
- Numbers are never reused. A removed test keeps its ID with the status **Dropped** in this list.
- Put the ID at the start of the test title so CI output can be matched to the matrix, for example `it('API-T07 creates a PENDING order with the server total', ...)`.
- Every test ID appears in the [traceability matrix](../traceability-matrix.md), and every Must requirement has at least one test ID there.

## 4. Environments and test data

| Environment                            | Used by                                                                    | Database                                                       | Payment provider                      |
| -------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------- |
| Developer machine                      | Unit tests; API and integration tests                                      | Local PostgreSQL from Docker Compose, database `brewlite_test` | Mock, outcome controlled by the test  |
| CI (GitHub Actions, `S-05` and `T-02`) | Lint, unit, API, integration, build; E2E on the main branch **(proposed)** | PostgreSQL service container                                   | Mock, outcome controlled by the test  |
| Compose stack                          | E2E and performance runs                                                   | Compose `db`, migrated and seeded                              | Mock with `PAYMENT_MOCK_CONTROL=true` |
| Production                             | Smoke test after deploy (T-11), performance check after warm-up (T-10)     | Managed PostgreSQL, not public                                 | Mock, control **off**                 |

**Rules**

1. API, integration, and E2E tests use a dedicated test database. The test setup refuses to run unless the database name ends in `_test` **(proposed)**, so a reset can never hit a developer or production database.
2. Each test file starts from a known state: `prisma migrate reset --force` (or truncate plus seed) before the suite, and its own rows created inside the test.
3. Integration tests that share one database run one file at a time (`--no-file-parallelism`), because concurrency tests must control their own parallelism.
4. Concurrency, locking, and unique-constraint tests run only on real PostgreSQL, never SQLite or an in-memory substitute (ADR 011).
5. All data is synthetic. Tests never call a real payment API or use real bank details.
6. The mock payment outcome is set by the test (for example a test-only header or `PAYMENT_MOCK_CONTROL`, defined in `C-07`), so success, failure, and timeout are deterministic.

**Seed data** (`apps/api/prisma/seed.ts`, `C-03`)

| Data       | Values                                                                                                       | Used by                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Products   | 30 drinks with whole-VND prices; one product "Cà phê phin giới hạn" with stock 1                             | Menu tests, performance (decision 12), out-of-stock and concurrency tests |
| Toppings   | 5 toppings at +5,000 VND                                                                                     | Pricing tests                                                             |
| Users      | `customer01@brewlite.test` to `customer10@brewlite.test`, bcrypt cost 10, password from `SEED_USER_PASSWORD` | Auth, ownership, and performance tests                                    |
| Promotions | `BREW10` (10 percent), `WELCOME20K` (20,000 VND off, minimum order 50,000 VND **(proposed)**)                | Promotion tests (T-08)                                                    |

The seed is repeatable: running it twice creates no duplicates (`INT-T08`).

## 5. Entry and exit criteria

| Gate                | Entry                       | Exit (must pass)                                                                                           |
| ------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Pull request        | Code compiles locally       | Lint, unit tests, API and integration tests, build (NFR-10). A failing step blocks the merge.              |
| Database change     | Schema or migration changed | `prisma validate`, migration from an empty database, seed twice (`INT-T08`, `INT-T09`)                     |
| Sprint 1 close (P3) | C-04, C-09, C-14 merged     | `API-T01` to `API-T03`, `UNIT-T01` to `UNIT-T03`, `UNIT-T10`                                               |
| Sprint 2 close (P6) | C-05 to C-19 merged         | All Must tests in section 7 except T-10 and T-11 checks; `E2E-T01` and `E2E-T02` pass on the Compose stack |
| Release (P7)        | Production deployed         | `NFR-T01` to `NFR-T09`; production smoke test                                                              |

## 6. Required evidence

| Requirement                                                             | Evidence                                   | Test IDs                                      |
| ----------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------- |
| Assignment 1 Task 10 (a): invalid state transitions are blocked         | Unit tests on the transition map           | `UNIT-T01`, `UNIT-T02`, `UNIT-T03`, `API-T16` |
| Assignment 1 Task 10 (b): the same `Idempotency-Key` gives one effect   | Integration tests, sequential and parallel | `INT-T01`, `INT-T02`, `INT-T03`               |
| Assignment 1 Task 10 (c): concurrent orders do not exceed stock         | Integration tests on PostgreSQL            | `INT-T04`, `INT-T05`, `INT-T06`               |
| Assignment 2 Task 5.2: unit tests for business logic                    | Unit tests                                 | `UNIT-T01` to `UNIT-T08`                      |
| Assignment 2 Task 5.2: integration tests for order and payment APIs     | API tests                                  | `API-T07` to `API-T16`                        |
| Assignment 2 Task 5.2: at least one E2E test from menu to confirmation  | Playwright                                 | `E2E-T01`                                     |
| Assignment 2 Task 5.2: reproducible migration and seed, health endpoint | Integration and API tests                  | `INT-T08`, `API-T03`                          |
| Assignment 2 Task 4.4: CI blocks a failing change                       | One passing and one failing pipeline run   | `NFR-T08`                                     |

Keep the CI logs (or screenshots) of these tests with the release evidence (`D-18`).

## 7. Test case list

**Task** is the testing-plan task that writes the test. Tests marked "with C-xx" are written with that feature, as part of its Definition of Done. **AC** refers to the acceptance scenarios and flows in the [UC-01 spec](../requirements/use-case-uc01-place-and-pay.md#8-acceptance-scenarios).

### 7.1 Unit tests

| Test ID  | Requirement   | UC-01         | Scenario and expected result                                                                                                                                                                  | Task             |
| -------- | ------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| UNIT-T01 | FR-09         | Main flow, A4 | The legal path is allowed: `PENDING` to `PAID` to `PREPARING` to `READY` to `COMPLETED`; `PENDING` to `PAYMENT_FAILED` to `PENDING`                                                           | T-05             |
| UNIT-T02 | FR-09, FR-14  | AC-09         | Every other transition is rejected and leaves the order unchanged, including `PREPARING` or `READY` to `CANCELLED`, `PENDING` to `PREPARING`, and any move out of `COMPLETED` or `CANCELLED`  | T-05             |
| UNIT-T03 | FR-09, FR-15  | AC-13         | `CANCELLED` is reachable only from `PENDING`, `PAYMENT_FAILED`, and `PAID`                                                                                                                    | T-05             |
| UNIT-T04 | FR-02, FR-05  | AC-08         | Pricing: `lineTotal = (basePrice + sizeSurcharge + toppingCount x 5,000) x qty` with S 0, M +5,000, L +10,000; integers only (for example 29,000 size L with 2 toppings, qty 2, gives 98,000) | T-04 (with C-06) |
| UNIT-T05 | FR-12         | AC-11         | Promotion: `PERCENT` uses `floor(subtotal x value / 100)`; `FIXED` never exceeds the subtotal; inactive, expired, not-yet-valid, below-minimum, and over-limit codes are rejected             | T-08             |
| UNIT-T06 | FR-12         | AC-01         | Loyalty points are `floor(paidTotal / 1000)` (for example 98,000 gives 98 and 999 gives 0)                                                                                                    | T-08             |
| UNIT-T07 | FR-06         | AC-02, E8     | The mock provider returns success, failure, or timeout as controlled by the test; the control is ignored when it is turned off (production setting)                                           | T-12             |
| UNIT-T08 | FR-16         | A6            | The expiry rule selects only `PENDING` and `PAYMENT_FAILED` orders whose `expiresAt` has passed (Could)                                                                                       | T-05             |
| UNIT-T10 | FR-01, NFR-07 | -             | The menu shows a loading state, an empty message for an empty list, an error message when the request fails, and the products otherwise                                                       | T-03             |
| UNIT-T11 | FR-02         | -             | On product detail, choosing size and toppings updates the shown price by the pricing rule                                                                                                     | with C-15        |
| UNIT-T12 | FR-03         | A1            | The cart adds, changes quantity, and removes items; the badge count and total update; the cart survives a reload (Zustand `persist`)                                                          | with C-16        |
| UNIT-T13 | FR-06, FR-10  | A4, A5        | Checkout keeps the cart after a failure, sends a new `Idempotency-Key` on retry, and reuses the same key for a double tap                                                                     | with C-18        |

### 7.2 API tests

| Test ID | Requirement         | UC-01                | Scenario and expected result                                                                                                                                      | Task             |
| ------- | ------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| API-T01 | FR-01               | -                    | `GET /products` returns 200 and the seeded list; each item has `id`, `name`, `price`, `imageUrl`                                                                  | T-03             |
| API-T02 | FR-02               | -                    | `GET /products/:id` returns the product, and 404 for an unknown id                                                                                                | T-03             |
| API-T03 | NFR-09              | -                    | `GET /health` returns 200 when the database answers and 503 when it does not                                                                                      | T-03 (with C-04) |
| API-T04 | FR-04, NFR-02       | -                    | `POST /auth/register` stores a bcrypt hash, rejects a duplicate email, and never returns the password or hash                                                     | T-04             |
| API-T05 | FR-04               | -                    | `POST /auth/login` returns a JWT for valid credentials and 401 for invalid ones                                                                                   | T-04             |
| API-T06 | NFR-03              | AC-07, E4            | `POST /orders`, `POST /payments`, and `GET /orders/me` return 401 with no JWT, an invalid JWT, or an expired JWT                                                  | T-04             |
| API-T07 | FR-05, FR-11        | AC-01, steps 3 to 6  | A valid order returns the order ID, status `PENDING`, and the server total; stock is held                                                                         | T-04             |
| API-T08 | FR-05, NFR-04       | E2                   | Invalid input (quantity 0, unknown product, size, or topping) returns 400 and creates no order                                                                    | T-04             |
| API-T09 | FR-05               | AC-08                | A lower price or total sent by the client is ignored; the order uses the server total                                                                             | T-04             |
| API-T10 | FR-11               | AC-05, E1            | A quantity above stock returns 409 naming the item; no order is created; stock is unchanged                                                                       | T-04             |
| API-T11 | FR-06, FR-07, FR-12 | AC-01, steps 8 to 12 | A successful payment returns `PAID`; one payment row exists; loyalty points are credited once                                                                     | T-04             |
| API-T12 | FR-06               | AC-02, E3            | A failed payment returns the outcome with status `PAYMENT_FAILED`; no points; stock stays held                                                                    | T-04             |
| API-T13 | FR-06, FR-11        | AC-03, A4            | A retry with a new key after a failure gives `PAID` once; stock is not held twice                                                                                 | T-04             |
| API-T14 | FR-06, NFR-04       | -                    | `POST /payments` without an `Idempotency-Key` returns 400                                                                                                         | T-04             |
| API-T15 | FR-06, NFR-03       | AC-10, E5            | Paying another customer's order is rejected (403 or 404, decided in API design); the order is unchanged                                                           | T-04             |
| API-T16 | FR-09               | AC-09, E6            | Paying an order that is already `PAID`, with a new key, returns 409; no second charge                                                                             | T-04             |
| API-T17 | FR-08, NFR-03       | -                    | `GET /orders/me` returns only the caller's orders with ID, status, total, and creation time                                                                       | T-04             |
| API-T18 | FR-13               | -                    | `GET /orders/:id` returns the order to its owner and rejects other users (Should)                                                                                 | T-04             |
| API-T19 | FR-14               | -                    | The internal status operation moves a `PAID` order to `PREPARING`, `READY`, `COMPLETED`, rejects illegal moves, and is not callable by a normal customer (Should) | T-05 (with C-09) |
| API-T20 | FR-12               | AC-11, A3            | `POST /orders` with `BREW10` or `WELCOME20K` reduces the total; an invalid or expired code is rejected with a message                                             | T-08             |
| API-T21 | FR-06               | E8                   | A mock timeout is recorded as a failed payment; the same key replays that result                                                                                  | T-12             |
| API-T22 | FR-17               | -                    | The QR demo "simulate payment received" control uses the same confirmation path as the mock (Could)                                                               | T-12 (with C-21) |
| API-T23 | FR-18               | -                    | The sandbox adapter passes the same provider contract tests as the mock (Could)                                                                                   | T-12 (with C-22) |

### 7.3 Integration tests (PostgreSQL)

| Test ID | Requirement                 | UC-01     | Scenario and expected result                                                                                                                                                   | Task |
| ------- | --------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- |
| INT-T01 | FR-10                       | AC-04, A5 | The same payment request with key K sent twice in sequence returns the same outcome; exactly one payment row and one order change exist                                        | T-06 |
| INT-T02 | FR-10                       | AC-04     | The same key sent twice **in parallel** produces one payment row; the unique (`userId`, `idempotencyKey`) constraint stops the second, which replays or returns 409            | T-06 |
| INT-T03 | FR-10, FR-12                | AC-12     | Replaying a successful payment does not credit loyalty points again                                                                                                            | T-06 |
| INT-T04 | FR-11                       | AC-06, E7 | Stock is 1 and two customers order it at the same time: exactly one order succeeds; stock ends at 0                                                                            | T-07 |
| INT-T05 | FR-11                       | E7        | N parallel orders against stock k (for example 10 against 3): accepted quantity never exceeds k; stock is never negative                                                       | T-07 |
| INT-T06 | FR-11, FR-15                | AC-13     | Cancelling a `PENDING` order releases its stock exactly once; a second cancel changes nothing (`stockHeld`)                                                                    | T-07 |
| INT-T07 | FR-15, FR-12                | -         | Cancelling a `PAID` order sets the payment to `REFUNDED` and adds one `REVERSAL` row with negative points; a second reversal is rejected by unique (`orderId`, `type`) (Could) | T-08 |
| INT-T08 | NFR-12                      | -         | From an empty database, `prisma migrate deploy` and the seed succeed; running the seed again creates no duplicates                                                             | T-02 |
| INT-T09 | FR-10, FR-11, FR-12, NFR-12 | -         | The database rejects negative stock, quantity 0, `discountAmount` above `subtotal`, a duplicate (`userId`, `idempotencyKey`), and a duplicate (`orderId`, `type`)              | T-02 |
| INT-T10 | FR-16                       | A6        | The expiry job cancels expired `PENDING` and `PAYMENT_FAILED` orders and releases their stock once (Could)                                                                     | T-07 |

`INT-T08` and `INT-T09` only need the schema from `C-03`, so they can be written as soon as the test database exists (`T-02`).

### 7.4 End-to-end tests

| Test ID | Requirement            | UC-01            | Scenario and expected result                                                                                                                                                | Task |
| ------- | ---------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| E2E-T01 | FR-01 to FR-07, NFR-14 | AC-01, main flow | Open the menu, choose a drink with size and topping, add it to the cart, sign in, pay by Wallet, and see the confirmation with the order ID and `PAID`; the cart is cleared | T-09 |
| E2E-T02 | FR-06, FR-08           | AC-02, AC-03     | The first payment fails: the error is shown and the cart is kept; the retry succeeds and the order appears in the order history                                             | T-09 |
| E2E-T03 | FR-03, FR-05           | AC-07, A1        | A signed-out customer taps Pay, is sent to sign in, and returns to checkout with the cart unchanged                                                                         | T-09 |
| E2E-T04 | NFR-08                 | -                | On a phone-sized viewport the main screens are usable and the web manifest is served                                                                                        | T-09 |

### 7.5 Non-functional checks

| Test ID | Requirement | Scenario and expected result                                                                                                                                                                                           | Task             |
| ------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| NFR-T01 | NFR-01      | Decision 12 method: about 30 products and 10 users, 20 warm-up requests, then 200 requests per endpoint at 10 connections with `autocannon` on the six listed endpoints; p95 under 500 ms; the environment is recorded | T-10             |
| NFR-T02 | NFR-02      | A database query shows bcrypt hashes (`$2a$`/`$2b$`, cost 10) and no plaintext passwords                                                                                                                               | T-10             |
| NFR-T03 | NFR-03      | Every protected endpoint rejects a missing JWT (401) and another user's resource (403 or 404)                                                                                                                          | T-10             |
| NFR-T04 | NFR-04      | Every write endpoint rejects invalid input with a 4xx and a consistent error body                                                                                                                                      | T-10             |
| NFR-T05 | NFR-05      | Manual smoke test on the browser list in decision 13, plus Playwright on Chromium and WebKit                                                                                                                           | T-11             |
| NFR-T06 | NFR-06      | A non-team member follows the README from a clean clone and reaches the confirmation screen with `docker compose up --build`                                                                                           | T-11             |
| NFR-T07 | NFR-07      | Manual check of loading, empty, and error states on the menu, checkout, and history screens                                                                                                                            | T-11             |
| NFR-T08 | NFR-10      | One CI run passes and one run that breaks lint, a test, or the build is blocked from merging; links or screenshots are kept                                                                                            | T-02 (with S-05) |
| NFR-T09 | NFR-11      | Production: the web URL uses HTTPS, `GET /health` answers, the database has no public address, no secret appears in the repository or CI logs                                                                          | T-11             |
| NFR-T10 | NFR-09      | The API writes one log line per request and one per error, without passwords or tokens                                                                                                                                 | T-10             |
| NFR-T11 | NFR-15      | Manual check that interactive controls have visible labels and keyboard focus (Could)                                                                                                                                  | T-11             |

## 8. Coverage summary

| Requirement | Priority | Test IDs                                                          |
| ----------- | -------- | ----------------------------------------------------------------- |
| FR-01       | Must     | API-T01, UNIT-T10, E2E-T01                                        |
| FR-02       | Must     | API-T02, UNIT-T04, UNIT-T11, E2E-T01                              |
| FR-03       | Must     | UNIT-T12, E2E-T01, E2E-T03                                        |
| FR-04       | Must     | API-T04, API-T05                                                  |
| FR-05       | Must     | API-T07, API-T08, API-T09, UNIT-T04, E2E-T01                      |
| FR-06       | Must     | API-T11 to API-T15, API-T21, UNIT-T07, UNIT-T13, E2E-T01, E2E-T02 |
| FR-07       | Must     | API-T11, E2E-T01                                                  |
| FR-08       | Must     | API-T17, E2E-T02                                                  |
| FR-09       | Must     | UNIT-T01, UNIT-T02, UNIT-T03, API-T16                             |
| FR-10       | Must     | INT-T01, INT-T02, INT-T03, INT-T09, UNIT-T13                      |
| FR-11       | Must     | INT-T04, INT-T05, INT-T06, API-T07, API-T10, API-T13              |
| FR-12       | Must     | UNIT-T05, UNIT-T06, API-T20, INT-T03                              |
| FR-13       | Should   | API-T18                                                           |
| FR-14       | Should   | API-T19, UNIT-T02                                                 |
| FR-15       | Could    | UNIT-T03, INT-T06, INT-T07                                        |
| FR-16       | Could    | UNIT-T08, INT-T10                                                 |
| FR-17       | Could    | API-T22                                                           |
| FR-18       | Could    | API-T23                                                           |
| NFR-01      | Must     | NFR-T01                                                           |
| NFR-02      | Must     | API-T04, NFR-T02                                                  |
| NFR-03      | Must     | API-T06, API-T15, API-T17, NFR-T03                                |
| NFR-04      | Must     | API-T08, API-T14, NFR-T04                                         |
| NFR-05      | Must     | NFR-T05                                                           |
| NFR-06      | Must     | NFR-T06                                                           |
| NFR-07      | Must     | UNIT-T10, NFR-T07                                                 |
| NFR-08      | Must     | E2E-T04                                                           |
| NFR-09      | Must     | API-T03, NFR-T10                                                  |
| NFR-10      | Must     | NFR-T08                                                           |
| NFR-11      | Must     | NFR-T09                                                           |
| NFR-12      | Must     | INT-T08, INT-T09                                                  |
| NFR-13      | Must     | UNIT-T01 to UNIT-T03, INT-T01, INT-T02, INT-T04, INT-T05, E2E-T01 |
| NFR-14      | Should   | E2E-T01                                                           |
| NFR-15      | Could    | NFR-T11                                                           |

## 9. Defects and reporting

- A failing test in CI blocks the merge (NFR-10). Fix the code or the test in the same pull request; do not skip a failing test without an issue that names it.
- A defect found outside CI becomes a GitHub issue with the label `bug`, the test ID if one exists, the steps, and the expected and actual result. Add a test that reproduces it before the fix **(proposed)**.
- Coverage is reported with `npm run test:cov` in `apps/api`. There is no coverage target; the required tests in section 6 matter more than a percentage.

## 10. Points to confirm

1. **Test runner:** accept or reject [ADR 015](../architecture/adr/015-test-runner-vitest.md) (Vitest instead of Jest in `apps/api`).
2. **Web test runner:** Vitest with React Testing Library is proposed; decide in `T-02`.
3. **Mock outcome control:** the exact mechanism (test header, test amount, or `PAYMENT_MOCK_CONTROL`) is decided in `C-07`; `UNIT-T07`, `API-T12`, and `API-T21` depend on it.
4. **Status codes:** 403 or 404 for another user's order (`API-T15`) and 409 for an order that is not payable (`API-T16`) are proposals from the UC-01 spec.
5. **Expiry start** (ADR 008): `UNIT-T08` and `INT-T10` assume the window starts at order creation unless the team decides it restarts on retry.
6. **Promotion usage count** (ADR 009): when `usedCount` goes up affects `UNIT-T05` and `API-T20`.
7. **E2E in CI:** run Playwright on every pull request, or only on `main` and before a release **(proposed: `main` and release)**.
