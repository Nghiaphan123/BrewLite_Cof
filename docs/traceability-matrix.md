# BrewLite - Traceability Matrix

**Status:** Phase 1 skeleton — evidence columns fill as tasks close (Phase 2–6)  
**Owner:** H.Tài (SM)  
**Related:** [Product Backlog](requirements/product-backlog.md), [Scenarios](requirements/scenarios.md), [API Contract](architecture/api-contract.md), [Working Agreement](working-agreement.md), assignment PDF §4, §8, §9, §10, §12

This matrix maps every assignment requirement to the artifact that proves it. The left columns are fixed by the PDF; the right columns fill as tasks close. A row with `TBD` is a requirement that has an owning task but no evidence yet — that is expected until Phase 6. A row with **no owning task** is a scope gap and must be resolved at Sprint Planning.

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

| #   | Requirement                            | Owning task                           | Evidence                                       | Status |
| --- | -------------------------------------- | ------------------------------------- | ---------------------------------------------- | ------ |
| N1  | API response < 500 ms on sample data   | Task 2 (products), Task 9 (NFR check) | `docs/testing/` (Phase 2+)                     | TBD    |
| N2  | Password hashed, JWT, input validation | Task 7, Task 6                        | `api-contract.md` §6–§8; `config.md` §4; tests | TBD    |
| N3  | Works on web browsers                  | Task 3–Task 9                         | `ui-decisions.md` §3; e2e (Phase 2+)           | TBD    |

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

## 7. Scope gaps

*(Empty at Phase 1 close. Any requirement with no owning task is added here and resolved at Sprint Planning.)*