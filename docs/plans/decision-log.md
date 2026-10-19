# BrewLite - Decision Log

**Version:** 0.2  
**Status:** Accepted, except decision 3 (hosting, still Proposed until its checks are done); items marked **(verify)** still need a check. Decision 14 is a new proposal.  
**Location:** `docs/plans/decision-log.md`  
**Task:** D-01 (decision meeting and log)  
**Related:** [Overview](00-overview.md), [Documentation plan](01-documentation-plan.md#3-decision-checklist-d-01), [Payment plan](05-payment-plan.md), [ADR index](../architecture/adr/README.md)

This log records the 13 decisions from the decision checklist, plus decision 14 added while writing the test strategy (`T-01`). Each entry has a status, the options considered, the choice, the reason, and the consequences. Once a decision is **Accepted**, write it up as an ADR (`D-11`) in `docs/architecture/adr/` and link it in the table below.

## 1. How to use this log

**Status values**

| Status   | Meaning                                             |
| -------- | --------------------------------------------------- |
| Proposed | Recommended, not yet agreed by the team             |
| Accepted | Agreed at the meeting; ADR to be written or written |
| Changed  | Agreed, then replaced; point to the new entry       |
| Open     | Needs more information before deciding              |

**Rules**

- Change a decision only through a pull request that states the reason (Assignment 2, Task 4.2). Do not edit an Accepted entry silently; mark it **Changed** and add a new entry.
- Items marked **(verify)** rely on facts that can go stale, such as hosting limits or browser support. Check them against current documentation before accepting.
- Fill in `Decided on` and `Decided by` at the meeting.

## 2. Summary

| #   | Decision                      | Choice                                                                         | Status                             | Blocks                 | ADR                                                                                    |
| --- | ----------------------------- | ------------------------------------------------------------------------------ | ---------------------------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| 1   | ORM                           | Prisma                                                                         | Accepted                           | C-03, S-04, D-09, D-10 | [`002-orm-prisma.md`](../architecture/adr/002-orm-prisma.md)                           |
| 2   | Cart state                    | Zustand with `persist`                                                         | Accepted                           | C-16                   | [`003-cart-state-zustand.md`](../architecture/adr/003-cart-state-zustand.md)           |
| 3   | Hosting platform              | Render (Docker); VPS with Compose and Caddy as fallback                        | Proposed (verify)                  | S-06, S-07, D-12       | [`004-hosting-platform.md`](../architecture/adr/004-hosting-platform.md)               |
| 4   | Payment approach              | Mock provider behind `PaymentProvider`; QR demo and sandbox are Could          | Accepted                           | C-07, D-08             | [`005-payment-mock-provider.md`](../architecture/adr/005-payment-mock-provider.md)     |
| 5   | Currency and rounding         | Whole VND as integers; discounts rounded down                                  | Accepted                           | C-06, C-15             | [`006-money-and-pricing.md`](../architecture/adr/006-money-and-pricing.md)             |
| 6   | Size and topping pricing      | Size S base; M +5,000; L +10,000; topping +5,000 each                          | Accepted                           | C-15, C-06, D-04       | [`006-money-and-pricing.md`](../architecture/adr/006-money-and-pricing.md)             |
| 7   | Stock unit                    | Finished drinks per product                                                    | Accepted                           | C-11, D-09             | [`007-stock-unit.md`](../architecture/adr/007-stock-unit.md)                           |
| 8   | Cancellation and retry expiry | Owner cancels; simulated refund; 15 min expiry                                 | Accepted                           | C-09, D-06             | [`008-cancellation-and-expiry.md`](../architecture/adr/008-cancellation-and-expiry.md) |
| 9   | Promotion and loyalty         | `PERCENT` or `FIXED` codes; 1 point per 1,000 VND                              | Accepted                           | C-12, D-04             | [`009-promotion-loyalty.md`](../architecture/adr/009-promotion-loyalty.md)             |
| 10  | Diagram format                | PlantUML source plus exported SVG                                              | Accepted (confirm with instructor) | D-05 to D-09, D-12     | [`010-diagram-format.md`](../architecture/adr/010-diagram-format.md)                   |
| 11  | Test tools                    | Jest, Supertest, RTL, Playwright, real PostgreSQL                              | Accepted (API runner: see 14)      | T-01, T-02             | [`011-test-tooling.md`](../architecture/adr/011-test-tooling.md)                       |
| 12  | Performance test method       | p95 under 500 ms with `autocannon`                                             | Accepted                           | T-10                   | [`011-test-tooling.md`](../architecture/adr/011-test-tooling.md)                       |
| 13  | Browser support baseline      | Latest 2 versions of major browsers (verify)                                   | Accepted (verify)                  | T-11, D-04             | [`011-test-tooling.md`](../architecture/adr/011-test-tooling.md)                       |
| 14  | API test runner               | Vitest (already scaffolded in `apps/api`) instead of Jest; Supertest unchanged | Proposed                           | T-01, T-02             | [`015-test-runner-vitest.md`](../architecture/adr/015-test-runner-vitest.md)           |

Decision [`001-monorepo.md`](../architecture/adr/001-monorepo.md) (single repository with `apps/web` and `apps/api`) is already fixed by Assignment 2, section 9. Record it as an ADR for completeness; it needs no vote.

## 3. Decisions

### D-01.1 ORM

- **Status:** Accepted
- **Options:** Prisma, TypeORM
- **Decision:** Prisma
- **Reason:**
  - The stock update with a version check maps to `updateMany({ where: { id, version } })` and the "0 rows updated" branch in the sequence diagram.
  - Migrations and seed commands are built in and reproducible, which Assignment 2 Task 5.2 requires.
  - Interactive transactions and a composite unique constraint on `userId` and `idempotencyKey` are supported.
  - Generated types are easier for a five-person team than TypeORM decorators.
- **Consequences:** `DATABASE_URL` stays as is. Scripts `db:migrate` and `db:seed` map to Prisma Migrate and the seed command. Update the "Prisma or TypeORM" wording in [architecture.md](../architecture/architecture.md).
- **Revisit if:** the team already has strong TypeORM experience.

### D-01.2 Cart state

- **Status:** Accepted
- **Options:** Zustand, React Context
- **Decision:** Zustand with the `persist` middleware (localStorage)
- **Reason:** The checkout flow sends a signed-out customer to sign in while keeping the cart. Context alone loses the cart on reload; `persist` keeps it with little code. Assignment 1 lists Zustand in the stack.
- **Consequences:** The server never trusts cart totals; the backend recalculates (already in the architecture). Clear the persisted cart after a `PAID` result.

### D-01.3 Hosting platform

- **Status:** Proposed (verify)
- **Options:** Render, Railway, Fly.io, Azure, AWS, VPS
- **Decision:** Render, deploying Docker images. Fallback: one small VPS running Docker Compose with Caddy for automatic HTTPS.
- **Reason:**
  - Automatic HTTPS, private networking for the database, deploy hooks, and rollback to an earlier deploy.
  - Matches the existing Docker setup.
  - AWS and Azure add setup cost that this scope does not justify.
- **Risks and checks (verify before accepting):**
  - Free tiers may sleep or limit database lifetime. This conflicts with risk R8 (500 ms target) and with the requirement that the production URL is live at grading. Check current plan limits and consider a cheap paid tier shared by the team.
  - Confirm that the database is not publicly reachable on the chosen plan.
- **Consequences:** `S-06` provisions the web service, API service, and database. `D-12` draws the deployment diagram from the actual Render setup. The CD pipeline deploys by image tag (commit SHA).

### D-01.4 Payment approach

- **Status:** Accepted
- **Options:** Mock provider, static QR, dynamic QR, sandbox gateway (see [05-payment-plan.md](05-payment-plan.md#2-options))
- **Decision:** Mock provider behind a `PaymentProvider` interface (`C-07`). QR demo (`C-21`) and sandbox adapter (`C-22`) stay **Could**.
- **Reason:** The assignment requires a mock gateway. A QR image alone cannot confirm payment. One interface keeps the state machine, idempotency, and stock rules the same for every provider.
- **Rules:**
  - Control of the mock outcome (for example `PAYMENT_MOCK_CONTROL`) is off by default in production. Turn it on only for the live demo to show failure and retry.
  - Bank ID and account number, if a QR demo is added, live in environment variables.
- **Consequences:** The sequence diagram keeps one "Payment Service (mock)" lifeline. `T-12` tests the provider interface.

### D-01.5 Currency and rounding

- **Status:** Accepted
- **Decision:** Prices and totals are whole VND stored as integers. No decimals, no floating-point math. A percent discount is `floor(subtotal * percent / 100)`.
- **Consequences:** Database columns are integers. The UI formats with thousands separators (for example 45.000đ). The wireframe total (123.000đ) is illustrative only.

### D-01.6 Size and topping pricing

- **Status:** Accepted
- **Decision:** The product `price` is the price for size S.

| Option       | Surcharge (VND) |
| ------------ | --------------: |
| Size S       |               0 |
| Size M       |          +5,000 |
| Size L       |         +10,000 |
| Each topping |          +5,000 |

- **Formula:** `lineTotal = (basePrice + sizeSurcharge + toppingCount * 5000) * qty`
- **Reason:** Simple, testable, and easy to recalculate on the server.
- **Consequences:** Keep surcharges in config or a seed table, not hard-coded in the UI. `OrderItem` stores size, toppings, and the line total. The server ignores any client-sent price. Amounts are confirmed in `D-04` acceptance criteria.

### D-01.7 Stock unit

- **Status:** Accepted
- **Options:** Finished drinks per product, ingredients
- **Decision:** Finished drinks per product (`Product.stock`)
- **Reason:** Matches the minimum data model. Ingredient stock needs a recipe table and adds work with no assignment benefit. All sizes and toppings draw from the same product stock.
- **Consequences:** One order item with quantity `n` holds `n` units. A stock-held marker or equivalent on the order ensures release happens once (see [architecture.md](../architecture/architecture.md#62-stock-holding-with-optimistic-locking)).

### D-01.8 Cancellation details and retry expiry

- **Status:** Accepted
- **Fixed by the assignment diagram:** `CANCELLED` is reachable only from `PENDING`, `PAYMENT_FAILED`, and `PAID`.
- **Decision:**
  - The order owner may cancel in any of those three states. A `PAID` order that has moved to `PREPARING` or later cannot be cancelled (the state machine rejects it).
  - Cancelling a `PAID` order records a simulated refund on the payment and adds a compensating (negative) `LoyaltyTransaction` to reverse the points earned.
  - `PENDING` and `PAYMENT_FAILED` orders expire after 15 minutes through a scheduled job that uses the normal `CANCELLED` transition.
  - Stock is released exactly once, in the same transaction as the move to `CANCELLED`.
- **Consequences:** `C-09` implements the state machine and release logic. The customer-facing cancel screen (UC-08) stays **Could**. Update the UC-01 exception flows in `D-06`. No new edges are added to the state diagram.

### D-01.9 Promotion and loyalty rules

- **Status:** Accepted
- **Decision:**
  - **Promotion fields:** code (uppercase letters and digits), type (`PERCENT` or `FIXED`), value, minimum order total, valid from and to, active flag, optional usage limit.
  - **Seed codes:** `BREW10` (10 percent) and `WELCOME20K` (20,000 VND off).
  - One code per order. The discount never exceeds the subtotal.
  - **Points:** `floor(paidTotal / 1000)`, credited once per order after `PAID`. A unique pair (`orderId`, `type`) on `LoyaltyTransaction` enforces this: at most one `EARN` and one `REVERSAL` row per order. A unique `orderId` alone would block the reversal row from decision 8 (corrected in version 0.2, see ADR 009).
  - Redeeming points is **Won't** in this delivery; the assignment only requires earning them.
- **Consequences:** `Promotion` and `LoyaltyTransaction` appear in the class diagram (`D-09`). Tests in `T-08` use the seeded codes.

### D-01.10 Diagram format

- **Status:** Accepted (confirm with instructor)
- **Options:** Mermaid with exported images, PlantUML
- **Decision:** PlantUML for the five required diagrams (use-case, activity, sequence, class, deployment), each committed as a `.puml` source plus an exported `.svg`. Mermaid stays for flowcharts inside the plan documents.
- **Reason:**
  - Assignment 2 asks for UML use-case, activity with swimlanes, class, and deployment diagrams. Its own example file is `sequence-checkout.puml`.
  - Mermaid has no native use-case, deployment, or swimlane activity diagram, so those would be flowcharts imitating UML.
  - GitHub does not render `.puml`, so the exported SVG must be committed with it.
- **Consequences:** Convert the existing `sequence-checkout.mmd` and the use-case overview to PlantUML. Update the links in [sequence-checkout.md](../diagrams/sequence-checkout.md) and [use-case-overview.md](../diagrams/use-case-overview.md), and replace the export command. Add the PlantUML export step to the README.
- **Verify first:** Ask the instructor whether Mermaid is acceptable. If yes, the team may keep Mermaid, but the choice must then apply to all five diagrams.

### D-01.11 Test tools

- **Status:** Accepted. The API runner is under review in decision 14: `apps/api` was scaffolded with Vitest, not Jest.
- **Decision:**

| Level                          | Tool                                                          |
| ------------------------------ | ------------------------------------------------------------- |
| API unit and integration       | Jest, Supertest                                               |
| Frontend unit and component    | Jest, React Testing Library                                   |
| End to end                     | Playwright                                                    |
| Database for integration tests | Real PostgreSQL (CI service container or Compose), not SQLite |

- **Reason:** Playwright runs easily in CI, gives failure traces, and covers Chromium, Firefox, and WebKit. Concurrency, optimistic locking, and unique-constraint tests only prove anything on the real database engine.
- **Consequences:** `T-02` sets up the test database and the CI test job. Test IDs use level prefixes (`UNIT-`, `API-`, `INT-`, `E2E-`, `NFR-`) and appear in the traceability matrix.

### D-01.12 Performance test method

- **Status:** Accepted
- **Decision:**
  - **Data:** about 30 products and 10 users; bcrypt cost 10.
  - **Method:** 20 warm-up requests, then 200 requests per endpoint at 10 concurrent connections, using `autocannon`.
  - **Endpoints:** `GET /products`, `GET /products/:id`, `POST /auth/login`, `POST /orders`, `POST /payments`, `GET /orders/me`.
  - **Pass:** p95 server response time under 500 ms.
  - **Environments:** the Docker Compose stack, then production after warming the service. Record the environment with the results.
- **Consequences:** `T-10` holds the script and results. The NFR in the SRS (`D-04`) quotes this method in its acceptance criterion.

### D-01.13 Browser support baseline

- **Status:** Accepted (verify)
- **Decision:** Latest two stable versions of Chrome, Edge, Firefox, and Safari on desktop, plus Chrome on Android and Safari on iOS. Playwright runs on Chromium and WebKit; manual smoke tests use Chrome desktop and one real phone.
- **Verify:** Check the browser support list of the Next.js version in use so the project does not promise more than the framework supports.
- **Consequences:** `T-11` and the browser NFR in `D-04` use this list.

### D-01.14 API test runner

- **Status:** Proposed
- **Options:** Jest (decision 11), Vitest
- **Decision:** Use **Vitest** for unit and integration tests in `apps/api`, with Supertest for HTTP calls. Keep the rest of decision 11 (React Testing Library, Playwright, real PostgreSQL).
- **Reason:** The NestJS 12 scaffold in `apps/api` already ships with Vitest (`vitest.config.ts`, `vitest.config.e2e.ts`, `npm test` runs `vitest run`). Switching back to Jest adds setup work and gives no benefit for the assignment.
- **Consequences:** If accepted, mark decision 11 **Changed** for the API runner and accept [ADR 015](../architecture/adr/015-test-runner-vitest.md). The frontend runner (`apps/web` has none yet) is chosen in `T-02`; Vitest with React Testing Library is suggested so both apps use one runner. The [test strategy](../testing/test-strategy.md) already uses Vitest.

## 4. Impact on other tasks

| Task       | What changes because of these decisions                                                 |
| ---------- | --------------------------------------------------------------------------------------- |
| D-04       | Add acceptance criteria for pricing, promotion, loyalty, performance, and browsers      |
| D-06       | Use the cancel and expiry rules in UC-01 alternate and exception flows                  |
| D-08       | Keep one mock Payment Service lifeline; convert to PlantUML                             |
| D-09       | Add `Promotion`, `LoyaltyTransaction`, toppings on `OrderItem`, and a stock-held marker |
| D-10       | Name Prisma, Render, Zustand, logging, health, and config in the architecture           |
| D-12       | Draw the Render deployment as actually provisioned                                      |
| C-03       | Prisma schema, migrations, and seed (products, users, two promotion codes)              |
| C-09       | State machine plus the 15-minute expiry job                                             |
| S-06       | Provision Render; confirm plan limits                                                   |
| T-01, T-02 | Vitest (decision 14, proposed), Supertest, RTL, Playwright, PostgreSQL test database    |

## 5. Meeting record

| Field                               | Value                                                     |
| ----------------------------------- | --------------------------------------------------------- |
| Date                                | 2026-10-18 (commit `5400762` "finalize decisions")        |
| Attendees                           | (to fill in)                                              |
| Decisions accepted                  | 1, 2, 4 to 13 (10 and 13 still have a check to do)        |
| Decisions changed from the proposal | 9: uniqueness is (`orderId`, `type`), not `orderId` alone |
| Decisions still open                | 3 (hosting, verify plan limits); 14 (Vitest, new)         |
| Follow-up owners                    | (to fill in)                                              |

## 6. Change history

| Version | Date       | Change                                                                                                      | Author |
| ------- | ---------- | ----------------------------------------------------------------------------------------------------------- | ------ |
| 0.1     | 2026-10-18 | First draft of proposed decisions                                                                           |        |
| 0.2     | 2026-10-19 | Statuses set to match the ADRs; decision 9 uniqueness corrected; decision 14 (Vitest) proposed; links fixed |        |