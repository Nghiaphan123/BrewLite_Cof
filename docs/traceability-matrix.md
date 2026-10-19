# BrewLite - Requirements Traceability Matrix

**Version:** 0.2  
**Status:** Skeleton for team review (task D-14, P2). Final version in P7.  
**Replaces:** the version 0.1 matrix keyed to Assignment 1 task numbers (kept in section 5 as a coverage table)  
**Related:** [SRS](requirements/srs.md), [UC-01 spec](requirements/use-case-uc01-place-and-pay.md), [Use-case overview](diagrams/use-case-overview.md), [Architecture](architecture/architecture.md), [ADR index](architecture/adr/README.md), [Test strategy](testing/test-strategy.md), [Testing plan](plans/04-testing-plan.md)  
**Sources:** Assignment 2, section 8 (traceability) and Task 1.2

This matrix links every requirement in the [SRS](requirements/srs.md) to its use case or user story, its design (diagrams, architecture sections, ADRs), the code and API that implement it, and the tests that verify it. It uses the column format of Assignment 2, section 8.

## 1. How to read this matrix

- **Requirement:** ID, short name, and MoSCoW priority from the SRS.
- **UC / User Story:** the use case in the [use-case overview][uc], the UC-01 flow or acceptance scenario where relevant, and the Assignment 1 user story.
- **Design:** the diagram and architecture section, plus the ADR that fixed the decision. Link labels are explained in section 4.
- **Code / API:** the endpoint and the code location. Paths marked *(target)* come from [architecture section 13][a13] and do not exist yet; update them when the code is merged. `C-03` already exists: `apps/api/prisma/schema.prisma`, the first migration, and `prisma/seed.ts`.
- **Test:** test IDs from the [test strategy](testing/test-strategy.md#7-test-case-list). In this skeleton every ID is **planned**. In the final version (P7), each ID links to the test file and a passing CI run.

## 2. Functional requirements

| Requirement                                       | UC / User Story                                                     | Design                                                                                                                                              | Code / API                                                                                                                                                                                                   | Test                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| **FR-01** Browse drinks (Must)                    | [UC-02][uc]; A1 Task 2, 3                                           | [CLS][cls] `Product`; [A5][a5] Products module; [A7][a7] UI states                                                                                  | `GET /products`; `apps/api/src/products` *(target)*; menu page in `apps/web` *(target)*; `Product` in `schema.prisma`                                                                                        | API-T01, UNIT-T10, E2E-T01                                        |
| **FR-02** View and customize a drink (Must)       | [UC-03][uc]; A1 Task 4                                              | [CLS][cls] `Product`, `Topping`, `Size`; [ADR 006][adr006] pricing                                                                                  | `GET /products/:id`; `apps/api/src/products` *(target)*; product detail page *(target)*; `Topping` in `schema.prisma`                                                                                        | API-T02, UNIT-T04, UNIT-T11, E2E-T01                              |
| **FR-03** Manage cart (Must)                      | [UC-04][uc]; [UC-01][uc01] A1, A2; A1 Task 5                        | [ACT][act] cart steps; [A7][a7] cart state; [ADR 003][adr003] Zustand                                                                               | Cart store and page in `apps/web` *(target)*; no API (client state)                                                                                                                                          | UNIT-T12, E2E-T01, E2E-T03                                        |
| **FR-04** Register and sign in (Must)             | [UC-05][uc]; [UC-01][uc01] A1; A1 Task 7                            | [CLS][cls] `User`; [A9.1][a91] security; [ADR 013][adr013] JWT                                                                                      | `POST /auth/register`, `POST /auth/login`; `apps/api/src/auth` *(target)*; `User` in `schema.prisma`                                                                                                         | API-T04, API-T05                                                  |
| **FR-05** Create order (Must)                     | [UC-01][uc01] steps 3 to 6, E2, AC-01, AC-08; A1 Task 6             | [SEQ][seq] order creation; [ACT][act]; [CLS][cls] `Order`, `OrderItem`, `OrderItemTopping`; [ADR 006][adr006]                                       | `POST /orders`; `apps/api/src/orders` *(target)*; `Order`, `OrderItem` in `schema.prisma`                                                                                                                    | API-T07, API-T08, API-T09, UNIT-T04, E2E-T01                      |
| **FR-06** Pay without cash (Must)                 | [UC-01][uc01] steps 7 to 12, E3, E8, AC-01, AC-02; US-05; A1 Task 8 | [SEQ][seq] payment alt; [ACT][act] payment failed; [A6.4][a64] provider; [ADR 005][adr005] mock provider                                            | `POST /payments` with `Idempotency-Key`; `apps/api/src/payments` *(target)*; checkout page *(target)*; `Payment` in `schema.prisma`                                                                          | API-T11 to API-T15, API-T21, UNIT-T07, UNIT-T13, E2E-T01, E2E-T02 |
| **FR-07** Confirm order (Must)                    | [UC-01][uc01] step 13, AC-01; US-05; A1 Task 9                      | [SEQ][seq] final result; [ACT][act]                                                                                                                 | Payment response; confirmation page in `apps/web` *(target)*                                                                                                                                                 | API-T11, E2E-T01                                                  |
| **FR-08** View order history (Must)               | [UC-06][uc]; A1 Task 9                                              | [CLS][cls] `Order` index (`userId`, `createdAt`); [A9.1][a91] ownership                                                                             | `GET /orders/me`; `apps/api/src/orders` *(target)*; history page *(target)*                                                                                                                                  | API-T17, E2E-T02                                                  |
| **FR-09** Enforce order state machine (Must)      | [UC-01][uc01] E6, AC-09; [UC-07][uc]; A1 Task 10 (a)                | [SM][sm]; [A6.1][a61] state machine; [CLS][cls] `OrderStatus`; [ADR 008][adr008] cancel edges                                                       | `assertTransition` in `apps/api/src/orders` *(target)*; `OrderStatus` enum in `schema.prisma`                                                                                                                | UNIT-T01, UNIT-T02, UNIT-T03, API-T16                             |
| **FR-10** Make payment idempotent (Must)          | [UC-01][uc01] A5, AC-04, AC-12; A1 Task 10 (b)                      | [SEQ][seq] replay branch; [A6.3][a63] idempotent payment; [CLS][cls] unique (`userId`, `idempotencyKey`)                                            | `POST /payments`; `apps/api/src/payments` *(target)*; `@@unique([userId, idempotencyKey])` on `Payment` in `schema.prisma`                                                                                   | INT-T01, INT-T02, INT-T03, INT-T09, UNIT-T13                      |
| **FR-11** Protect stock under concurrency (Must)  | [UC-01][uc01] step 5, E1, E7, AC-05, AC-06, AC-13; A1 Task 10 (c)   | [SEQ][seq] transaction; [ACT][act] out of stock; [A6.2][a62] optimistic locking; [CLS][cls] `Product.version`, `Order.stockHeld`; [ADR 007][adr007] | `POST /orders`; stock service in `apps/api/src/orders` *(target)*; `Product.version`, `Order.stockHeld`, check `stock >= 0` in the first migration                                                           | INT-T04, INT-T05, INT-T06, API-T07, API-T10, API-T13              |
| **FR-12** Apply promotion and loyalty (Must)      | [UC-01][uc01] A3, AC-11, AC-12; A1 Task 10                          | [A6.5][a65] promotion and loyalty; [CLS][cls] `Promotion`, `LoyaltyTransaction`; [ADR 009][adr009]                                                  | `POST /orders` (promotion code), payment success path; `apps/api/src/promotions` *(target)*; `Promotion`, `LoyaltyTransaction` (`@@unique([orderId, type])`) in `schema.prisma`; seed `BREW10`, `WELCOME20K` | UNIT-T05, UNIT-T06, API-T20, INT-T03                              |
| **FR-13** View a single order status (Should)     | [UC-06][uc]                                                         | [A5][a5] Orders module; [A9.1][a91] ownership                                                                                                       | `GET /orders/:id`; `apps/api/src/orders` *(target)*                                                                                                                                                          | API-T18                                                           |
| **FR-14** Update order status internally (Should) | [UC-07][uc]                                                         | [SM][sm]; [A6.1][a61]                                                                                                                               | Internal transition endpoint (path to decide, `C-09`); `apps/api/src/orders` *(target)*                                                                                                                      | API-T19, UNIT-T02                                                 |
| **FR-15** Cancel an order (Could)                 | [UC-08][uc]; [UC-01][uc01] AC-13                                    | [SM][sm]; [A6.2][a62] release once; [CLS][cls] `Payment.refundedAt`, `REVERSAL`; [ADR 008][adr008]                                                  | Cancel operation in `apps/api/src/orders` *(target)*; UI is Could                                                                                                                                            | UNIT-T03, INT-T06, INT-T07                                        |
| **FR-16** Expire unpaid orders (Could)            | [UC-01][uc01] A6                                                    | [A6.6][a66] order expiry; [CLS][cls] `Order.expiresAt`, index (`status`, `expiresAt`); [ADR 008][adr008]                                            | Expiry job in `apps/api/src/orders` *(target)*; `expiresAt` in `schema.prisma`                                                                                                                               | UNIT-T08, INT-T10                                                 |
| **FR-17** Temporary QR payment demo (Could)       | [UC-01][uc01]                                                       | [A6.4][a64] provider; [ADR 005][adr005]; [payment plan][pay]                                                                                        | `QrDemoProvider` in `apps/api/src/payments` *(target)*, `C-21`                                                                                                                                               | API-T22                                                           |
| **FR-18** Sandbox payment gateway (Could)         | [UC-01][uc01]                                                       | [A6.4][a64] provider; [ADR 005][adr005]; [payment plan][pay]                                                                                        | Sandbox adapter in `apps/api/src/payments` *(target)*, `C-22`                                                                                                                                                | API-T23                                                           |

## 3. Non-functional requirements

| Requirement                                           | UC / User Story                                  | Design                                                                                                | Code / API                                                                                                                                               | Test                                                              |
| ----------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **NFR-01** Performance under 500 ms (Must)            | All API use cases                                | [A1.2][a12] quality drivers; [ADR 011][adr011] performance method (decision 12)                       | All endpoints; sample data from `prisma/seed.ts` (30 products, 10 users)                                                                                 | NFR-T01                                                           |
| **NFR-02** Password hashing (Must)                    | [UC-05][uc]                                      | [A9.1][a91]; [CLS][cls] `User.passwordHash`                                                           | `apps/api/src/auth` *(target)*; seed users use bcrypt cost 10                                                                                            | API-T04, NFR-T02                                                  |
| **NFR-03** JWT protection (Must)                      | [UC-01][uc01] E4, E5, AC-07, AC-10               | [SEQ][seq] JWT check; [A9.1][a91]; [ADR 013][adr013]                                                  | JWT guard in `apps/api/src/auth` *(target)* on orders and payments                                                                                       | API-T06, API-T15, API-T17, NFR-T03                                |
| **NFR-04** Input validation (Must)                    | [UC-01][uc01] E2                                 | [SEQ][seq] validation; [A9.5][a95] error handling                                                     | Global `ValidationPipe` and DTOs in `apps/api/src` *(target)*                                                                                            | API-T08, API-T14, NFR-T04                                         |
| **NFR-05** Browser support (Must)                     | All UI use cases                                 | [A7][a7]; [ADR 011][adr011] browser baseline (decision 13, verify)                                    | `apps/web`                                                                                                                                               | NFR-T05                                                           |
| **NFR-06** Run and handover (Must)                    | A1 section 11                                    | [A10][a10] deployment overview; [ADR 001][adr001]                                                     | [`docker-compose.yml`](../docker-compose.yml), `apps/api/Dockerfile`, `apps/web/Dockerfile`, [`README.md`](../README.md), [deployment.md](deployment.md) | NFR-T06                                                           |
| **NFR-07** Loading, empty, and error states (Must)    | [UC-02][uc], [UC-01][uc01], [UC-06][uc]          | [A7][a7] UI states; [ACT][act] error paths                                                            | Menu, checkout, history pages in `apps/web` *(target)*                                                                                                   | UNIT-T10, NFR-T07                                                 |
| **NFR-08** Mobile-first and PWA (Must)                | All UI use cases                                 | [A7][a7] PWA                                                                                          | Web manifest and layout in `apps/web` *(target)*                                                                                                         | E2E-T04                                                           |
| **NFR-09** Health check and logs (Must)               | -                                                | [A9.2][a92] logging; [A9.3][a93] health check; [ADR 014][adr014]                                      | `GET /health`; `apps/api/src/health` *(target)*; API health check in `docker-compose.yml`                                                                | API-T03, NFR-T10                                                  |
| **NFR-10** CI quality gate (Must)                     | -                                                | [setup plan][devops] S-05                                                                             | `.github/workflows/ci.yml` *(target, S-05)*                                                                                                              | NFR-T08                                                           |
| **NFR-11** Production deployability (Must)            | -                                                | [A10][a10]; [ADR 004][adr004] hosting (proposed); production deployment diagram *(D-12, not written)* | `.github/workflows/cd.yml` *(target, S-07)*; Render services *(S-06)*                                                                                    | NFR-T09                                                           |
| **NFR-12** Repeatable migrations and seed (Must)      | -                                                | [A8][a8] data architecture; [ADR 002][adr002] Prisma                                                  | `apps/api/prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`; `npm run db:deploy`, `npm run db:seed`                                          | INT-T08, INT-T09                                                  |
| **NFR-13** Required tests exist (Must)                | A1 Task 10; A2 Task 5.2                          | [Test strategy](testing/test-strategy.md#6-required-evidence)                                         | `apps/api/src/**/*.spec.ts`, `apps/api/test/`, `tests/e2e/` *(target)*                                                                                   | UNIT-T01 to UNIT-T03, INT-T01, INT-T02, INT-T04, INT-T05, E2E-T01 |
| **NFR-14** Usability of the five-screen flow (Should) | [UC-01][uc01] main flow; A1 section 7 wireframes | [ACT][act]; [A7][a7] screens                                                                          | Pages in `apps/web` *(target)*                                                                                                                           | E2E-T01                                                           |
| **NFR-15** Accessibility basics (Could)               | All UI use cases                                 | [A7][a7]                                                                                              | `apps/web` *(target)*                                                                                                                                    | NFR-T11                                                           |

## 4. Link labels

| Label              | Document                                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| UC, UC-02 to UC-08 | [Use-case overview][uc]                                                                                                        |
| UC-01              | [UC-01 spec][uc01]: steps (section 5), alternate flows A1 to A6, exception flows E1 to E9, acceptance scenarios AC-01 to AC-13 |
| ACT                | [Activity diagram][act] (D-07)                                                                                                 |
| SEQ                | [Sequence diagram][seq] (D-08)                                                                                                 |
| CLS                | [Class diagram and data model][cls] (D-09)                                                                                     |
| SM                 | [Order state machine in the SRS][sm]                                                                                           |
| A*n*               | Section *n* of the [architecture description](architecture/architecture.md) (D-10)                                             |
| ADR *nnn*          | [Architecture decision records](architecture/adr/README.md) (D-11)                                                             |

## 5. Assignment 1 task coverage

| A1 task                               | Requirements                 | Work items                   |
| ------------------------------------- | ---------------------------- | ---------------------------- |
| A1-T1 Project setup                   | NFR-06                       | S-01, S-03, C-01, C-02, D-16 |
| A1-T2 Products API                    | FR-01                        | C-04                         |
| A1-T3 Menu page                       | FR-01, NFR-07                | C-14                         |
| A1-T4 Product detail and options      | FR-02                        | C-15                         |
| A1-T5 Cart                            | FR-03                        | C-16                         |
| A1-T6 Create order API                | FR-05, NFR-04                | C-06                         |
| A1-T7 Register and login              | FR-04, NFR-02, NFR-03        | C-05, C-17                   |
| A1-T8 Cashless payment                | FR-06, FR-10, NFR-07         | C-07, C-18                   |
| A1-T9 Confirmation, history, handover | FR-07, FR-08, NFR-05, NFR-06 | C-08, C-19, S-04, D-16       |
| A1-T10 Backend business rules         | FR-09, FR-10, FR-11, FR-12   | C-09 to C-12, T-05 to T-08   |

## 6. Gaps and follow-up

- **Code and test columns are planned only.** Except for `C-03` and `S-04`, no feature code or test exists yet. Replace *(target)* paths and add test file links as tasks merge; the final matrix (P7) also needs a CI run link per test.
- **Production deployment diagram** (`D-12`) is not written, so NFR-11 has no deployment design yet.
- **Diagram format:** the use-case overview and the sequence diagram are still Mermaid; ADR 010 asks for PlantUML. The links above stay valid after conversion if the `.md` files keep their names.
- **SRS notes:** several SRS rows still say "pending D-01" (pricing, promotion, cancel, stock unit, performance, browsers) although the decision log now has the answers. Update the SRS in a `D-04` follow-up pull request.
- **Status codes** in the API tests (403 or 404, 409) are proposals from the UC-01 spec until the API design is fixed.

[uc]: diagrams/use-case-overview.md
[uc01]: requirements/use-case-uc01-place-and-pay.md
[act]: diagrams/activity-checkout.md
[seq]: diagrams/sequence-checkout.md
[cls]: diagrams/class-domain.md
[sm]: requirements/srs.md#5-order-state-machine
[pay]: plans/05-payment-plan.md
[devops]: plans/02-setup-devops-plan.md
[a5]: architecture/architecture.md#5-c4-level-3-api-components
[a7]: architecture/architecture.md#7-frontend-architecture
[a8]: architecture/architecture.md#8-data-architecture
[a10]: architecture/architecture.md#10-deployment-overview
[a12]: architecture/architecture.md#12-quality-drivers
[a13]: architecture/architecture.md#13-traceability-from-architecture-to-code
[a61]: architecture/architecture.md#61-order-state-machine
[a62]: architecture/architecture.md#62-stock-holding-with-optimistic-locking
[a63]: architecture/architecture.md#63-idempotent-payment
[a64]: architecture/architecture.md#64-payment-provider
[a65]: architecture/architecture.md#65-promotion-and-loyalty
[a66]: architecture/architecture.md#66-order-expiry
[a91]: architecture/architecture.md#91-security
[a92]: architecture/architecture.md#92-logging
[a93]: architecture/architecture.md#93-health-check
[a95]: architecture/architecture.md#95-error-handling
[adr001]: architecture/adr/001-monorepo.md
[adr002]: architecture/adr/002-orm-prisma.md
[adr003]: architecture/adr/003-cart-state-zustand.md
[adr004]: architecture/adr/004-hosting-platform.md
[adr005]: architecture/adr/005-payment-mock-provider.md
[adr006]: architecture/adr/006-money-and-pricing.md
[adr007]: architecture/adr/007-stock-unit.md
[adr008]: architecture/adr/008-cancellation-and-expiry.md
[adr009]: architecture/adr/009-promotion-loyalty.md
[adr011]: architecture/adr/011-test-tooling.md
[adr013]: architecture/adr/013-auth-token-handling.md
[adr014]: architecture/adr/014-logging-and-config.md
