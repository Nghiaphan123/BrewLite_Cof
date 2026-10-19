# ADR 015: Use Vitest as the test runner in the API

**Status:** Accepted (2026-10-19). Supersedes the test runner part of [ADR 011](011-test-tooling.md).  
**Date:** 2026-10-19  
**Decision log:** [Decision 14](../../plans/decision-log.md)  
**Related tasks:** T-01, T-02, T-03 to T-08, C-01

## Context

ADR 011 chose Jest and Supertest for API tests. The API was then scaffolded with the NestJS 12 CLI (`C-01`), which generated Vitest instead: `vitest.config.ts`, `vitest.config.e2e.ts`, `@vitest/coverage-v8`, and `npm test` runs `vitest run`. The sample test already passes with Vitest. The project uses ES modules (`"type": "module"`), which Vitest supports without extra configuration.

## Options considered

- Keep ADR 011: replace the scaffold's Vitest setup with Jest
- Use Vitest in `apps/api`, keep Supertest, React Testing Library, Playwright, and real PostgreSQL from ADR 011

## Decision

Use **Vitest** with **Supertest** for unit and integration tests in `apps/api`. Everything else in ADR 011 stays: Playwright for end to end, real PostgreSQL for integration tests, the performance method, and the browser baseline. For `apps/web`, which has no runner yet, `T-02` should prefer Vitest with React Testing Library so both apps use one runner.

## Consequences

**Benefits**

- No rework of the generated setup; `npm test`, `npm run test:e2e`, and `npm run test:cov` already work.
- The API is an ES module project, which Vitest runs natively.
- The test API (`describe`, `it`, `expect`, `vi.fn`) is close to Jest, so the test strategy and test IDs do not change.

**Costs and risks**

- Some NestJS guides and examples assume Jest; replace `jest.fn` with `vi.fn` when copying them.
- Integration tests that share one PostgreSQL database must not run in parallel files. Run them with `--no-file-parallelism` or one worker (`T-02`).

**Follow-up**

- Done: decision 11 is marked **Changed** for the API runner in the decision log, and ADR 011 is marked superseded by this ADR for the runner.
- `T-02` adds the integration configuration (test database, single worker) and the web runner.

## Revisit if

A required NestJS testing feature does not work under Vitest.

---
Back to the [ADR index](README.md). Architecture overview: [architecture.md](../architecture.md).
