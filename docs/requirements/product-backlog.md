# BrewLite - Product Backlog

**Status:** Phase 1 deliverable  
**Owner:** H.Tài, Nghĩa (Task 2.0)  
**Related:** [Working Agreement](../working-agreement.md), [Scenarios](scenarios.md), [API Contract](../architecture/api-contract.md), [Design: Wireframes](../design/wireframes.md), Task spreadsheet `BrewLite-DanhSachTask.xlsx`

This is the Product Backlog for the BrewLite MVP. It is the authoritative list of *what* the team is building, in priority order, with acceptance criteria that make "done" testable. The spreadsheet is the schedule and status view; this document is the requirement view.

> **Scope:** MVP from product selection to payment and confirmation, per assignment PDF §4.1. Out of scope: barista/back-office order management, real payment gateway integration, multi-store support, loyalty redemption (accrual only).

## 1. Product Vision and stakeholders

This section records the two context items the assignment requires before the backlog itself: the Product Vision (PDF §3.1) and the stakeholders (PDF §3.2). They are repeated here — not in a separate file — because Task 2.0's reviewer should see them next to the tasks they justify. Task 3.0 (kickoff) may refine the vision and the role assignments; the backlog's tasks do not change when it does.

### 1.1 Product Vision

> **BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy.**

In English, for the reviewers who read the code and docs in English:

> BrewLite lets customers order and pay for drinks cashlessly in a few taps, reducing queue time and speeding up pickup at the counter.

The vision scopes the MVP: **order → pay → confirm**, not back-office, not delivery, not loyalty redemption. Every task in §4–§13 traces to one of those three steps; anything that doesn't is listed as out of scope in §16.

### 1.2 Stakeholders

The six stakeholders from PDF §3.2, and what each expects from the MVP:

| Stakeholder                              | What they expect                                                                 | Where it shows up in this backlog                                                                                                                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Khách hàng (customer)**                | Order a drink, choose size/topping, pay cashlessly, see order status and history | Tasks 3–9; every User Story is written from this stakeholder's point of view                                                                                                                   |
| **Nhân viên quầy / Barista**             | Receive orders and update preparation status                                     | **Out of MVP scope** (PDF §3.2: "nằm ngoài phạm vi MVP"). The `OrderStatus` enum reserves `PREPARING`/`READY`/`COMPLETED` for a future barista UI, but no screen is built in Phase 1. See §16. |
| **Quản lý cửa hàng / Product Owner**     | Define requirements, prioritize the backlog, accept each increment               | This document (the backlog itself) + the Sprint Review acceptance in `working-agreement.md` §2. The PO role is assigned at Task 3.0.                                                           |
| **Giảng viên nghiệm thu (lecturer)**     | Evaluate process, product, and acceptance criteria                               | The graded tests in Task 10 (PDF §9), the DoD in `working-agreement.md` §5, the evidence notes in the spreadsheet, and this backlog's traceability to the PDF's 10 tasks.                      |
| **Nhóm phát triển (dev team)**           | Analyze, design, build, test, hand over                                          | The backlog's task assignments, the `Owner` column in §3, and the spreadsheet's `Người làm` column.                                                                                            |
| **Đơn vị thanh toán (payment provider)** | Provide or be simulated as the payment gateway                                   | Task 8 (mock payment, ADR 0004). The mock is in-process; no external integration in MVP.                                                                                                       |

**Roles vs. stakeholders:** `working-agreement.md` §1 defines the team's *roles* (PO, SM, Dev Team) — who does the work. This table defines the *stakeholders* — who cares about the outcome. The customer and the barista are stakeholders, not team roles; the PO is both a role and a stakeholder.

### 1.3 How to read this document

- One section per backlog item, numbered `Task 1` … `Task 10` to match the assignment PDF §8. This is the **scoring** numbering (1 point each, 10 total).
- Each task lists: the User Story, Acceptance Criteria (testable), scope boundary (what is *not* included), the spreadsheet rows that implement it, the Sprint/Phase, owner, and evidence docs.
- The **spreadsheet STT** (e.g. `1.0`, `10.0`) is the **scheduling** numbering and does not match the task number. A single backlog task can span many spreadsheet rows (e.g. Task 9 spans rows 38.0–43.0, 57.0–61.0). The mapping table in §15 is the cross-reference.
- Acceptance criteria are written as Given/When/Then where the behavior is testable, and as a checklist where it is structural (scaffolding, docs).
- **Priority:** `P0` = required for MVP demo, `P1` = required for scoring but not demo-blocking, `P2` = stretch. All 10 tasks are P0 by assignment.
- **Traceability:** each task's "Traces to" line points at the scenarios in `scenarios.md` (Task 4.0) that exercise it. The scenarios are the *how*; this doc is the *what*.

## 2. Definition of Ready

A backlog item is ready to be pulled into a Sprint when:

- The User Story and Acceptance Criteria are written (this doc).
- The spreadsheet rows are created and estimated.
- Dependencies are identified and either resolved or scheduled earlier.
- The owning ADR (if any) is accepted or explicitly deferred with a note.

Items not meeting this are not pulled. The PO may pull a not-ready item at their discretion, and records why.

## 3. Backlog summary

| Task    | Title                           | Priority | Sprint   | Spreadsheet rows                 | Primary owner  |
| ------- | ------------------------------- | -------- | -------- | -------------------------------- | -------------- |
| Task 1  | Project init and structure      | P0       | Sprint 1 | 10.0–12.0                        | Nghĩa          |
| Task 2  | Products API                    | P0       | Sprint 1 | 14.0–15.0, 19.0                  | Nghĩa          |
| Task 3  | Menu page (frontend)            | P0       | Sprint 1 | 16.0, 18.0                       | H.Tài (backup) |
| Task 4  | Product detail and options      | P0       | Sprint 1 | 13.0, 17.0                       | H.Tài (backup) |
| Task 5  | Cart                            | P0       | Sprint 2 | 23.0, 29.0                       | Nghĩa          |
| Task 6  | Create order API                | P0       | Sprint 2 | 22.0, 25.0, 28.0                 | H.Tài          |
| Task 7  | Register / login (JWT)          | P0       | Sprint 2 | 24.0, 26.0, 27.0, 30.0, 31.0     | H.Tài          |
| Task 8  | Mock payment                    | P0       | Sprint 3 | 35.0–37.0, 41.0                  | H.Tài          |
| Task 9  | Confirmation, history, handover | P0       | Sprint 3 | 38.0–40.0, 42.0, 57.0, 59.0–61.0 | Nghĩa          |
| Task 10 | Backend business rules          | P0       | Sprint 3 | 44.0–55.0                        | H.Tài          |

Sprint assignments follow the assignment PDF §2.3. The spreadsheet's Phases 1–6 subdivide these further; see §13.

## 4. Task 1 — Project init and structure

**Priority:** P0 · **Sprint:** 1 · **Owner:** Nghĩa

### User Story

> As a developer on the team, I want a runnable two-app scaffold with documented setup, so that I can start feature work without spending a day on environment problems.

### Acceptance Criteria

- [ ] `apps/api` is a NestJS app that responds on its configured port; `apps/web` is a Next.js App Router app that renders a starter page on port 3000.
- [ ] Both apps install and run from their own directory with the commands in `docs/setup.md`; the root has no `package.json`.
- [ ] `apps/api/.env.example` and `apps/web/.env.example` exist and match `docs/config.md` §2.
- [ ] `.gitignore` excludes `node_modules`, `.env`, `.next`, `dist`.
- [ ] `README.md` at root and per-app READMEs exist and link to `docs/setup.md`.
- [ ] A teammate clones on a clean machine and reaches the "Hello" check table in `docs/setup.md` §8 without asking for help.

### Out of scope

CI workflows, deployment, production Dockerfiles. `apps/api/Dockerfile` and `apps/web/Dockerfile` may exist from the scaffold but are not wired into Compose until Task 9/Phase 6.

### Evidence

`docs/setup.md`, `docs/config.md`, `.env.example` files, `README.md`. Spreadsheet rows 10.0–12.0.

## 5. Task 2 — Products API

**Priority:** P0 · **Sprint:** 1 · **Owner:** Nghĩa

### User Story

> As a customer, I want the app to load the drinks menu from the server, so that the menu can change without redeploying the frontend.

### Acceptance Criteria

- [ ] `GET /products` returns a JSON array; each item has `id`, `name`, `price`, `imageUrl`, `stock`.
- [ ] `GET /products/:id` returns one product or `404` with the standard error envelope.
- [ ] `price` is an integer in VND (no decimal point); see `docs/config.md` §3.
- [ ] Data comes from PostgreSQL via Prisma, seeded by `prisma/seed.ts` with at least 6 drinks covering all sizes used in the demo.
- [ ] Unit tests cover the service and controller happy path and the `404` case.
- [ ] `GET /products` responds in < 500 ms against seed data (assignment PDF §4.2).

### Out of scope

Pagination, filtering, search, product images upload, stock mutation. Stock is read-only here; it is decremented in Task 10.

### Evidence

`apps/api/src/modules/products/`, `apps/api/prisma/schema.prisma`, `apps/api/prisma/seed.ts`. Spreadsheet rows 14.0–15.0, 19.0.

## 6. Task 3 — Menu page (frontend)

**Priority:** P0 · **Sprint:** 1 · **Owner:** H.Tài (backup; primary to be confirmed at Sprint Planning)

### User Story

> As a customer, I want to browse the menu as a grid of cards, so that I can pick a drink quickly.

### Acceptance Criteria

- [ ] The menu route (`/`) renders a grid of `ProductCard` components from `GET /products`.
- [x] Each card shows image, name, and price formatted as VND.
- [ ] The page handles three states explicitly: **loading** (skeleton or spinner), **empty** (message), **error** (retry affordance).
- [x] Clicking a card navigates to the product detail route.
- [ ] Layout is responsive at 360 px and 1280 px widths.
- [ ] A header shows the cart badge with item count (0 when empty).

### Out of scope

Infinite scroll, filtering by category, search, favorites.

### Evidence

`apps/web/src/app/page.tsx`, `apps/web/src/features/menu/ProductCard.tsx`. Wireframe: `docs/design/wireframes.md` (Menu). Spreadsheet rows 16.0, 18.0.

## 7. Task 4 — Product detail and options

**Priority:** P0 · **Sprint:** 1 · **Owner:** H.Tài (backup; primary to be confirmed at Sprint Planning)

### User Story

> As a customer, I want to choose a size and toppings on the product page, so that the price reflects what I am ordering.

### Acceptance Criteria

- [ ] The product detail route (`/products/[id]`) shows name, image, base price, and size selector S/M/L.
- [ ] Size selection updates the displayed price deterministically; the rule is in `docs/design/ui-decisions.md` and mirrored in the backend price function.
- [ ] Topping selection is multi-select; each topping adds a fixed amount; the displayed total updates on every change.
- [ ] "Add to cart" is disabled until a size is selected; the button label includes the current total.
- [ ] The frontend total and the backend-computed `lineTotal` (Task 6) agree for the same inputs. This is verified by a shared fixture, not by eyeballing.

### Out of scope

Per-item notes, quantity discount, size-specific stock.

### Evidence

`apps/web/src/app/products/[id]/page.tsx`, `apps/web/src/features/product/`, `docs/design/ui-decisions.md` (price rule). Wireframe: `docs/design/wireframes.md` (Chi tiết). Spreadsheet rows 13.0, 17.0.

## 8. Task 5 — Cart

**Priority:** P0 · **Sprint:** 2 · **Owner:** Nghĩa

### User Story

> As a customer, I want a cart that survives navigation, so that I can add several drinks and pay once.

### Acceptance Criteria

- [ ] A Zustand store holds cart items with `productId`, `name`, `size`, `toppings`, `qty`, `lineTotal`.
- [ ] Adding the same product with the same size and toppings increments quantity instead of creating a duplicate line.
- [ ] The cart page (`/cart`) lists items with quantity controls and a remove button; the total recomputes on every change.
- [ ] The header badge reflects the total quantity, not the number of lines.
- [ ] Cart state survives client-side navigation but not a full page reload (persistence is out of scope).
- [ ] The cart total matches the backend total for the same cart; verified by the shared price fixture from Task 4.

### Out of scope

Server-side cart, cart merge across devices, saved carts, coupons (Task 10 adds discount *application*, not cart storage).

### Evidence

`apps/web/src/store/cart-store.ts`, `apps/web/src/app/cart/page.tsx`, `apps/web/src/features/cart/`. Wireframe: `docs/design/wireframes.md` (Giỏ hàng). Spreadsheet rows 23.0, 29.0.

## 9. Task 6 — Create order API

**Priority:** P0 · **Sprint:** 2 · **Owner:** H.Tài

### User Story

> As a customer, I want my cart to become an order on the server, so that it can be paid and later looked up.

### Acceptance Criteria

- [ ] `POST /orders` accepts a cart payload, validates it with `class-validator`, and persists an `Order` with status `PENDING` plus its `OrderItem` rows.
- [ ] The server recomputes `total` and each `lineTotal`; client-supplied prices are ignored. A tampered payload yields the server's price, not the client's.
- [ ] The response includes the order `id` (human-readable order code per `docs/design/ui-decisions.md`) and `status`.
- [ ] Invalid payloads return `400` with field-level messages; the error envelope matches `docs/architecture/api-contract.md`.
- [ ] Unit tests cover: valid cart, empty cart, invalid size, missing product, price tampering, total calculation.
- [ ] The order is not paid here; `PAID` is set by Task 8.

### Out of scope

Stock reservation (Task 10), promotions (Task 10), order state transitions beyond `PENDING` (Task 10).

### Evidence

`apps/api/src/modules/orders/`, `apps/api/src/modules/orders/dto/create-order.dto.ts`. API contract: `docs/architecture/api-contract.md` §`POST /orders`. Spreadsheet rows 22.0, 25.0, 28.0.

## 10. Task 7 — Register / login (JWT)

**Priority:** P0 · **Sprint:** 2 · **Owner:** H.Tài

### User Story

> As a returning customer, I want to register and log in, so that my order history is tied to me and my order is protected.

### Acceptance Criteria

- [ ] `POST /auth/register` creates a user with a bcrypt-hashed password and returns `201`; duplicate email returns `409`.
- [ ] `POST /auth/login` verifies the password and returns a JWT; wrong password returns `401` with a generic message (no user enumeration).
- [ ] `JWT_SECRET` and `JWT_EXPIRES_IN` are read from env per `docs/config.md` §2.1; no hard-coded secret.
- [ ] `JwtAuthGuard` protects `POST /orders`; an unauthenticated request returns `401`. The guard is applied to exactly the routes named in the API contract.
- [ ] Frontend has `/auth/register` and `/auth/login` pages; the token is stored client-side and attached to `POST /orders`.
- [ ] Unit tests cover: valid register, duplicate email, valid login, wrong password, malformed token.

### Out of scope

Refresh tokens, password reset, email verification, OAuth, role-based access (barista is out of MVP scope per PDF §3.2).

### Evidence

`apps/api/src/modules/auth/`, `apps/api/src/common/guards/jwt-auth.guard.ts`, `apps/web/src/features/auth/`, `apps/web/src/app/auth/`. API contract: `docs/architecture/api-contract.md` §`POST /auth/*`. Wireframe: `docs/design/wireframes.md` (auth screens — to be added alongside this task). Spreadsheet rows 24.0, 26.0, 27.0, 30.0, 31.0.

## 11. Task 8 — Mock payment

**Priority:** P0 · **Sprint:** 3 · **Owner:** H.Tài

### User Story

> As a customer, I want to pay with a wallet or card simulation and see the result immediately, so that I know whether my order succeeded.

### Acceptance Criteria

- [ ] The checkout page (`/checkout`) shows the total, a Wallet/Card selector, and a confirm button (wireframe: `docs/design/wireframes.md` — Thanh toán).
- [ ] `POST /payments` accepts an order id and a method, and transitions the order to `PAID` on success or `PAYMENT_FAILED` on failure.
- [ ] `PAYMENT_MOCK_MODE` in `apps/api/.env` selects `success`, `failure`, or `random`; the mock lives in-process (no separate port, per `docs/config.md` §1.1 and ADR 0004).
- [ ] On failure, the cart is **not** cleared and the order remains retrievable; the user can retry.
- [ ] On success, the response includes the order code and status; the frontend navigates to the confirmation route.
- [ ] Unit tests cover success and failure paths, including "retry after failure succeeds."

### Out of scope

Real gateway integration, partial payments, refunds, saved cards. Idempotency is Task 10, not here — this task may create a duplicate on double-submit, and Task 10's integration test proves the fix.

### Evidence

`apps/api/src/modules/payments/`, `apps/web/src/app/checkout/page.tsx`, `apps/web/src/features/checkout/`, ADR 0004. Spreadsheet rows 35.0–37.0, 41.0.

## 12. Task 9 — Confirmation, history, handover

**Priority:** P0 · **Sprint:** 3 · **Owner:** Nghĩa

### User Story

> As a customer, I want to see my order confirmation and my past orders, and the team wants the whole thing runnable from one command, so that the demo is reproducible.

### Acceptance Criteria

- **Confirmation**
  - [ ] The confirmation route (`/orders/[id]/confirmation`) shows order code, status, and a "back to menu" action.
  - [ ] The page handles "order not found" and "not your order" with a safe message.
- **History**
  - [ ] `GET /orders/me` returns the caller's orders, guarded by JWT, newest first.
  - [ ] `/orders` (frontend) lists past orders with code, date, total, status; clicking one opens its confirmation/detail view.
- **Handover**
  - [ ] `docker-compose.yml` brings up `db`, `api`, `web` with one `docker compose up`; the stack is demo-ready without local Node installs.
  - [ ] `README.md` has the one-command quickstart and links to `docs/setup.md` for the non-Docker path.
  - [ ] The Definition of Done checklist (assignment PDF §10) is verified for all 10 tasks and recorded in the Retro note.
  - [ ] An end-to-end demo script (select → cart → login → pay → confirm → history) runs green on a clean machine.

### Out of scope

Admin order management, refunds, notifications.

### Evidence

`apps/web/src/app/orders/`, `apps/api/src/modules/orders/` (`GET /orders/me`), `docker-compose.yml`, `README.md`. Spreadsheet rows 38.0–40.0, 42.0, 57.0, 59.0–61.0.

## 13. Task 10 — Backend business rules

**Priority:** P0 · **Sprint:** 3 · **Owner:** H.Tài

This is the assignment's "Task 10 – nghiệp vụ backend" (PDF §9), worth 1 point but containing four distinct requirements, each with its own test.

### User Story

> As the business, I want the backend to enforce order lifecycle, idempotency, stock correctness, and loyalty, so that the system is correct under real conditions, not just on the happy path.

### Acceptance Criteria (four sub-requirements)

**10a — Order State Machine**
- [ ] States: `PENDING → PAID → PREPARING → READY → COMPLETED`; exceptions `PAYMENT_FAILED`, `CANCELLED`. Exactly as PDF §9.1.
- [ ] `assertTransition(from, to)` throws on any transition not in the diagram. `COMPLETED` and `CANCELLED` are terminal.
- [ ] Applied in `OrderService` so that no code path can bypass it.
- [ ] **Unit test (a):** invalid transitions are rejected; valid ones pass. This is one of the three explicitly graded tests (PDF §9).

**10b — Idempotent payment**
- [ ] `POST /payments` honors an `Idempotency-Key` header; the same key twice creates one payment and returns the same result, not a second charge.
- [ ] The key is stored with the payment record; a replay with a different body but the same key is rejected with a conflict.
- [ ] **Integration test (b):** sending the same `Idempotency-Key` twice creates exactly one order/payment. One of the three graded tests.

**10c — Stock control under concurrency**
- [ ] Order creation (or payment, per ADR) decrements stock inside a transaction with optimistic locking; `version` field on the stock-bearing row.
- [ ] When stock is insufficient, the request fails with a specific error, not a generic `500`.
- [ ] **Integration test (c):** concurrent orders for the same product do not exceed available stock. One of the three graded tests.

**10d — Promotions and loyalty**
- [ ] A valid promo code reduces the order total; an invalid or expired code returns a specific error.
- [ ] After an order reaches `PAID`, the user's `loyaltyPoints` increase by the configured rule.
- [ ] The frontend surfaces the discount and the earned points (wireframe addition noted in `docs/design/wireframes.md`).
- [ ] Unit tests cover promo validity, discount math, and points accrual.

### Out of scope

Multi-currency, tiered loyalty, referral codes, promo stacking. The state machine does **not** model barista actions beyond `PREPARING`/`READY` transitions (those are triggered by API in the demo, not by a barista UI, which is out of MVP).

### Evidence

`apps/api/src/modules/orders/` (state machine, `assertTransition`), `apps/api/src/modules/payments/` (idempotency), `apps/api/src/modules/promotions/`, `apps/api/src/modules/loyalty/`, `apps/api/prisma/schema.prisma` (version, promo, points). ADR 0004 for the state machine and idempotency decisions. Spreadsheet rows 44.0–55.0.

## 14. Dependencies between tasks

```text
Task 1 ──► Task 2 ──► Task 3 ──► Task 5 ──► Task 6 ──► Task 8 ──► Task 9
                └──► Task 4 ──► Task 5         ▲
Task 7 ─────────────────────────────────────────┘   (auth guards POST /orders)
Task 6, 8 ──► Task 10 (state machine, idempotency, stock)
```

- Task 4 and Task 2 are independent and can run in parallel.
- Task 7 must land before Task 6's guard can be enforced end-to-end; Task 6 can merge before Task 7 with the guard stubbed, but the Task 6 `● Xong` note must say so.
- Task 10 depends on Task 6 and Task 8 being merged; its tests exercise both.
- Task 9's handover portion depends on Tasks 1–8.

This graph matches the "Làm sau STT X" column in the spreadsheet; if they disagree, the spreadsheet is authoritative for schedule and this doc is updated to match.

## 15. Spreadsheet cross-reference

| Backlog task | PDF task | Spreadsheet STT (rows)           | Phase |
| ------------ | -------- | -------------------------------- | ----- |
| Task 1       | 1        | 10.0–12.0                        | 2     |
| Task 2       | 2        | 14.0–15.0, 19.0                  | 2     |
| Task 3       | 3        | 16.0, 18.0                       | 2     |
| Task 4       | 4        | 13.0, 17.0                       | 2     |
| Task 5       | 5        | 23.0, 29.0                       | 3     |
| Task 6       | 6        | 22.0, 25.0, 28.0                 | 3     |
| Task 7       | 7        | 24.0, 26.0, 27.0, 30.0, 31.0     | 3     |
| Task 8       | 8        | 35.0–37.0, 41.0                  | 4     |
| Task 9       | 9        | 38.0–40.0, 42.0, 57.0, 59.0–61.0 | 4, 6  |
| Task 10      | 10       | 44.0–55.0                        | 5     |

Rows **1.0–9.0** (Phase 1) are not backlog tasks; they are analysis and setup work that precedes the product backlog items. They are tracked in the spreadsheet and evidenced in `docs/requirements/`, `docs/architecture/`, and `docs/design/`, but they do not score against the 10-task rubric.

## 16. Out of scope (explicit)

Recorded so the team can say "no" without debate:

- Barista / kitchen display, order acceptance UI (PDF §3.2: out of MVP).
- Real payment gateway (Stripe/VNPay/MoMo); mock only.
- Admin product CRUD.
- Notifications (email/SMS/push).
- Multi-language UI.
- Offline mode / PWA.
- Analytics, dashboards.
- Loyalty redemption (accrual is in Task 10; spending points is not).

## 17. Open items

| Item                                                                                                            | Owner | Closes when                           |
| --------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------- |
| Confirm primary owners for Task 3 and Task 4                                                                    | H.Tài | Sprint 1 Planning                     |
| Confirm role assignment (PO = Nghĩa, SM = H.Tài) is reflected in `working-agreement.md` §1 and the kickoff note | H.Tài | Task 3.0 `● Xong` (closed 2026-10-22) |
| Add auth screens to `docs/design/wireframes.md`                                                                 | Luân  | Task 7.0 `● Xong`                     |
| Ratify state-machine and idempotency decisions in ADR 0004                                                      | H.Tài | ADR 0004 accepted                     |
| Add promo/points row to the wireframe index                                                                     | -     | Task 49.0 / 53.0 `● Xong`             |

---

## Notes on choices I made (so you can accept or override)

1. **Two numbering systems, reconciled by a table.** The PDF numbers tasks 1–10; the spreadsheet numbers rows `1.0`–`64.0`. They look similar enough that a reader will conflate them (e.g. "Task 10" the PDF task vs. `10.0` the scaffold row). I kept the PDF numbering as the section headers (§4–§13) and used "spreadsheet row" everywhere else, with §15 as the single mapping. If you rename sections to use the spreadsheet numbering, the doc stops matching the assignment rubric — which is the thing the grader checks.

2. **Task 10 is one section with four lettered sub-requirements (10a–10d), not four tasks.** It's worth 1 point in the rubric, but it has four distinct acceptance-criteria blocks and three explicitly graded tests. Splitting it into four backlog items would misrepresent the scoring; flattening it into one bullet list would hide that each sub-requirement has its own test. The lettered subsections are the compromise, and 10a/10b/10c are labeled as "one of the three graded tests" so nobody forgets which tests the grader looks for.

3. **I made the price-agreement between Task 4 and Task 6 an explicit acceptance criterion** ("the frontend total and the backend-computed `lineTotal` agree ... verified by a shared fixture"). This is the single most likely integration defect in this MVP — the frontend computes a total, the backend recomputes it, and they drift. Making it a criterion with a fixture as the proof mechanism is stronger than "they should match."

4. **Task 8 explicitly says idempotency is *not* here.** It's tempting to fold idempotency into the payment task, but the assignment puts it in Task 10 and grades it with a specific test (PDF §9). Task 8's criteria say the duplicate-on-double-submit is a known gap that Task 10 fixes — this makes the demo honest and gives Task 10's test something to prove.

5. **§16 (Out of scope) is the section that prevents scope creep in Sprint Planning.** The PDF's stakeholder section (§3.2) says barista functions are out of MVP, but nothing in the team's docs said it until now. Listing the "no"s explicitly means a Sprint Planning conversation can point at it instead of relitigating.

6. **§14's dependency graph and §15's cross-reference table are the two things that make this doc useful during Sprints, not just at Task 2.0 close.** The graph is how you decide what can run in parallel; the table is how you find the spreadsheet rows when you mark something `● Xong`. Without both, this doc is a one-time artifact.

7. **One forward reference to watch:** §17 says "add auth screens to `docs/design/wireframes.md`" — that doc (Task 5.0) is next in Phase 1 order, and the PDF's 5 wireframes don't include auth screens. Either the wireframes doc adds a 6th/7th screen for login/register, or Task 7's frontend acceptance criteria are weakened. I put it in the open items rather than silently expanding the wireframe scope — your call at Task 5.0 time.
