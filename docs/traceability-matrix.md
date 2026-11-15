# BrewLite — Traceability matrix

**Status:** Assignment 2 rewrite. Evidence is what exists in this repository today.  
**Owner:** team  
**Related:** [SRS](requirements/srs.md), [UC-01](requirements/use-case-uc01-place-and-pay.md), [modeling notes](diagrams/task2-modeling.md), [ADR 0007](architecture/adr/0007-hosting-platform.md)

Columns follow the Assignment 2 template: requirement, use case, design, code or API, test. The status column is extra so a row is not read as "done in production" when it is not.

Status words:

| Status     | Meaning                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| Covered    | The named code and test exist in this repo.                                   |
| Partial    | Some of the requirement is implemented or tested. The gap is named.           |
| Documented | The design exists. The code or the test does not.                             |
| Refused    | The requirement is Won't. No code is expected.                                |
| Not run    | The check needs a pipeline, a deploy, or a measurement that has not happened. |

No row claims a production URL or a recorded CI run. The Playwright browser-test source and CI job exist at `tests/e2e/menu-to-confirmation.spec.ts` and `.github/workflows/ci.yml`; no browser-test run is recorded yet.

## 1. Functional requirements (PDF §4.1)

| #   | Requirement                                   | Owning task               | Evidence (doc / test / commit)                                                          | Status |
| --- | --------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------- | ------ |
| F1  | Menu list with image, name, price             | Task 2 (API), Task 3 (UI) | `api-contract.md` §4; `scenarios.md` S-MAIN-1; `GET /api/v1/products`                   | TBD    |
| F2  | Product detail, choose size and toppings      | Task 4                    | `api-contract.md` §5; `scenarios.md` S-MAIN-1; `ui-decisions.md` §4.2 (pricing fixture) | TBD    |
| F3  | Cart add/edit/remove; auto total              | Task 5                    | `scenarios.md` S-CART-1, S-CART-2; `ui-decisions.md` §5.1                               | TBD    |
| F4  | Register / login (JWT)                        | Task 7                    | `api-contract.md` §6–§7; `scenarios.md` S-AUTH-1..3                                     | TBD    |
| F5  | Create order and pay cashless                 | Task 6, Task 8            | `api-contract.md` §8–§9; `scenarios.md` S-MAIN-1, S-PAY-1..6                            | TBD    |
| F6  | Confirmation (code, status) and order history | Task 9                    | `api-contract.md` §10–§11; `scenarios.md` S-ORD-4; `wireframes.md` §8, §11              | TBD    |

## 2. Non-functional requirements (PDF §4.2)

| #   | Requirement                            | Owning task                           | Evidence                                                                                                                                                                                                                         | Status |
| --- | -------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| N1  | API response < 500 ms on sample data   | Task 2 (products), Task 9 (NFR check) | [`testing/nfr-response-time.md`](testing/nfr-response-time.md) (15/11/2026): p95 of `GET /products`, `GET /products/:id`, `POST /auth/login`, `GET /orders/me` all < 500 ms; script `apps/api/scripts/measure-response-time.mjs` | Done   |
| N2  | Password hashed, JWT, input validation | Task 7, Task 6                        | `api-contract.md` §6–§8; `config.md` §4; tests                                                                                                                                                                                   | TBD    |
| N3  | Works on web browsers                  | Task 3–Task 9                         | `ui-decisions.md` §3; e2e (Phase 2+)                                                                                                                                                                                             | TBD    |

## 3. Backlog tasks (PDF §8) — one row per scored task

| Task    | Acceptance criteria     | Owning spreadsheet rows          | Evidence                                             | Status |
| ------- | ----------------------- | -------------------------------- | ---------------------------------------------------- | ------ |
| Task 1  | `product-backlog.md` §4 | 10.0–12.0                        | `setup.md`, `config.md`, `README.md`                 | TBD    |
| Task 2  | §5                      | 14.0–15.0, 19.0                  | `api-contract.md` §4–§5; unit tests                  | TBD    |
| Task 3  | §6                      | 16.0, 18.0                       | `wireframes.md` §4; e2e                              | TBD    |
| Task 4  | §7                      | 13.0, 17.0                       | `wireframes.md` §5; pricing fixture test             | TBD    |
| Task 5  | §8                      | 23.0, 29.0                       | `wireframes.md` §6; cart tests                       | TBD    |
| Task 6  | §9                      | 22.0, 25.0, 28.0                 | `api-contract.md` §8; order tests                    | TBD    |
| Task 7  | §10                     | 24.0, 26.0, 27.0, 30.0, 31.0     | `api-contract.md` §6–§7; auth tests                  | TBD    |
| Task 8  | §11                     | 35.0–37.0, 41.0                  | `api-contract.md` §9; payment tests                  | TBD    |
| Task 9  | §12                     | 38.0–40.0, 42.0, 57.0, 59.0–61.0 | `api-contract.md` §10–§11; `deployment.md` (Phase 6) | TBD    |
| Task 10 | §13 (10a–10d)           | 44.0–55.0                        | ADR 0004; `scenarios.md` S-ORD-5, S-PAY-5, S-ORD-6   | TBD    |

## 4. Graded tests (PDF §9) — the three the grader checks

| Test                                         | Requirement | Scenario                        | Evidence                               | Status |
| -------------------------------------------- | ----------- | ------------------------------- | -------------------------------------- | ------ |
| (a) Invalid state transition rejected        | Task 10a    | `scenarios.md` S-ORD-5          | unit test; `assertTransition`          | TBD    |
| (b) Same `Idempotency-Key` twice → one order | Task 10b    | `scenarios.md` S-PAY-5, S-PAY-6 | integration test; `api-contract.md` §9 | TBD    |
| (c) Concurrent orders do not oversell        | Task 10c    | `scenarios.md` S-ORD-6          | integration test; ADR 0004 D1          | TBD    |

## 5. Definition of Done (PDF §10) — per task, not per row

DoD is verified per task via the spreadsheet's evidence note (`working-agreement.md` §4), not via a matrix row. The matrix's §3 rows cite the evidence note; the DoD checklist itself lives in `working-agreement.md` §5.

## 6. Entities (PDF §12.2)

| Entity      | Owning task | Evidence                                                              | Status |
| ----------- | ----------- | --------------------------------------------------------------------- | ------ |
| `Product`   | Task 2      | `prisma/schema.prisma`; ADR 0003                                      | TBD    |
| `User`      | Task 7      | `prisma/schema.prisma`; ADR 0003 open Q (loyalty column)              | TBD    |
| `Order`     | Task 6      | `prisma/schema.prisma`; ADR 0004                                      | TBD    |
| `OrderItem` | Task 6      | `prisma/schema.prisma`                                                | TBD    |
| `Payment`   | Task 8      | `prisma/schema.prisma`; ADR 0004 D4 (`idempotencyKey`, `requestHash`) | TBD    |

## 4. How to update a row

Change the status in the same pull request as the code or the test. Do not mark NFR-05 Covered until `GET /api/v1/health` responds, a pull request has run the pipeline, and the README contains a URL that answers. Do not invent that URL in this file.
