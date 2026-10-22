# ADR 0004 — Payment mock, order state machine, idempotency, and loyalty

- **Status:** Proposed → Accepted when Tasks 8 and 10 close
- **Date:** 2026-10-22
- **Deciders:** H.Tài, Nghĩa
- **Related:** [ADR 0001](0001-record-architecture-decisions.md), [ADR 0003](0003-database-postgres-prisma.md), [Configuration](../../config.md) §2.1, §3, [Scenarios](../../requirements/scenarios.md) §7, §9, §10, §13, [Product Backlog](../../requirements/product-backlog.md) Task 8, Task 10, [API Contract](../api-contract.md)

## Context

BrewLite's payment flow is a mock (PDF §6: "Mock Payment Service (mô phỏng Momo/VNPay/Stripe)"). It must nonetheless behave like a real gateway at the boundaries that Task 10 grades (PDF §9):

- **State machine:** orders move `PENDING → PAID → PREPARING → READY → COMPLETED`, with `PAYMENT_FAILED` and `CANCELLED` as exceptions. Invalid transitions are rejected.
- **Idempotency:** the same payment request sent twice must not charge twice or create two orders. The grader sends two requests with the same `Idempotency-Key` and asserts one order.
- **Concurrency:** concurrent orders for the same product must not oversell. The grader sends concurrent requests and asserts stock never goes negative.
- **Loyalty:** points accrue after an order reaches `PAID`.

These four requirements are coupled. The point at which stock decrements determines what idempotency must prevent (a duplicate decrement, or a duplicate charge, or both). The point at which loyalty accrues depends on which transitions are terminal and whether a `PAYMENT_FAILED` order can be retried. The state machine's exception edges (`PAYMENT_FAILED`, `CANCELLED`) determine whether a retry creates a new order or reuses one.

The team must decide these together, and record them where a reviewer and the grader can find them.

Constraints:

- **Phase 1 deadline.** `config.md` §7 and `scenarios.md` §13 both have open items that close on this ADR; they block Task 8 (checkout UI) and Task 10's tests.
- **Prisma 6 (ADR 0003).** Transactions are `prisma.$transaction`; optimistic locking uses a `version` field.
- **No real gateway.** The mock runs in-process (config.md §1.1); there is no external callback, no webhook, no polling.
- **The demo must be honest.** A double-click that creates two orders is a defect; if it exists pre-Task 10b, it is documented in `scenarios.md` S-PAY-4, not hidden.

## Decision

The following four decisions are made together, as one contract. They are recorded in this ADR because changing any one of them requires re-checking the others.

### D1 — Stock decrements at payment success, not at order creation

An order is created with `status = PENDING` and **does not** decrement stock. Stock is decremented inside the transaction that transitions the order to `PAID`, using optimistic locking on the stock row's `version` field.

Rationale:

- An abandoned `PENDING` order (`scenarios.md` S-CANCEL-1) must not hold stock. Decrementing at creation would require a TTL cleanup or a compensating release, both of which are extra machinery the assignment does not require.
- The concurrency requirement (`scenarios.md` S-ORD-6) is specifically about "orders do not oversell." Decrementing at `PAID` is where the race is, and it's where the lock belongs.
- `PAYMENT_FAILED` orders leave stock untouched, which matches the PDF's US-05 ("if payment fails, cart is preserved") — the user can retry without a stock-restore step.

Consequence: a `PENDING` order with a stock-available product can be paid later even if another customer buys the last unit in between. The payment transaction re-checks stock under the lock; if stock is gone, the payment fails with a specific `OUT_OF_STOCK` error, and the order goes to `PAYMENT_FAILED`. This is the correct behavior — "you can start an order, but you can only pay for what's still available."

### D2 — `POST /payments` returns `200` with a status field, not `402`

A failed payment returns HTTP `200` with body `{ "orderId": ..., "status": "PAYMENT_FAILED", "reason": ... }`. It does not return `402 Payment Required`.

Rationale:

- The order transition succeeded (the order *is* `PAYMENT_FAILED`, which is a valid state); the payment attempt is not an HTTP error in the sense of "the request was malformed." NestJS's exception filters would turn a `402` into a generic error envelope and lose the order context.
- The frontend (`scenarios.md` S-PAY-2) needs the order id and a reason to show a retry affordance. A `200` with a status field carries that cleanly; a `402` would require a custom exception filter and a separate error shape.
- It matches the PDF's US-05 ("nếu thanh toán lỗi, đơn ở trạng thái PAYMENT_FAILED") — the state is the signal, not the HTTP code.

Input validation failures (missing order id, unknown method, malformed body) still return `400`. Auth failures return `401`. The `200 + status` convention is only for "the request was valid and the gateway said no."

### D3 — Confirmation route is keyed by the order code, not the DB id

The confirmation route is `/orders/[code]/confirmation`, where `code` is a human-readable order code (format decided in `api-contract.md`, e.g. `BL-2026-0001`). `GET /orders/:code` is owner-scoped; the DB `id` is not exposed in URLs.

Rationale:

- The wireframe (`wireframes.md` §8) shows the code as the primary identifier; users will share/screenshot the code, not a UUID.
- Owner-scoping makes the `id`-vs-`code` choice a security-irrelevant one; using the code as the URL key is no worse than the id and is more user-facing.
- It closes `scenarios.md` D3 and updates `ui-decisions.md` §2 and `wireframes.md` §8 in the same PR.

Consequence: `POST /orders` must return the code in its response (`201 { id, code, status: "PENDING" }`). The code is generated server-side, unique per order, and immutable. Format is recorded in `api-contract.md`.

### D4 — Idempotency is enforced at the payment boundary, keyed on `Idempotency-Key`

`POST /payments` requires an `Idempotency-Key` header. The key is stored with the payment attempt. A replay with the same key:

- **Same body** → returns the original response (`200`, same payment id, same order status) without side effects.
- **Different body** → returns `409 Conflict`; no second payment is created.

The key is **not** required for `POST /orders`. Order creation is not idempotent at the HTTP layer; the client is expected to create one order per cart. If a client double-submits `POST /orders`, it creates two orders — this is a known limitation and is not in the graded scope (the grader tests idempotency on `POST /payments`, per PDF §9).

Rationale:

- The grader's test (PDF §9.2) targets "gửi 2 lần cùng Idempotency-Key chỉ tạo 1 đơn" — the payment endpoint. Scoping idempotency there matches the test.
- Extending it to `POST /orders` would require a client-generated order key, which is a larger API change and not what the assignment asks for.
- The `409` on conflicting body prevents a class of bugs where a client reuses a key for a different order.

Implementation: a `Payment` row stores `idempotencyKey` (unique). Inside `prisma.$transaction`, the service first tries to insert the payment; a unique-constraint violation means "replay" — it then reads the existing row and compares the body hash. If the hash matches, return the stored response; if not, `409`.

Consequence: `Payment` needs a `requestHash` column (or stores the canonical body) to distinguish "same request" from "different request." Recorded in the ERD (Task 1.0) and in `api-contract.md`.

### D5 — A `PAYMENT_FAILED` order can be retried; the retry creates a new payment attempt against the same order

When a payment fails, the order transitions to `PAYMENT_FAILED`. A retry is a **new** `POST /payments` with a **new** `Idempotency-Key` against the **same** order. On success, the order transitions `PAYMENT_FAILED → PAID`.

Rationale:

- The PDF's US-05 says "the cart is preserved" on failure; it implies the user can try again. Creating a new order per retry would litter the user's history with failed attempts.
- The state machine (PDF §9.1) allows `PAYMENT_FAILED → PAID` (it must — otherwise a failed payment is terminal, which contradicts US-05).
- A new payment attempt per retry keeps the idempotency boundary clean: each attempt is independent, each has its own key, and the `Payment` table records the full attempt history for a given order.

Consequence: an order can have multiple `Payment` rows (one per attempt); at most one is successful. `GET /orders/me` shows one order, not one per attempt. The state machine's `PAYMENT_FAILED → PAID` edge is legal; `PAYMENT_FAILED → COMPLETED` is not.

### D6 — Stale `PENDING` orders are not auto-cancelled in Phase 1

A `PENDING` order that is never paid remains `PENDING` indefinitely in Phase 1. No TTL, no background job, no cron. It is visible in the user's history with status `PENDING`.

Rationale:

- Stock is not held (D1), so a stale `PENDING` order has no correctness cost.
- The assignment does not require cleanup, and a background job adds deployment surface (a worker process) that Phase 1 does not have.
- The demo script does not create stale orders, so the behavior is invisible in the demo.

Consequence: `CANCELLED` is only reachable via an explicit user action (not implemented in Phase 1) or a future admin action. The state exists in the state machine (`scenarios.md` S-CANCEL-1 references it) but has no Phase 1 trigger. Recorded as a Phase 2 backlog item: "auto-cancel PENDING orders after N hours."

### D7 — Loyalty accrues at `PAID`, one point per 1,000 VND, floor-rounded

When an order transitions to `PAID`, the user's `loyaltyPoints` increase by `floor(order.total / 1000)`. Points are not earned on `PENDING`, `PAYMENT_FAILED`, or `CANCELLED` orders. There is no redemption in Phase 1 (only accrual, per `product-backlog.md` Task 10d).

Rationale:

- "1 point per 1,000 VND, floor" is simple enough to test exhaustively and matches the "tích lũy" wording in the assignment.
- Accruing at `PAID` (not at order creation) means a failed or abandoned order earns nothing, which matches the business intent.
- Redemption is out of scope per `product-backlog.md` §16; only accrual is graded.

Implementation: the accrual happens inside the same `prisma.$transaction` that transitions the order to `PAID` (D1), so a successful payment and its points are atomic. The `User.loyaltyPoints` update is part of the transaction; if the points update fails, the payment fails.

Consequence: `User` has a `loyaltyPoints` column (integer, default 0). The ERD (Task 1.0) records it. A future `LoyaltyLedger` table (for auditability and refunds) is a Phase 2+ item; Phase 1 uses a column.

## Consequences

### Positive

- **The three graded tests have a single reference.** `scenarios.md` S-ORD-5 (state machine), S-PAY-5 (idempotency), and S-ORD-6 (concurrent stock) each name a specific decision in this ADR. A reviewer reading the ADR can trace every graded behavior to a rule.
- **Stock timing and idempotency are consistent.** Because stock decrements at `PAID` (D1) and idempotency is enforced at `POST /payments` (D4), a replayed payment cannot double-decrement stock — the replay is caught before the transaction runs. If stock had decremented at order creation, idempotency would need to cover `POST /orders` too, which the assignment does not ask for.
- **Retry is honest.** D5 means the demo can show "payment fails → retry → succeeds" without creating a second order, and the history shows one order with two payment attempts. This is exactly what a real gateway does.
- **The ADR closes six open items at once.** `scenarios.md` §13's D1, D2, D3, D4, D5, D6 and `config.md` §7's `PAYMENT_MOCK_MODE` and `Idempotency-Key` rows all point here. That's the value of keeping them in one ADR.
- **The Phase 1 scope is explicit.** D6 says "no TTL" so nobody spends Sprint 3 building a cron; D7 says "no redemption" so nobody builds a points-spending UI.

### Negative / costs

- **One ADR, four decisions.** This is longer than most ADRs and harder to supersede in part. If only the loyalty rule changes (D7), the ADR is superseded as a whole, and the new ADR must restate D1–D6 to preserve them. Mitigation: the superseding ADR can say "D1–D6 unchanged; D7 becomes X." The alternative (four ADRs) was rejected because the decisions are coupled and would drift.
- **`PAYMENT_FAILED → PAID` is a legal edge that some readers find surprising.** The state machine diagram in the PDF (§9.1) shows it; the ADR makes it explicit. A reviewer who thinks "failed is terminal" will object; the answer is US-05 (retry preserves cart) and D5.
- **Idempotency requires a `requestHash` column.** That's schema surface (Task 1.0 ERD) and a canonicalization function (the body must hash deterministically). The canonicalization is one function; not a large cost, but it must be tested.
- **D3 (route keyed by code) changes three docs.** `ui-decisions.md` §2, `wireframes.md` §8, and `product-backlog.md` §12 all reference `[id]`; they must be updated in the same PR that accepts this ADR. This is a coordination cost, not a technical one.
- **No auto-cancel (D6) means the DB accumulates `PENDING` rows in dev.** `prisma migrate reset` clears them; in a long-running demo, the history page shows abandoned orders. Acceptable for MVP; a Phase 2 fix.

### Neutral

- The mock's behavior (`success` / `failure` / `random`, per `config.md` §2.1) is an implementation detail of D2/D5; the ADR does not prescribe the mock's randomness, only its boundary behavior. If the team wants deterministic demos, `PAYMENT_MOCK_MODE=success` for the happy path and `failure` for the failure path; `random` is for testing, not demoing.
- The `Idempotency-Key` header spelling is recorded here (D4) and in `config.md` §3; `api-contract.md` must use the same casing.
- The order code format is D3's consequence but is specified in `api-contract.md`, not here.

## Alternatives considered

| Alternative                                                                       | Why rejected                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stock decrements at order creation**                                            | Requires release-on-abandon (TTL or compensating transaction) and makes the concurrency test harder to reason about. It also conflicts with US-05's "cart preserved on failure" — a failed payment would need to restore stock. |
| **`402 Payment Required` for failed payment**                                     | Breaks the Nest error envelope, loses order context, and requires a custom filter. The order *is* in a valid state (`PAYMENT_FAILED`); `200` with a status field says so honestly.                                              |
| **Route keyed by DB `id`**                                                        | Users share the code, not the UUID. Using the code as the key is no less secure (owner-scoping handles authz) and matches the wireframe.                                                                                        |
| **Idempotency on `POST /orders` instead of (or in addition to) `POST /payments`** | Not what the grader tests (PDF §9.2 targets the payment endpoint). Adding it doubles the API surface for a case the assignment does not exercise. Revisit if a real client double-submit becomes a problem.                     |
| **Idempotency key optional**                                                      | Optional means the grader's test (which sends the key) passes but a client that forgets it double-charges. Required is safer and matches "thanh toán idempotent" in PDF §9.2.                                                   |
| **A new order per payment retry**                                                 | Litters history with failed attempts and contradicts "one order, retry the payment" in US-05.                                                                                                                                   |
| **`PAYMENT_FAILED` is terminal; user starts a new order to retry**                | Contradicts US-05 and the state machine's legal edges. The cart is preserved, so the user expects to retry the same order.                                                                                                      |
| **Auto-cancel `PENDING` orders after a TTL**                                      | Adds a worker process or cron, which Phase 1 does not deploy. No stock is held (D1), so there is no correctness cost to leaving them. Phase 2+ item.                                                                            |
| **Loyalty as a separate `LoyaltyLedger` table**                                   | More auditable and handles refunds, but adds a table and a join for a column that only ever increments in Phase 1. Column now, ledger in Phase 2 if refunds are added.                                                          |
| **Loyalty accrues at order creation**                                             | A `PAYMENT_FAILED` or abandoned order would earn points, which is wrong. Accrual must be tied to `PAID`.                                                                                                                        |
| **Points rule: 1 per 1,000 VND, round up**                                        | Round-up gives points for tiny orders and is harder to reconcile. Floor is the standard and is easy to test.                                                                                                                    |

## When to revisit

Reopen this ADR (new ADR superseding 0004) if any of the following becomes true:

- The grader or a reviewer interprets the state machine diagram differently and `PAYMENT_FAILED → PAID` is disputed. (Unlikely; the PDF shows the edge.)
- A real gateway replaces the mock and its callback semantics differ from the in-process mock (e.g. async webhook vs. synchronous response). This changes D2 and D5.
- Refunds are added, which requires a `LoyaltyLedger` and a `REFUNDED` state (D7 and the state machine).
- Auto-cancel of `PENDING` orders is added (D6), which is a Phase 2 change.
- Idempotency is extended to `POST /orders`, which changes D4's scope.
- The route key changes (D3) for a reason other than the code-vs-id trade-off (e.g. multi-tenant URLs).

D1 (stock timing) is the load-bearing decision. If it changes, D4 and D5 must be re-checked: idempotency must then cover `POST /orders` (to prevent double-decrement) and retry semantics change.

## Open questions

| Question                                                                                               | Owner | Closes when                                |
| ------------------------------------------------------------------------------------------------------ | ----- | ------------------------------------------ |
| Confirm `PAYMENT_FAILED → PAID` is legal per the team's reading of PDF §9.1                            | H.Tài | This ADR `Accepted`                        |
| Decide the order code format (e.g. `BL-YYYY-NNNN`)                                                     | Nghĩa | `api-contract.md` final; D3 implementation |
| Decide the canonical body hash for idempotency (which fields, sorted)                                  | H.Tài | Task 25.0/46.0 PR                          |
| Confirm `requestHash` column is in the Task 1.0 ERD                                                    | H.Tài | Task 1.0 `● Xong`                          |
| Confirm `User.loyaltyPoints` is a column, not a table, in the Task 1.0 ERD                             | H.Tài | Task 1.0 `● Xong`                          |
| Confirm no TTL job in Phase 1 (D6) is acceptable to the PO                                             | H.Tài | Sprint 3 Planning                          |
| Update `ui-decisions.md` §2, `wireframes.md` §8, `product-backlog.md` §12 for D3 (`[code]` not `[id]`) | Nghĩa | Same PR that accepts this ADR              |
| Record `PAYMENT_MOCK_MODE` values (`success`/`failure`/`random`) in `api-contract.md`                  | H.Tài | Task 7.0 `● Xong`                          |

## References

- Assignment PDF §9 (Task 10: state machine, idempotency, concurrency, loyalty), §9.1 (state diagram), §4.3 (US-05), §6 (mock payment).
- [ADR 0001](0001-record-architecture-decisions.md) — the ADR process this follows.
- [ADR 0003](0003-database-postgres-prisma.md) — the Prisma transaction and `version` field this ADR uses.
- [Configuration](../../config.md) §2.1 (`PAYMENT_MOCK_MODE`), §3 (`Idempotency-Key`, order states).
- [Scenarios](../../requirements/scenarios.md) §7 (payment flows), §9 (state machine), §10 (concurrent stock), §13 (D1–D6 closed here).
- [Product Backlog](../../requirements/product-backlog.md) Task 8 (mock payment), Task 10 (business rules, graded tests).
- [API Contract](../api-contract.md) — the endpoint shapes for `POST /payments` and `GET /orders/:code`.

---

## Notes on choices I made (so you can accept or override)

1. **I kept it as one ADR with seven lettered decisions (D1–D7), not four separate ADRs.** You asked me to propose a split if it grew too big — my judgment is that a split is worse here. The decisions are genuinely coupled: D1 (stock at `PAID`) is the reason D4 (idempotency at `POST /payments`) is sufficient; D5 (retry) depends on D1 (no stock to restore) and D2 (200 + status); D7 (loyalty at `PAID`) sits inside D1's transaction. Four ADRs would be four documents that must be read together and updated together, and a change to D1 would require a "supersede" cascade across four files. One ADR with a "superseding ADR can say D1–D6 unchanged" escape hatch is the smaller long-term cost. If you still want the split, the cleanest cut is **0004 = D1, D2, D3, D5, D6** (lifecycle + HTTP semantics) and **0007 = D4, D7** (idempotency + loyalty) — but I'd only do that if D4/D7 grow significantly in implementation.

2. **D1 (stock at payment, not creation) is the decision that makes the other six cohere, and the ADR says so explicitly** (in "When to revisit": "D1 is the load-bearing decision"). If a reviewer disagrees with D1, D4 and D5's justifications collapse. Putting that dependency in writing means the team debates D1 once, not re-debates it every time D4 or D5 is questioned.

3. **D2 (200 + status, not 402) is a real NestJS-specific call.** The "obvious" REST answer is `402 Payment Required`, and a reviewer may ask why not. The answer — Nest's exception filter flattens `402` into a generic envelope, and the order *is* in a valid state — is specific to this stack and this UI's need for the order context. Recording it as a decision with that rationale saves a review round-trip.

4. **D3 (route keyed by code) closes `scenarios.md` D3, and I flagged the three-doc update.** This is the one decision in the ADR that changes existing docs (`ui-decisions.md` §2, `wireframes.md` §8, `product-backlog.md` §12). The open-questions table has the row. If you'd rather keep `[id]`, flip D3 and delete the row — but then `wireframes.md` §8's "order code is the primary identifier" note is inconsistent, so pick one and update all three.

5. **D4 (idempotency at payments, not orders) is scoped exactly to the grader's test.** PDF §9.2 says "gửi 2 lần cùng Idempotency-Key chỉ tạo 1 đơn" — the *payment* endpoint. Extending to `POST /orders` would be more robust and is not what's graded; the ADR says so and names it as a "revisit if" condition. This is the right scope for a student MVP, but it's a deliberate limitation, not an oversight.

6. **D6 (no auto-cancel) is the decision most likely to be challenged in review**, because "stale PENDING orders pile up" is an obvious smell. The ADR's answer — no stock held (D1), no worker process in Phase 1, Phase 2 backlog item — is honest. If the PO wants a TTL in Phase 1, that's a scope change that should be argued at Sprint 3 Planning, not silently added.

7. **D7 (loyalty column, not ledger) is a deliberate MVP simplification**, and the open-questions table flags it for the Task 1.0 ERD. If you later add refunds, the ledger becomes necessary; the ADR's "When to revisit" says so. The rule itself (1 point per 1,000 VND, floor) is simple enough that the unit tests in Task 10d can be exhaustive (0, 999, 1000, 1999, 2000 VND → 0, 0, 1, 1, 2 points).

8. **The "same PR" open item for D3 is the one coordination risk.** When this ADR is accepted, the PR that flips it to `Accepted` must also update the three docs. If it doesn't, `wireframes.md` will say `[id]` while the API returns `code`, and the e2e test will target the wrong route. That's why it's an explicit open question with an owner, not an implicit expectation.

Next: **ADR 0005 (API contract conventions)** — it closes `config.md` §7's error envelope and `Idempotency-Key` spelling items, and it's the doc that `api-contract.md` (Task 7.0) depends on. Want 0005 next, or `api-contract.md` directly (with 0005 folded in as its "decisions" section)?