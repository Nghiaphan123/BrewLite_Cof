# T-01 - Test Strategy and Test Case Register

**Status:** Draft for team review  
**Scope:** BrewLite MVP requirements from Assignment 1 and the testing-related additions described in the shared Assignment 2 planning conversation. The Assignment 2 PDF and its source documents are not present in this workspace, so confirm this strategy against the original brief before submission.

## 1. Purpose

Define how the team will verify requirements from unit checks through a complete customer order. Test case IDs in this document are the IDs used by the traceability matrix. This strategy specifies planned evidence; it does not claim tests have been implemented or passed.

## 2. Proposed tools

| Layer | Tool | Use |
|---|---|---|
| Backend unit | Jest | Pure domain rules such as order transitions, price calculations, promotion eligibility, and loyalty calculations. |
| Backend API/integration | Jest + Supertest | Exercise NestJS routes, validation, guards, persistence, and transactions against a dedicated test database. |
| Frontend component | Jest + React Testing Library | Verify menu/cart/checkout rendering and interaction states. |
| End-to-end | Playwright | Exercise browser flow from menu through payment confirmation and order history. |
| Database | Isolated PostgreSQL test database | Validate ORM migrations, constraints, seeding, transactions, and concurrency. Never point destructive test setup at a developer or production database. |
| CI | GitHub Actions (proposed) | Install, lint, unit/integration tests, build, and optionally E2E against service containers. Confirm provider and assignment constraints. |

The shared conversation records Jest, Supertest, a test database, and Playwright as the intended tool choices. Confirm them with the team before implementation.

## 3. Test levels and ownership

- **Unit:** Fast tests for deterministic business rules with no network or database dependency.
- **Integration:** NestJS module/API + PostgreSQL tests. Verify DTO validation, JWT access control, persistence, transactions, and uniqueness constraints.
- **Component:** Frontend states and user interactions, using mocked API responses where useful.
- **End-to-end:** Browser journey against the Compose stack and seeded test data, with the mock payment provider configured for deterministic success/failure.
- **Migration/seed:** Start with an empty test database, apply migrations, seed sample data, then check required tables and menu entries.
- **Concurrency:** Multiple simultaneous requests against a real PostgreSQL test instance; do not rely on an in-memory substitute for locking behavior.

## 4. Environments and data rules

1. Unit tests use generated in-memory fixtures only where persistence semantics are irrelevant.
2. Integration/E2E tests use a dedicated database named for test use, reset between test runs using a documented safe procedure.
3. Use synthetic users, products, promotions, and payment outcomes. Do not use real customer, bank, or payment data.
4. Mock payment outcomes must be deterministic (success, failure, timeout/unknown outcome if implemented).
5. Seed data must be repeatable and must not create duplicate rows on rerun.
6. Tests must not call real payment APIs or transfer money.
7. All tests should clean up created records or use isolated schemas/databases; parallel workers must not share mutable fixtures without isolation.

## 5. Test execution gates

| Gate | Required evidence |
|---|---|
| Pull request | Formatting/lint, typecheck, unit tests, backend/frontend build. |
| Database/API changes | Integration tests against PostgreSQL, migration from empty DB, seed repeatability. |
| Order/payment behavior | State-machine and payment idempotency tests; failure and retry cases. |
| Inventory behavior | Concurrency test showing accepted quantity never exceeds available stock and stock is never negative. |
| Release/demo candidate | Full E2E happy path plus payment failure/retry, order history access, health check. |
| Assignment Task 10 | Keep test output/evidence for invalid transition rejection, same-key payment replay, and concurrent stock protection. |

## 6. Test case register

| Test ID | Requirement | Level | Scenario and expected result |
|---|---|---|---|
| TST-PROD-01 | FR-01 | API integration | `GET /products` returns the seeded menu with id, name, price, and image URL. |
| TST-PROD-02 | FR-01, NFR-07 | Component | Menu shows loading, empty, and API error states; products render when data is returned. |
| TST-DETAIL-01 | FR-02 | Component | Choosing size and topping updates displayed price according to the agreed pricing rule. |
| TST-CART-01 | FR-03 | Component | Add, quantity update, and removal update item count and total correctly. |
| TST-AUTH-01 | FR-04, NFR-02 | API integration | Registration stores a bcrypt hash; plaintext password is never returned. |
| TST-AUTH-02 | FR-04, NFR-03 | API integration | Valid login issues JWT; missing/invalid JWT cannot access protected routes. |
| TST-ORDER-01 | FR-05, NFR-04 | API integration | Valid authenticated cart creates `PENDING` order with server-calculated total and identifier. |
| TST-ORDER-02 | FR-05, NFR-04 | API integration | Invalid DTO, unknown product, invalid quantity, or insufficient stock is rejected without partial order/stock mutation. |
| TST-PAY-01 | FR-06, FR-07 | API integration / E2E | Mock success records payment, transitions order to `PAID`, and confirmation shows identifier/status. |
| TST-PAY-02 | FR-06 | API integration / E2E | Mock failure records failed outcome and leaves cart available for retry. |
| TST-STATE-01 | FR-09 | Unit | Allowed transitions proceed along the defined state graph; invalid transitions throw/reject and terminal states cannot advance. |
| TST-IDEM-01 | FR-10 | API integration | Submit the same `Idempotency-Key` concurrently and sequentially; exactly one payment effect is recorded and replays return its outcome. |
| TST-STOCK-01 | FR-11 | PostgreSQL integration | Concurrent orders competing for the last available units cannot oversell; rejected requests leave consistent order and stock state. |
| TST-PROMO-01 | FR-12 | Unit / integration | Valid and invalid/expired promotion cases follow the agreed policy and server-calculated total. |
| TST-LOYALTY-01 | FR-12 | Integration | Successful payment credits the defined points once; retry/replay does not double-credit. |
| TST-HISTORY-01 | FR-08 | API integration | User sees only their orders; another user's order is not exposed. |
| TST-HEALTH-01 | NFR-06 | API integration / smoke | `GET /health` reports readiness only when required dependencies are healthy (if required by Assignment 2). |
| TST-MIG-01 | NFR-06 | Database | Empty database migrates successfully and expected schema/constraints exist. |
| TST-SEED-01 | NFR-06 | Database | Seed command is repeatable and creates the documented sample menu. |
| TST-E2E-01 | FR-01 to FR-07 | E2E | Customer browses, customizes, adds to cart, authenticates, pays successfully, and sees confirmation. |
| TST-E2E-02 | FR-06, FR-08 | E2E | Payment failure preserves retry path; a successful retry appears in the user's order history. |

## 7. Performance and compatibility checks

The assignment target is API response time below 500 ms with sample data. Record the environment, dataset size, endpoint mix, number of requests, and percentile used before reporting a result; do not claim the target based on one manual request. Agree the mainstream browser/version matrix and mobile viewport set before final acceptance.

## 8. Open decisions

- Confirm exact Assignment 2 test deliverables and CI evidence requirements from the source PDF.
- Confirm Jest/Supertest/Playwright and CI provider against the team's selected stack.
- Define deterministic mock-payment timeout/unknown-result behavior.
- Define how test DB reset is protected from non-test environments.
- Define sample dataset and load profile for the 500 ms performance target.
- Add tests for production deployment/rollback only when the production platform and pipeline are selected.
