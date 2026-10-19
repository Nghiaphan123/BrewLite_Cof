# ADR 011: Standardize test tools, performance method, and browser baseline

**Status:** Superseded by [ADR 015](015-test-runner-vitest.md) for the test runner (Jest replaced by Vitest). The rest stays Accepted (browser list to verify).  
**Date:** 2026-10-19  
**Decision log:** [Decisions 11, 12, and 13](../../plans/decision-log.md)  
**Related tasks:** T-01, T-02, T-10, T-11, D-04

## Context

Assignments require unit, integration, and at least one end-to-end test, plus an API response time under 500 ms and support for mainstream browsers. Concurrency, optimistic locking, and unique-constraint tests only prove anything on a real database engine.

## Options considered

- Jest, Supertest, React Testing Library, Playwright, real PostgreSQL
- Cypress for end to end
- SQLite or an in-memory database for integration tests

## Decision

- **API unit and integration:** Jest and Supertest. *Superseded by ADR 015: Vitest and Supertest.*
- **Frontend unit and component:** Jest and React Testing Library. *Superseded by ADR 015: Vitest is preferred with React Testing Library (set up in T-02).*
- **End to end:** Playwright.
- **Integration database:** real PostgreSQL (a CI service container or Docker Compose), not SQLite.
- **Performance:** about 30 products and 10 users, bcrypt cost 10; 20 warm-up requests then 200 requests per endpoint at 10 concurrent connections with `autocannon`, on `GET /products`, `GET /products/:id`, `POST /auth/login`, `POST /orders`, `POST /payments`, and `GET /orders/me`. **Pass:** p95 under 500 ms, run on the Compose stack and on production after warming it.
- **Browsers:** the latest two stable versions of Chrome, Edge, Firefox, and Safari on desktop, plus Chrome on Android and Safari on iOS. Playwright runs on Chromium and WebKit; manual smoke tests use desktop Chrome and one real phone.

## Consequences

**Benefits**

- Playwright runs in CI, gives traces on failure, and covers Chromium, Firefox, and WebKit.
- Tests on real PostgreSQL give trustworthy results for locking and constraints.
- A written performance method makes the 500 ms claim checkable.

**Costs and risks**

- A database service is needed in CI, which adds setup time.
- The browser list is a promise; the framework's own support list may be narrower.

**Follow-up**

- `T-02` sets up the test database and the CI test job. Test IDs use level prefixes (`UNIT-`, `API-`, `INT-`, `E2E-`, `NFR-`) and appear in the traceability matrix.
- `T-10` holds the performance script and results with the environment recorded.
- **Verify:** check the browser support list of the Next.js version in use before promising the browsers above.

## Revisit if

A tool does not run well in CI or the browser list exceeds what Next.js supports.

---
Back to the [ADR index](README.md). Architecture overview: [architecture.md](../architecture.md).
