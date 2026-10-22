# BrewLite - Test Strategy

**Status:** Phase 1 deliverable  
**Owner:** H.Tài (SM; testing owner through Phase 6)  
**Related:** [Scenarios](../requirements/scenarios.md), [Product Backlog](../requirements/product-backlog.md), [Working Agreement](../working-agreement.md), [API Contract](../architecture/api-contract.md), [ADR 0004](../architecture/adr/0004-payment-mock-and-order-lifecycle.md), [Traceability Matrix](../traceability-matrix.md), [Setup](../setup.md)

This document defines BrewLite's testing strategy: what levels of testing exist, what each level is responsible for, which tool runs each, how tests map to the graded requirements, and what "test complete" means for a task. It is the strategy; the specific test cases are in `scenarios.md` (flows) and `product-backlog.md` (acceptance criteria).

> **Scope:** automated tests (unit, integration, e2e) and the manual demo checks. Non-functional testing (load, performance) is a Phase 2+ item in `docs/testing/nfr/`. Accessibility testing is a manual checklist in `ui-decisions.md` §7, not automated in Phase 1.

## 1. Why this doc exists

Three forces shape BrewLite's testing:

1. **The assignment grades three specific tests** (PDF §9): invalid state transition, duplicate idempotency key, concurrent stock. These must exist, pass, and be demonstrable. They are not optional polish.
2. **Every task's Definition of Done** (PDF §10) requires code that "builds and runs" and, where applicable, "API validates input; UI handles loading/error." That's a per-task testing obligation, not a project-end one.
3. **The team is 5 students on a semester deadline.** A strategy that says "100% coverage" or "full e2e for everything" would consume the schedule and still miss the graded tests. The strategy must be proportionate: heavy where the grader looks, light where it doesn't.

The strategy below is sized to those three forces. Where it's light, it says so and names the risk.

## 2. Test levels

BrewLite uses four levels. Each level has a single responsibility; a behavior should be tested at exactly one level (the lowest that can prove it), except the three graded tests, which are deliberately tested at two (unit + integration or e2e) because the grader may look at either.

| Level                    | Runs against                           | Tool                       | Speed           | Scope                                                                 | Owns                                                              |
| ------------------------ | -------------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Unit**                 | A function or class, no I/O            | Vitest                     | ms              | API services, pricing function, state machine, formatters, cart store | Business rules, edge cases, error branches                        |
| **Integration**          | A Nest module + real Postgres (Docker) | Vitest (`test:e2e` config) | seconds         | Service + controller + Prisma + DB                                    | Transactions, locking, idempotency, state transitions, validation |
| **Component** (frontend) | A React component in jsdom             | Vitest + Testing Library   | ms–s            | `ProductCard`, `CartLine`, form components                            | Render states (loading/empty/error), user interaction             |
| **E2E**                  | Running web + API + DB                 | Playwright (Phase 2+)      | seconds–minutes | The user journeys in `scenarios.md` §3–§11                            | Cross-app flows, the demo script                                  |

**Rules:**
- **Test at the lowest level that can prove the behavior.** A pricing rule is a unit test; a transaction is an integration test; "checkout works" is e2e. Do not e2e a pure function.
- **Integration tests use a real Postgres, not a mock.** The graded tests (idempotency, locking) depend on real DB behavior (unique constraints, transactions); a mock would pass while the real thing fails. The test DB is the same `docker-compose` `db` service, with a separate schema or database per test run (see §6).
- **No test hits the network.** Mock the payment gateway at the module boundary in unit tests; in integration tests, use `PAYMENT_MOCK_MODE` (`config.md` §2.1) to control success/failure deterministically.
- **E2E is Phase 2+.** Playwright suites are written after the screens exist. Phase 1's e2e coverage is the manual demo script (§7).

## 3. What each level covers (and doesn't)

### 3.1 Unit tests (API)

**Covers:**
- `computeLineTotal` (pricing) — the shared fixture from `ui-decisions.md` §4.2. Every size, every topping combination, quantity > 1. This is the test that keeps frontend and backend prices in agreement.
- `assertTransition(from, to)` — every valid edge in ADR 0004's state machine, and every invalid edge rejected. This is graded test (a); the unit test is the first proof, the integration test is the second.
- Loyalty accrual function — `floor(total / 1000)` at boundaries (0, 999, 1000, 1999, 2000 VND). ADR 0004 D7.
- `formatVnd`, `formatDateTime` — formatting edge cases (0, 1, 999, 1000, 1,000,000; UTC → local conversion).
- Auth service — bcrypt hash + verify, duplicate-email branch, wrong-password branch.
- Order service — server-side price recomputation, empty cart, invalid size, unknown product, tampering (`scenarios.md` S-ORD-1..3).
- Payment service — success, failure, idempotency key replay (same body → same response; different body → conflict). Graded test (b) has a unit-level proof here and an integration-level proof in §3.2.

**Doesn't cover:** DB behavior, HTTP routing, guards, serialization. Those are integration.

### 3.2 Integration tests (API)

**Covers:**
- `POST /orders` end to end: controller → service → Prisma → DB. The order is persisted with the right status, items, and computed total (`scenarios.md` S-ORD-1..3).
- `POST /payments` with the real DB:
  - Success: order `PAID`, stock decremented, loyalty points accrued, all in one transaction (ADR 0004 D1, D7).
  - Failure: order `PAYMENT_FAILED`, stock unchanged, no points.
  - Idempotency replay (same key, same body) → same response, one payment row. **This is graded test (b).**
  - Idempotency conflict (same key, different body) → `409` (`scenarios.md` S-PAY-6).
- Concurrent stock: N parallel `POST /payments` for a product with stock 1 → exactly one `PAID`, one `OUT_OF_STOCK`, stock 0. **This is graded test (c).**
- State machine: `assertTransition` applied at the service boundary rejects invalid transitions even if a caller bypasses the controller. **This is graded test (a).**
- `JwtAuthGuard`: `POST /orders` and `POST /payments` return `401` without a token; `GET /orders/:code` returns `404` for a cross-user order (`scenarios.md` S-ORD-4).
- Validation: `POST /orders` with empty `items`, invalid `size`, unknown `productId` → `400` with the documented `code` (`api-contract.md` §8).

**Doesn't cover:** browser behavior, routing, UI states. Those are component/e2e.

### 3.3 Component tests (frontend)

**Covers:**
- `ProductCard` renders name, formatted price, image, and is a link (`wireframes.md` §4).
- Menu grid renders loading skeleton, empty state, error state with retry (`wireframes.md` §4).
- Cart line: quantity increment/decrement, remove, `−` disabled at 1 (`wireframes.md` §6).
- Cart total = sum of `lineTotal`; badge = `totalQty` (`ui-decisions.md` §5.1).
- Checkout: method selector required before confirm; confirm disabled while submitting (`wireframes.md` §7).
- Auth forms: client validation messages, duplicate-email error rendering (`wireframes.md` §9–§10).
- Confirmation: renders code, status badge, total; safe "not found" message (`wireframes.md` §8).

**Doesn't cover:** real API calls (mocked at the `api.ts` boundary), real navigation, real auth token storage. Those are e2e.

### 3.4 E2E (Phase 2+)

**Covers** the journeys in `scenarios.md` §3–§11, one Playwright spec per scenario ID (§12 of that doc names the files). The e2e suite is the demo script's automated twin: if the demo passes manually but the e2e fails, one of them is wrong.

**Phase 1 doesn't have e2e.** The screens don't exist yet. The manual demo script (§7) is the Phase 1 substitute. When Task 9/57.0 closes, the e2e suite is written against the running stack.

## 4. Test-to-requirement mapping

This is the testing slice of `traceability-matrix.md`. Every graded test has two levels of proof; every functional requirement has at least one level.

| Requirement                     | Unit                           | Integration                                | Component                 | E2E (Phase 2+)            |
| ------------------------------- | ------------------------------ | ------------------------------------------ | ------------------------- | ------------------------- |
| F1 menu list                    | pricing                        | `GET /products`                            | `ProductCard`             | `checkout-journey`        |
| F2 detail + size/topping        | pricing fixture                | `GET /products/:id`                        | size/topping selector     | `checkout-journey`        |
| F3 cart                         | store reducers                 | —                                          | cart line, badge          | `cart-mutations`          |
| F4 auth                         | bcrypt, token                  | register/login, guard                      | auth forms                | `auth-register-login`     |
| F5 order + pay                  | order service, payment service | `POST /orders`, `POST /payments`           | checkout form             | `checkout-journey`        |
| F6 confirmation + history       | —                              | `GET /orders/:code`, `/orders/me`          | confirmation, history row | `orders-history-acl`      |
| **Graded (a)** state machine    | `assertTransition`             | service-level rejection                    | —                         | `order-state-machine`     |
| **Graded (b)** idempotency      | payment service replay         | **integration replay (primary proof)**     | —                         | `payment-idempotency`     |
| **Graded (c)** concurrent stock | —                              | **concurrent integration (primary proof)** | —                         | `orders-concurrent-stock` |
| NFR < 500ms                     | —                              | —                                          | —                         | Phase 2+ `tests/nfr/`     |

**Rule:** for the three graded tests, the **integration** level is the primary proof (the grader runs the API, not the unit test). The unit test is a faster, narrower guard. Both must pass. If they disagree, the integration test wins and the unit test is fixed.

## 5. Tooling

| Tool                    | Used for                       | Config                                         | Notes                                                         |
| ----------------------- | ------------------------------ | ---------------------------------------------- | ------------------------------------------------------------- |
| **Vitest**              | API unit tests                 | `apps/api/vitest.config.ts`                    | Already in the scaffold. Co-located `*.spec.ts`.              |
| **Vitest (e2e config)** | API integration tests          | `apps/api/vitest.config.e2e.ts`                | Already in the scaffold. `*.e2e-spec.ts` in `apps/api/test/`. |
| **Vitest**              | Frontend component tests       | `apps/web/vitest.config.ts` (to add in Task 3) | + `@testing-library/react`, `jsdom`.                          |
| **Playwright**          | Cross-app e2e                  | `tests/e2e/playwright.config.ts` (Phase 2+)    | Root-level, not per-app.                                      |
| **Prisma**              | Test DB setup                  | `apps/api/prisma/`                             | `migrate reset` per run (see §6).                             |
| **docker-compose**      | Postgres for integration tests | root `docker-compose.yml`                      | Same `db` service; a separate database name per run.          |

**Why Vitest, not Jest:** the scaffold already uses Vitest (`apps/api/vitest.config.ts`), and it's faster and ESM-native. Do not add Jest. If a dependency requires it, that's an ADR.

**Why Playwright, not Cypress:** it runs both apps in one browser context, handles multi-tab and parallel tests, and is the project-structure doc's named choice (`tests/e2e/`). Do not re-litigate.

## 6. Test data and isolation

**Integration tests use a real database.** The rules:

1. **One database per test run**, named `brewlite_test_<random>`, created by the test setup and dropped on teardown. Do not run integration tests against `brewlite` (the dev database) — a failed test can corrupt dev state.
2. **Migrations run before tests.** `prisma migrate deploy` against the test DB, then tests run. `migrate dev` is for schema changes, not for test setup.
3. **Seed data is fixture data, not the dev seed.** The dev seed (`prisma/seed.ts`) is for `setup.md`'s local run. Test fixtures live in `apps/api/test/fixtures/` and are inserted per test or per suite. Do not depend on the dev seed's contents.
4. **Each test cleans up its own rows** or runs in a transaction that rolls back. Prefer the transaction-rollback pattern for speed; use per-test cleanup for tests that must commit (the concurrency test needs real committed transactions).
5. **The concurrency test (graded c) uses real parallel connections.** It must not be run inside a single transaction, or the race is serialized away. It creates stock 1, fires N requests in parallel with `Promise.all`, and asserts exactly one success. This is the one test that's slow and must not be mocked.

**Component tests** use jsdom and mock `apps/web/src/lib/api.ts`; they never hit a real network. **Unit tests** have no I/O at all.

## 7. Manual demo script (Phase 1 substitute for e2e)

Until Playwright exists, the Phase 1 demo is manual and follows `scenarios.md` S-MAIN-1 verbatim. The demo script is:

1. Reset DB (`prisma migrate reset`) and start both apps (`setup.md` §6–§7).
2. Open `/`, confirm menu renders (loading → success).
3. Open a product, select size M + 2 toppings, confirm price updates, add to cart.
4. Add a second product; open `/cart`, change quantity, confirm total.
5. Log in (or register then log in).
6. Checkout: select Wallet, confirm; confirm route shows code + `PAID`.
7. Open `/orders`; the order appears with the same code.
8. Run the failure path: set `PAYMENT_MOCK_MODE=failure`, place a new order, confirm `PAYMENT_FAILED` and cart preserved; set back to `success`, retry with a new key, confirm `PAID`.
9. (If Task 10 is merged) Double-submit the same payment key; confirm one order. Run the invalid-transition and concurrent-stock checks from `scenarios.md` S-ORD-5/6.

**Rule:** the demo script is run at the end of each Sprint and its pass/fail is recorded in the Retro note (`docs/plans/`). A demo that fails step 6 is a Sprint Review blocker, not a "we'll fix it next week."

## 8. Test definition of done (per task)

A task's tests are complete when:

- [ ] The behaviors in its `product-backlog.md` acceptance criteria have tests at the level(s) named in §4.
- [ ] The tests pass locally (`npm test` in the owning app; integration tests against the test DB).
- [ ] No test is skipped or `test.todo` without a linked follow-up in the open-items table.
- [ ] The test file naming follows §9.
- [ ] The task's evidence note (`working-agreement.md` §4) cites the test files.

A task can close `● Xong` without 100% coverage; it cannot close without tests for its acceptance criteria. Coverage percentage is not a gate. The graded tests' presence and passing is a gate.

## 9. Naming and placement

| Level              | Location                   | Pattern                                               |
| ------------------ | -------------------------- | ----------------------------------------------------- |
| API unit           | co-located                 | `<file>.spec.ts` (e.g. `orders.service.spec.ts`)      |
| API integration    | `apps/api/test/`           | `<feature>.e2e-spec.ts` (e.g. `payments.e2e-spec.ts`) |
| Frontend component | co-located or `__tests__/` | `<component>.test.tsx`                                |
| E2E (Phase 2+)     | `tests/e2e/`               | `<journey>.spec.ts` (matches `scenarios.md` §12)      |
| Fixtures           | `apps/api/test/fixtures/`  | `<domain>.json` (e.g. `orders.json`)                  |

Test names describe behavior, not implementation: `rejects COMPLETED -> PAID`, not `test assertTransition 2`. The name should read as the assertion.

## 10. Known limitations and risks

| Limitation                                            | Risk                                                                                              | Mitigation                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| No e2e in Phase 1                                     | The demo script is manual; a regression between Sprint Review and handover isn't caught by a test | Run the demo script at every Sprint end; e2e in Phase 2+                 |
| No load/performance tests                             | NFR "< 500ms" is unverified until Phase 2+                                                        | Manual curl timing in Task 2 evidence; `tests/nfr/` in Phase 2+          |
| No automated accessibility tests                      | WCAG AA is manual (`ui-decisions.md` §7)                                                          | Manual keyboard pass in demo script step 2–7                             |
| Integration tests need Docker running                 | A teammate without Docker can't run the full suite                                                | Unit + component tests run without Docker; document in `setup.md` §9     |
| Concurrency test is slow and flaky-prone              | A flaky graded test is worse than no test                                                         | Retry once on failure in CI; if it flakes twice, investigate, don't skip |
| Frontend component tests added in Task 3, not Phase 1 | UI regressions before Task 3 aren't caught                                                        | Phase 1 has no screens; this is expected                                 |

## 11. CI (Phase 2+)

CI is not in Phase 1 (`.github/workflows/` is empty). When it lands:

- **Job 1 — API:** `cd apps/api && npm ci && npx prisma generate && npm test && npm run test:e2e` against a Postgres service container.
- **Job 2 — Web:** `cd apps/web && npm ci && npm test`.
- **Job 3 — E2E (Phase 2+):** bring up `docker compose`, run Playwright.
- **No root job** (ADR 0002: per-app install).
- The graded tests (a), (b), (c) must pass in Job 1 before merge.

## 12. Open items

| Item                                                               | Owner | Closes when                              |
| ------------------------------------------------------------------ | ----- | ---------------------------------------- |
| Add `apps/web/vitest.config.ts` and `@testing-library/react`       | Nghĩa | Task 3 `● Xong`                          |
| Write the pricing fixture (`tests/fixtures/pricing-cases.json`)    | H.Tài | Task 4 or 6 `● Xong`                     |
| Decide test DB naming/isolation in CI                              | H.Tài | First CI workflow                        |
| Write Playwright config and first journey                          | H.Tài | Task 9 `● Xong` (Phase 2+)               |
| Confirm the concurrency test's retry policy                        | H.Tài | First CI run                             |
| Add the manual demo script result to the Retro note template       | H.Tài | First Sprint Review                      |
| Update `traceability-matrix.md` §4 with this doc's test references | H.Tài | Same PR that creates the matrix skeleton |

## 13. References

- Assignment PDF §9 (three graded tests), §10 (DoD), §4.2 (NFR).
- [Scenarios](../requirements/scenarios.md) §12 (scenario → test traceability), §9–§10 (graded test scenarios).
- [Product Backlog](../requirements/product-backlog.md) (acceptance criteria per task).
- [Working Agreement](../working-agreement.md) §4 (evidence notes cite tests), §9 (review checklist).
- [API Contract](../architecture/api-contract.md) (endpoint shapes the integration tests assert).
- [ADR 0004](../architecture/adr/0004-payment-mock-and-order-lifecycle.md) (state machine, idempotency, stock timing the graded tests prove).
- [Setup](../setup.md) §9 (how to run tests locally).
- [UI Decisions](../design/ui-decisions.md) §4.2 (pricing fixture), §6 (UI states), §7 (accessibility checklist).
- 
---

## Notes on choices I made (so you can accept or override)

1. **The doc is organized by *level* first (§2–§3), then by *requirement mapping* (§4), then *tooling/data/manual* (§5–§7).** That order matches how a reader uses it: "what levels exist?" → "what does each prove?" → "which test proves requirement X?" → "how do I run it?" A doc organized by requirement first would answer "is F3 covered?" faster but wouldn't tell you *what kind* of test to write for a new behavior. The §4 table bridges the two, and it's the table that updates when `traceability-matrix.md` is written.

2. **The three graded tests are called out as "primary proof at integration level" and "unit as faster narrower guard."** This is the most important judgment in the doc. A student team's instinct is to write the graded tests as unit tests (fast, easy) and call it done. But the grader runs the API — if the unit test passes and the integration test doesn't exist, the graded behavior is unproven. Naming the integration level as primary, and requiring both, is what makes the graded tests real.

3. **"No test hits the network" and "integration tests use a real Postgres, not a mock" are stated together, and they look contradictory until you read the boundary.** The rule is: no *external* network (no real payment gateway), but the *database* is real in integration tests because the graded tests depend on real constraints and transactions. A mock DB would pass idempotency and locking tests that the real DB fails. The distinction is in §2's rules and §3.2's list; if it's still confusing, the sentence to add is "mock at the payment gateway boundary, never at the DB boundary."

4. **The concurrency test is the one test the doc says "must not be mocked" and "must not run inside a single transaction."** That's specific because it's the test most likely to be written wrong — a `Promise.all` inside one transaction serializes the race away and passes trivially while the real system oversells. §6 rule 5 states it, §10 lists "flaky" as a risk, §12 has a retry-policy open item. If only one paragraph of this doc is read, it should be that one.

5. **§7 (manual demo script) is the Phase 1 substitute for e2e, and it's numbered 1–9 to mirror `scenarios.md` S-MAIN-1.** That's deliberate: when Playwright is written in Phase 2+, the spec's steps are the same numbers, and the reviewer can diff "manual step 6" against "e2e step 6." A demo script that diverged from the scenario would be a second source of truth.

6. **§8's "a task can close without 100% coverage; it cannot close without tests for its acceptance criteria" is the proportionate-testing rule.** Student teams oscillate between "no tests" and "coverage gate at 80%." Both are wrong for this project. The rule is: acceptance criteria get tests; other code gets tests when the risk justifies it; coverage percentage is informational. The graded tests are the one hard gate, stated in §8 and §11.

7. **§10 (known limitations) is where the doc is honest about what it doesn't do.** No e2e, no load tests, no automated a11y, Docker dependency for integration tests, flaky concurrency. Each has a mitigation, and the mitigation is either "manual at Sprint end" or "Phase 2+." A test strategy that claims to cover everything would be lying; this one says what's covered and what's deferred, which is more useful to a reviewer.

8. **One forward reference to honor:** §12's "Update `traceability-matrix.md` §4 with this doc's test references" means the matrix skeleton's §4 (graded tests) should cite this doc's §4 table rather than duplicating it. If you write the matrix skeleton first, add a row pointing here; if you write this doc first (which you did), the matrix's §4 is already structured to accept the reference. Either order works; just don't let the two §4 tables drift.

9. **The doc lives at `docs/testing/test-strategy.md`, not `docs/test-strategy.md`.** `project-structure.md` reserves `docs/testing/` for "Test plans and NFR evidence (Phase 2+)." This is the strategy that goes in that folder, written in Phase 1 because it shapes what gets tested in Phase 2+. The "Phase 2+" comment in the structure doc is slightly inaccurate now — worth a one-line update to say `docs/testing/` holds the Phase 1 strategy and Phase 2+ plans/evidence.

This closes the last Phase 1 doc that was referenced-but-unwritten from `scenarios.md` §12 and `working-agreement.md` §9. Phase 1's `docs/` is now: `setup.md`, `config.md`, `working-agreement.md`, `requirements/` (2), `design/` (2), `architecture/` (5 ADRs + contract), `testing/test-strategy.md`, and pending: `diagrams/README.md` and the `traceability-matrix.md` skeleton. Want `diagrams/README.md` next (last un-written Phase 1 doc), or the matrix skeleton (the one that catches scope gaps)?