# BrewLite - Business Scenarios

**Status:** Phase 1 deliverable  
**Owner:** H.Tài (Task 4.0)  
**Related:** [Product Backlog](product-backlog.md), [Wireframes](../design/wireframes.md), [API Contract](../architecture/api-contract.md), [Configuration](../config.md), assignment PDF §5

This document specifies the business flows BrewLite must support. It is the bridge between the Product Backlog (what to build) and the API Contract (how it is called): each scenario names the actors, the trigger, the step sequence, and the observable outcome. Scenarios are the source for manual test scripts (Sprint reviews) and for the Playwright journeys in `tests/e2e/` (Phase 2+).

> **Scope:** flows from app open to order confirmation and history, plus the error and cancel branches. Out of scope: barista-side flows, refunds, and anything listed in `product-backlog.md` §16.

## 1. How to read this document

- **Scenario ID:** `S-<area><n>` — `S-MAIN`, `S-PAY`, `S-AUTH`, `S-CART`, `S-ORD`, `S-EDGE`. Stable; never reused.
- **Type:** `Main` (happy path), `Alternative` (valid but non-default path), `Error` (expected failure with a specific outcome), `Cancel` (user aborts).
- **Precondition:** system state required before step 1.
- **Steps:** what the actor does and what the system does, in order.
- **Outcome:** the observable end state — HTTP status, order status, cart state, UI route. This is what the test asserts on.
- **Traces to:** the acceptance criterion in `product-backlog.md` that this scenario proves.

A scenario without a testable outcome is not a scenario; it is a wish. If a flow is specified in prose but has no assertion, it is flagged in §9.

## 2. Actors and preconditions glossary

| Actor         | Description                                 |
| ------------- | ------------------------------------------- |
| Customer      | Anonymous or logged-in user of the web app. |
| Anonymous     | Not logged in; has no JWT.                  |
| Authenticated | Has a valid JWT from `POST /auth/login`.    |
| System        | The API + DB + mock payment service.        |

| State           | Meaning                             |
| --------------- | ----------------------------------- |
| Empty cart      | Zustand cart has zero items.        |
| Stock available | Product's stock row `quantity > 0`. |
| Stock exhausted | Product's stock row `quantity = 0`. |

## 3. Main flow — S-MAIN-1: Select, cart, pay, confirm

**Type:** Main  
**Traces to:** PDF §5 happy path; product-backlog Tasks 3, 4, 5, 6, 7, 8, 9.

**Precondition:** Authenticated customer. Menu loaded. Stock available for all chosen products.

| #   | Actor    | Action / System response                                                                                                     |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | Customer | Opens `/`. System renders the menu grid from `GET /products`.                                                                |
| 2   | Customer | Clicks a product. System navigates to `/products/[id]` and shows name, image, base price.                                    |
| 3   | Customer | Selects size M and two toppings. System updates the displayed price deterministically (Task 4 rule).                         |
| 4   | Customer | Clicks "Add to cart". System adds the line to the Zustand cart and increments the header badge.                              |
| 5   | Customer | Repeats steps 2–4 for a second product. System shows two lines in the cart.                                                  |
| 6   | Customer | Opens `/cart`. System lists both lines with quantities and the total; the total matches the sum of `lineTotal`.              |
| 7   | Customer | Clicks "Thanh toán". System routes to `/checkout`, showing the same total and the Wallet/Card selector.                      |
| 8   | Customer | Selects Wallet, confirms. Frontend calls `POST /orders` with the cart, then `POST /payments` with the order id and method.   |
| 9   | System   | Order created `PENDING`; payment mock returns success; order transitions `PENDING → PAID`; `loyaltyPoints` accrue (Task 10). |
| 10  | Customer | System navigates to `/orders/[id]/confirmation`, showing order code and status `PAID`.                                       |
| 11  | Customer | Opens `/orders`. System lists the order with code, date, total, status.                                                      |

**Outcome:** Order persisted with status `PAID`; confirmation page shows the code; history lists it; cart is empty.

**Assertions for the e2e test:**
- `POST /orders` returns `201` with an order id and `status: "PENDING"`.
- `POST /payments` returns `200` with `status: "PAID"`.
- Confirmation route contains the order code string.
- `GET /orders/me` includes the new order.
- Cart store is empty after success.

## 4. Authentication flows — S-AUTH-*

### S-AUTH-1: Register then log in

**Type:** Alternative  
**Traces to:** Task 7 AC; API contract `POST /auth/*`.

**Precondition:** Anonymous. Email not yet registered.

| #   | Actor    | Action / System response                                                          |
| --- | -------- | --------------------------------------------------------------------------------- |
| 1   | Customer | Opens `/auth/register`, submits email + password meeting the policy.              |
| 2   | System   | Hashes password with bcrypt, creates user, returns `201`.                         |
| 3   | Customer | Submits the same email on `/auth/login` with the correct password.                |
| 4   | System   | Verifies hash, returns JWT. Frontend stores token, attaches it to `POST /orders`. |

**Outcome:** Authenticated session; subsequent `POST /orders` succeeds.

**Assertions:** `201` on register; `200` + token on login; `POST /orders` without token returns `401`, with token returns `201`.

### S-AUTH-2: Duplicate email

**Type:** Error  
**Traces to:** Task 7 AC ("duplicate email returns 409").

| #   | Actor    | Action / System response                                                                                                              |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Customer | Registers with an email that already exists.                                                                                          |
| 2   | System   | Returns `409` with a message that does not leak whether the account exists in a way that enables enumeration beyond the email itself. |

**Outcome:** No new user; the existing user is untouched.

**Assertion:** `409`; user count unchanged.

### S-AUTH-3: Wrong password

**Type:** Error  
**Traces to:** Task 7 AC ("wrong password returns 401 with a generic message").

| #   | Actor    | Action / System response                                    |
| --- | -------- | ----------------------------------------------------------- |
| 1   | Customer | Submits a valid email with a wrong password.                |
| 2   | System   | Returns `401` with a generic "invalid credentials" message. |

**Outcome:** No token issued. The error does not distinguish "email not found" from "wrong password."

**Assertion:** `401`; response body identical for "wrong password" and "unknown email."

## 5. Cart flows — S-CART-*

### S-CART-1: Add, change quantity, remove

**Type:** Alternative  
**Traces to:** Task 5 AC.

**Precondition:** Cart has one line, qty 1.

| #   | Actor    | Action / System response                                                                                     |
| --- | -------- | ------------------------------------------------------------------------------------------------------------ |
| 1   | Customer | Adds the same product with the same size and toppings again. System increments qty to 2 (no duplicate line). |
| 2   | Customer | Increases qty to 3 via the cart control. System updates `lineTotal` and total.                               |
| 3   | Customer | Removes the line. System removes it, badge drops to 0, total is 0.                                           |

**Outcome:** Cart reflects each change immediately; totals recompute on every mutation.

**Assertions:** line count after step 1 is 1; `lineTotal = unitPrice × 3` after step 2; cart empty after step 3.

### S-CART-2: Cart survives navigation

**Type:** Alternative  
**Traces to:** Task 5 AC ("survives client-side navigation").

**Precondition:** Cart has items.

| #   | Actor    | Action / System response                           |
| --- | -------- | -------------------------------------------------- |
| 1   | Customer | Navigates from `/cart` to `/` to `/products/[id]`. |
| 2   | System   | Cart badge and `/cart` contents are unchanged.     |

**Outcome:** State persists across client-side navigation. **Not** across full reload — a reload with a non-empty cart is a known limitation; document it in the UI as a Phase 2 fix.

**Assertion:** after navigation, cart store `items.length` unchanged.

## 6. Order creation flows — S-ORD-*

### S-ORD-1: Server recomputes price (tamper protection)

**Type:** Error (security)  
**Traces to:** Task 6 AC ("server recomputes total; client prices ignored").

**Precondition:** Authenticated. Valid cart.

| #   | Actor    | Action / System response                                                                                        |
| --- | -------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | Attacker | Sends `POST /orders` with `lineTotal` and `total` lower than the real prices.                                   |
| 2   | System   | Recomputes from product prices; persists the server total; response reflects the server total, not the payload. |

**Outcome:** Order total equals the server-computed price. The tampered payload has no effect.

**Assertion:** persisted `order.total` equals the fixture-computed value; not the attacker's value.

### S-ORD-2: Empty cart

**Type:** Error  
**Traces to:** Task 6 AC ("empty cart → 400").

| #   | Actor    | Action / System response                  |
| --- | -------- | ----------------------------------------- |
| 1   | Customer | `POST /orders` with `items: []`.          |
| 2   | System   | Returns `400` with a field-level message. |

**Outcome:** No order created.

**Assertion:** `400`; order count unchanged.

### S-ORD-3: Invalid size or unknown product

**Type:** Error  
**Traces to:** Task 6 AC.

| #   | Actor    | Action / System response                                            |
| --- | -------- | ------------------------------------------------------------------- |
| 1   | Customer | `POST /orders` with `size: "XL"` or a `productId` not in the DB.    |
| 2   | System   | Returns `400` (validation) or `404` (unknown product), never `500`. |

**Outcome:** No order created; error envelope matches `api-contract.md`.

**Assertion:** status code matches the contract; no `500`.

## 7. Payment flows — S-PAY-*

### S-PAY-1: Payment succeeds

**Type:** Main (covered inside S-MAIN-1 steps 8–9; listed separately for test targeting)  
**Traces to:** Task 8 AC; ADR 0004.

**Precondition:** Order in `PENDING`. `PAYMENT_MOCK_MODE=success`.

**Outcome:** `POST /payments` → `200`, order `PAID`, confirmation shown.

**Assertion:** order status `PAID`; `loyaltyPoints` increased by the configured rule (Task 10d).

### S-PAY-2: Payment fails — cart preserved

**Type:** Error  
**Traces to:** Task 8 AC; PDF US-05 acceptance criteria.

**Precondition:** Order in `PENDING`. `PAYMENT_MOCK_MODE=failure`.

| #   | Actor    | Action / System response                                                                                                               |
| --- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Customer | Confirms payment. System calls `POST /payments`; mock returns failure.                                                                 |
| 2   | System   | Order → `PAYMENT_FAILED`; returns `402` (or `200` with `status: "PAYMENT_FAILED"` per API contract; decide once in `api-contract.md`). |
| 3   | Customer | System keeps the cart intact and shows a retry affordance.                                                                             |

**Outcome:** Order `PAYMENT_FAILED`; cart unchanged; user can retry.

**Assertion:** cart `items.length` unchanged; order status `PAYMENT_FAILED`; a subsequent retry with `PAYMENT_MOCK_MODE=success` transitions to `PAID` (this is the "retry succeeds" criterion from Task 8).

### S-PAY-3: Retry after failure succeeds

**Type:** Alternative  
**Traces to:** Task 8 AC ("retry after failure succeeds").

**Precondition:** Prior order in `PAYMENT_FAILED`. `PAYMENT_MOCK_MODE` switched to `success` (or the mock's failure rule is exhausted, per ADR 0004).

| #   | Actor    | Action / System response                                                            |
| --- | -------- | ----------------------------------------------------------------------------------- |
| 1   | Customer | Clicks "retry" on the failed order.                                                 |
| 2   | System   | Creates a **new** payment attempt against the same order; on success, order `PAID`. |

**Outcome:** Order `PAID`. The history shows one order, not two.

**Assertion:** one order row; status `PAID`; only one successful payment row (failed attempt recorded separately).

### S-PAY-4: Double-submit before Task 10

**Type:** Error (known gap)  
**Traces to:** Task 8 out-of-scope note; Task 10b fixes it.

**Precondition:** No idempotency key (Task 10 not yet merged).

| #   | Actor    | Action / System response                       |
| --- | -------- | ---------------------------------------------- |
| 1   | Customer | Double-clicks "confirm payment."               |
| 2   | System   | May create two payment attempts / two charges. |

**Outcome:** This is a **known defect** until Task 10b lands. The demo script must not double-click. Recorded here so the demo is honest and so Task 10b's test has a "before" state.

**Assertion (pre-fix):** documented, not asserted. **Post-fix (Task 10b):** S-PAY-5.

### S-PAY-5: Idempotent payment (post-Task 10b)

**Type:** Error (concurrency)  
**Traces to:** Task 10b AC; PDF §9 test (b).

**Precondition:** Order `PENDING`. Task 10b merged.

| #   | Actor  | Action / System response                                                                                      |
| --- | ------ | ------------------------------------------------------------------------------------------------------------- |
| 1   | Client | Sends `POST /payments` twice with the **same** `Idempotency-Key`.                                             |
| 2   | System | First request creates a payment; second returns the **same** result (same payment id), does not charge twice. |

**Outcome:** One payment, one charge, one order state transition.

**Assertion:** payment count for the order is 1; both responses carry the same payment id; order status `PAID` exactly once.

### S-PAY-6: Idempotency key reused with different body

**Type:** Error  
**Traces to:** Task 10b AC ("replay with different body but same key is rejected").

| #   | Actor  | Action / System response                                         |
| --- | ------ | ---------------------------------------------------------------- |
| 1   | Client | Reuses an `Idempotency-Key` with a different order id or amount. |
| 2   | System | Returns `409` (conflict); does not create a second payment.      |

**Outcome:** No side effects.

**Assertion:** `409`; payment count unchanged.

## 8. Order history flows — S-ORD-4

### S-ORD-4: History and access control

**Type:** Main + Error  
**Traces to:** Task 9 AC; Task 7 guard AC.

**Precondition:** Two users A and B, each with at least one order.

| #   | Actor             | Action / System response                                                                                                   |
| --- | ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1   | A (authenticated) | `GET /orders/me` returns A's orders, newest first.                                                                         |
| 2   | A                 | Tries to open B's confirmation route directly. System returns "not found / not yours" without leaking B's order existence. |
| 3   | Anonymous         | `GET /orders/me` → `401`.                                                                                                  |

**Outcome:** A sees only A's orders; cross-user access is denied without information leakage.

**Assertion:** A's response set excludes B's order ids; anonymous request `401`; cross-user route renders a safe message.

## 9. State machine flows — S-ORD-5 (post-Task 10a)

### S-ORD-5: Invalid transition rejected

**Type:** Error  
**Traces to:** Task 10a AC; PDF §9 test (a).

**Precondition:** Order `COMPLETED` (terminal).

| #   | Actor  | Action / System response                                                                                       |
| --- | ------ | -------------------------------------------------------------------------------------------------------------- |
| 1   | Client | Requests a transition `COMPLETED → PAID` (or any non-diagram edge).                                            |
| 2   | System | `assertTransition` throws; API returns `409` (conflict) with the offending `from`/`to`. Order state unchanged. |

**Outcome:** Order remains `COMPLETED`; error is specific, not a generic `500`.

**Assertion:** order status unchanged; response body names the transition.

## 10. Concurrent stock — S-ORD-6 (post-Task 10c)

### S-ORD-6: Concurrent orders do not oversell

**Type:** Error (concurrency)  
**Traces to:** Task 10c AC; PDF §9 test (c).

**Precondition:** Product stock = 1.

| #   | Actor                 | Action / System response                                                                                                        |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Client A and Client B | Both submit orders for the same product, near-simultaneously.                                                                   |
| 2   | System                | Transaction + optimistic locking: exactly one succeeds; the other fails with a specific "insufficient stock" error (not `500`). |
| 3   | System                | Final stock = 0.                                                                                                                |

**Outcome:** One order created; one rejected; stock never negative.

**Assertion:** successful orders for that product = 1; final stock = 0; rejected request status is the documented one.

## 11. Cancel flow — S-CANCEL-1

**Type:** Cancel  
**Traces to:** PDF §5 flowchart ("Hủy / thanh toán lỗi"); Task 10a state machine.

**Precondition:** Order `PENDING`.

| #   | Actor    | Action / System response                                                                                                                                                                |
| --- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Customer | Abandons checkout (navigates away) without paying.                                                                                                                                      |
| 2   | System   | The `PENDING` order remains; no stock is reserved (stock is decremented on `PAID` per ADR 0004, or at order creation per a competing decision — **this is an open decision**, see §13). |
| 3   | System   | A background cleanup may cancel stale `PENDING` orders after a TTL. This cleanup is **not** in MVP scope; the order simply stays `PENDING`.                                             |

**Outcome:** No payment, no stock effect (given the ADR's chosen point of stock decrement). The order is visible in history as `PENDING`.

**Assertion:** order status `PENDING`; no payment row; stock unchanged.

## 12. Traceability matrix (scenario → backlog → test)

| Scenario   | Backlog task  | Graded test? | Playwright spec (Phase 2+)             | Manual (Phase 1 demo) |
| ---------- | ------------- | ------------ | -------------------------------------- | --------------------- |
| S-MAIN-1   | 3,4,5,6,7,8,9 | —            | `checkout-journey.spec.ts`             | ✅                     |
| S-AUTH-1   | 7             | —            | `auth-register-login.spec.ts`          | ✅                     |
| S-AUTH-2   | 7             | —            | `auth-duplicate-email.spec.ts`         | —                     |
| S-AUTH-3   | 7             | —            | `auth-wrong-password.spec.ts`          | —                     |
| S-CART-1   | 5             | —            | `cart-mutations.spec.ts`               | ✅                     |
| S-CART-2   | 5             | —            | `cart-persistence.spec.ts`             | —                     |
| S-ORD-1    | 6             | —            | `orders-price-tamper.spec.ts`          | —                     |
| S-ORD-2    | 6             | —            | `orders-empty-cart.spec.ts`            | —                     |
| S-ORD-3    | 6             | —            | `orders-invalid-input.spec.ts`         | —                     |
| S-PAY-1    | 8             | —            | (inside `checkout-journey`)            | ✅                     |
| S-PAY-2    | 8             | —            | `payment-failure.spec.ts`              | ✅                     |
| S-PAY-3    | 8             | —            | `payment-retry.spec.ts`                | —                     |
| S-PAY-4    | 8             | —            | *documented gap*                       | —                     |
| S-PAY-5    | 10b           | **yes (b)**  | `payment-idempotency.spec.ts`          | ✅                     |
| S-PAY-6    | 10b           | —            | `payment-idempotency-conflict.spec.ts` | —                     |
| S-ORD-4    | 7,9           | —            | `orders-history-acl.spec.ts`           | ✅                     |
| S-ORD-5    | 10a           | **yes (a)**  | `order-state-machine.spec.ts`          | ✅                     |
| S-ORD-6    | 10c           | **yes (c)**  | `orders-concurrent-stock.spec.ts`      | ✅                     |
| S-CANCEL-1 | 10a           | —            | `order-abandon.spec.ts`                | —                     |

The three graded tests (PDF §9) are S-PAY-5, S-ORD-5, S-ORD-6. They must pass in CI and be demonstrated at Sprint Review.

## 13. Open decisions surfaced by these scenarios

Each of these blocks a scenario from being fully testable; resolve before the scenario's owning task closes.

| #   | Decision                                                                           | Blocks              | Proposed owner            |
| --- | ---------------------------------------------------------------------------------- | ------------------- | ------------------------- |
| D1  | Does stock decrement at order creation or at payment success?                      | S-CANCEL-1, S-ORD-6 | H.Tài → ADR 0004          |
| D2  | Does `POST /payments` failure return `402` or `200` with `status: PAYMENT_FAILED`? | S-PAY-2             | H.Tài → `api-contract.md` |
| D3  | Is the confirmation route keyed by order `id` or by human-readable code?           | S-MAIN-1 step 10    | Nghĩa → `api-contract.md` |
| D4  | What is the loyalty accrual rule (points per VND, rounding)?                       | S-MAIN-1, S-PAY-1   | H.Tài → ADR 0004          |
| D5  | Does a `PAYMENT_FAILED` order retry create a new payment or reuse the failed one?  | S-PAY-3, S-PAY-5    | H.Tài → ADR 0004          |
| D6  | Are stale `PENDING` orders auto-cancelled? If yes, TTL?                            | S-CANCEL-1          | H.Tài → Phase 2 backlog   |

## 14. What this document does not cover

- **UI visual behavior** (animations, exact copy) — that is `docs/design/ui-decisions.md`.
- **API request/response shapes** — that is `docs/architecture/api-contract.md`; scenarios reference it, not duplicate it.
- **Non-functional scenarios** (load, latency) — Phase 2 `docs/testing/`.
- **Barista/back-office flows** — out of MVP, `product-backlog.md` §16.

---

## Notes on choices I made (so you can accept or override)

1. **Every scenario has an ID and an outcome assertion, and the traceability table in §12 maps them to the three graded tests.** The PDF says the grader checks (a) invalid transition, (b) duplicate idempotency key, (c) concurrent stock. Those are S-ORD-5, S-PAY-5, S-ORD-6, and the table marks them in bold. This is the single most important property of the doc: a reader can find the graded tests in under 10 seconds.

2. **S-PAY-4 is deliberately a documented gap, not a scenario with a passing assertion.** Task 8 (mock payment) explicitly does not have idempotency; Task 10b adds it. Writing "double-submit creates two charges" as a *known defect* does two things: the demo script knows not to double-click, and Task 10b's test has a documented "before" state to prove the fix against. Hiding it would make the demo dishonest.

3. **§13 (open decisions) is the section that makes this doc live rather than aspirational.** Six scenarios depend on decisions that aren't made yet (D1–D6) — stock decrement point, error status code, route keying, loyalty rule, retry semantics, stale-order TTL. Each has a proposed owner and a closing doc (mostly ADR 0004 or `api-contract.md`). This mirrors `config.md`'s "open items" pattern: "blocked" has a name and a deadline, so it can't become permanent by neglect.

4. **The main flow (S-MAIN-1) is written as an 11-step table, not prose, because step 8 is where the interesting coupling is.** The frontend calls `POST /orders` then `POST /payments` as two requests; the order is `PENDING` between them. That two-call sequence is the thing most likely to break during integration, and it's only visible when the steps are enumerated. The Playwright journey in Phase 2+ should follow those 11 steps verbatim.

5. **I added S-ORD-1 (price tampering) as a security scenario, even though no acceptance criterion names it explicitly.** Task 6's AC says "server recomputes total; client prices ignored" — that's a security property, and a scenario is how you test it. It's the kind of thing that only gets tested if someone writes it down as a scenario with an attacker actor.

6. **S-CANCEL-1 is honest about its dependency on D1.** Whether abandoning a `PENDING` order affects stock depends on whether stock decrements at creation or at payment. I did not invent an answer; I wrote the scenario against both branches and put the decision in §13. If you decide D1 at ADR 0004 time, trim S-CANCEL-1 to the chosen branch.

7. **Two forward references to honor:** §12's "Playwright spec" column names files that don't exist yet (they're Phase 2+ `tests/e2e/`); that's intentional, it's the spec's target. And §13's D2/D3 must be resolved before `api-contract.md` (Task 7.0) closes — otherwise the scenarios and the contract will disagree on status codes and route keys.

Next in Phase 1 order: **`docs/design/ui-decisions.md`** and **`docs/design/wireframes.md`** (Task 5.0), which together close the design deliverable and resolve several scenarios' UI-facing details (confirmation route copy, cart-empty state, retry affordance). Want the UI decisions doc next?