# BrewLite - Business Scenarios

**Status:** Phase 1 deliverable, closed 2026-10-22  
**Owner:** H.Tài (Task 4.0)  
**Related:** [Product Backlog](product-backlog.md), [Wireframes](../design/wireframes.md), [API Contract](../architecture/api-contract.md), [ADR 0004](../architecture/adr/0004-payment-mock-and-order-lifecycle.md), [Configuration](../config.md), assignment PDF §5

This document specifies the business flows BrewLite must support. It is the bridge between the Product Backlog (what to build) and the API Contract (how it is called): each scenario names the actors, the trigger, the step sequence, and the observable outcome. Scenarios are the source for manual test scripts (Sprint reviews) and for the Playwright journeys in `tests/e2e/` (Phase 2+).

> **Scope:** flows from app open to order confirmation and history, plus the error and cancel branches. Out of scope: barista-side flows, refunds, and anything listed in `product-backlog.md` §16.

## 1. How to read this document

- **Scenario ID:** `S-<area><n>` — `S-MAIN`, `S-PAY`, `S-AUTH`, `S-CART`, `S-ORD`, `S-EDGE`. Stable; never reused.
- **Type:** `Main` (happy path), `Alternative` (valid but non-default path), `Error` (expected failure with a specific outcome), `Cancel` (user aborts).
- **Precondition:** system state required before step 1.
- **Steps:** what the actor does and what the system does, in order.
- **Outcome:** the observable end state — HTTP status, order status, cart state, UI route. This is what the test asserts on.
- **Traces to:** the acceptance criterion in `product-backlog.md` that this scenario proves.

A scenario without a testable outcome is not a scenario; it is a wish. If a flow is specified in prose but has no assertion, it is flagged in §13.

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
**Diagram:** `docs/diagrams/flows/flow-main-v1.mmd`.

**Precondition:** Authenticated customer. Menu loaded. Stock available for all chosen products.

| #   | Actor    | Action / System response                                                                                                                                                           |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Customer | Opens `/`. System renders the menu grid from `GET /api/v1/products`.                                                                                                               |
| 2   | Customer | Clicks a product. System navigates to `/products/[id]` and shows name, image, base price.                                                                                          |
| 3   | Customer | Selects size M and two toppings. System updates the displayed price deterministically (Task 4 rule, `ui-decisions.md` §4.2).                                                       |
| 4   | Customer | Clicks "Thêm vào giỏ". System adds the line to the Zustand cart and increments the header badge.                                                                                   |
| 5   | Customer | Repeats steps 2–4 for a second product. System shows two lines in the cart.                                                                                                        |
| 6   | Customer | Opens `/cart`. System lists both lines with quantities and the total; the total matches the sum of `lineTotal`.                                                                    |
| 7   | Customer | Clicks "Thanh toán". System routes to `/checkout`, showing the same total and the Wallet/Card selector.                                                                            |
| 8   | Customer | Selects Wallet, confirms. Frontend calls `POST /api/v1/orders` with the cart, then `POST /api/v1/payments` with the order id, method, and an `Idempotency-Key`.                    |
| 9   | System   | Order created `PENDING`; payment mock returns success; order transitions `PENDING → PAID`; stock decremented and `loyaltyPoints` accrue in the same transaction (ADR 0004 D1, D7). |
| 10  | Customer | System navigates to `/orders/[code]/confirmation`, showing order code and status `PAID` (route keyed by `code`, ADR 0004 D3).                                                      |
| 11  | Customer | Opens `/orders`. System lists the order with code, date, total, status.                                                                                                            |

**Outcome:** Order persisted with status `PAID`; confirmation page shows the code; history lists it; cart is empty.

**Assertions for the e2e test:**
- `POST /api/v1/orders` returns `201` with an order `id`, `code`, and `status: "PENDING"`.
- `POST /api/v1/payments` returns `200` with `status: "PAID"` and a `paymentId`.
- Confirmation route contains the order `code` string.
- `GET /api/v1/orders/me` includes the new order.
- Cart store is empty after success.
- `User.loyaltyPoints` increased by `floor(order.total / 1000)` (ADR 0004 D7).

## 4. Authentication flows — S-AUTH-*

### S-AUTH-1: Register then log in

**Type:** Alternative  
**Traces to:** Task 7 AC; `api-contract.md` §6–§7.

**Precondition:** Anonymous. Email not yet registered.

| #   | Actor    | Action / System response                                                                 |
| --- | -------- | ---------------------------------------------------------------------------------------- |
| 1   | Customer | Opens `/auth/register`, submits email + password meeting the policy.                     |
| 2   | System   | Hashes password with bcrypt, creates user, returns `201`.                                |
| 3   | Customer | Submits the same email on `/auth/login` with the correct password.                       |
| 4   | System   | Verifies hash, returns JWT. Frontend stores token, attaches it to `POST /api/v1/orders`. |

**Outcome:** Authenticated session; subsequent `POST /api/v1/orders` succeeds.

**Assertions:** `201` on register; `200` + `accessToken` on login; `POST /api/v1/orders` without token returns `401`, with token returns `201`.

### S-AUTH-2: Duplicate email

**Type:** Error  
**Traces to:** Task 7 AC ("duplicate email returns 409").

| #   | Actor    | Action / System response                                                                                                                                  |
| --- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Customer | Registers with an email that already exists.                                                                                                              |
| 2   | System   | Returns `409` with `code: "EMAIL_TAKEN"` (`api-contract.md` §6). The message does not enable enumeration beyond the email the requester already supplied. |

**Outcome:** No new user; the existing user is untouched.

**Assertion:** `409` with `code: "EMAIL_TAKEN"`; user count unchanged.

### S-AUTH-3: Wrong password

**Type:** Error  
**Traces to:** Task 7 AC ("wrong password returns 401 with a generic message").

| #   | Actor    | Action / System response                                                               |
| --- | -------- | -------------------------------------------------------------------------------------- |
| 1   | Customer | Submits a valid email with a wrong password.                                           |
| 2   | System   | Returns `401` with `code: "AUTH_INVALID"` and a generic "Invalid credentials" message. |

**Outcome:** No token issued. The error does not distinguish "email not found" from "wrong password."

**Assertion:** `401`; response body identical for "wrong password" and "unknown email."

## 5. Cart flows — S-CART-*

### S-CART-1: Add, change quantity, remove

**Type:** Alternative  
**Traces to:** Task 5 AC.

**Precondition:** Cart has one line, qty 1.

| #   | Actor    | Action / System response                                                                                                                              |
| --- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Customer | Adds the same product with the same size and toppings again. System increments qty to 2 (no duplicate line; identity rule in `ui-decisions.md` §5.1). |
| 2   | Customer | Increases qty to 3 via the cart control. System updates `lineTotal` and total.                                                                        |
| 3   | Customer | Removes the line. System removes it, badge drops to 0, total is 0.                                                                                    |

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

**Outcome:** State persists across client-side navigation. **Not** across full reload — a reload with a non-empty cart shows the empty state; this is a known Phase 1 limitation (`ui-decisions.md` §5.1).

**Assertion:** after navigation, cart store `items.length` unchanged.

## 6. Order creation flows — S-ORD-*

### S-ORD-1: Server recomputes price (tamper protection)

**Type:** Error (security)  
**Traces to:** Task 6 AC ("server recomputes total; client prices ignored").

**Precondition:** Authenticated. Valid cart.

| #   | Actor    | Action / System response                                                                                                               |
| --- | -------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Attacker | Sends `POST /api/v1/orders` with `lineTotal` and `total` lower than the real prices.                                                   |
| 2   | System   | Recomputes from product prices; persists the server total; response reflects the server total, not the payload (`api-contract.md` §8). |

**Outcome:** Order total equals the server-computed price. The tampered payload has no effect.

**Assertion:** persisted `order.total` equals the fixture-computed value (`ui-decisions.md` §4.2); not the attacker's value.

### S-ORD-2: Empty cart

**Type:** Error  
**Traces to:** Task 6 AC ("empty cart → 400").

| #   | Actor    | Action / System response                                        |
| --- | -------- | --------------------------------------------------------------- |
| 1   | Customer | `POST /api/v1/orders` with `items: []`.                         |
| 2   | System   | Returns `400` with `code: "CART_EMPTY"` (`api-contract.md` §8). |

**Outcome:** No order created.

**Assertion:** `400` with `code: "CART_EMPTY"`; order count unchanged.

### S-ORD-3: Invalid size or unknown product

**Type:** Error  
**Traces to:** Task 6 AC.

| #   | Actor    | Action / System response                                                         |
| --- | -------- | -------------------------------------------------------------------------------- |
| 1   | Customer | `POST /api/v1/orders` with `size: "XL"` or a `productId` not in the DB.          |
| 2   | System   | Returns `400` with `code: "INVALID_SIZE"` or `"PRODUCT_NOT_FOUND"`, never `500`. |

**Outcome:** No order created; error envelope matches `api-contract.md` §8.

**Assertion:** status code and `code` match the contract; no `500`.

## 7. Payment flows — S-PAY-*

### S-PAY-1: Payment succeeds

**Type:** Main (covered inside S-MAIN-1 steps 8–9; listed separately for test targeting)  
**Traces to:** Task 8 AC; ADR 0004 D1.

**Precondition:** Order in `PENDING`. `PAYMENT_MOCK_MODE=success`.

**Outcome:** `POST /api/v1/payments` → `200` with `status: "PAID"`; stock decremented; loyalty points accrued; confirmation shown.

**Assertion:** order status `PAID`; `loyaltyPointsEarned = floor(amount / 1000)` (ADR 0004 D7).

### S-PAY-2: Payment fails — cart preserved

**Type:** Error  
**Traces to:** Task 8 AC; PDF US-05 acceptance criteria; ADR 0004 D2.

**Precondition:** Order in `PENDING`. `PAYMENT_MOCK_MODE=failure`.

| #   | Actor    | Action / System response                                                                                                                           |
| --- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Customer | Confirms payment. System calls `POST /api/v1/payments`; mock returns failure.                                                                      |
| 2   | System   | Order → `PAYMENT_FAILED`; returns **`200`** with body `{ status: "PAYMENT_FAILED", reason, retryable: true }` (ADR 0004 D2, `api-contract.md` §9). |
| 3   | Customer | System keeps the cart intact and shows a retry affordance.                                                                                         |

**Outcome:** Order `PAYMENT_FAILED`; cart unchanged; user can retry. No stock change, no points.

**Assertion:** cart `items.length` unchanged; order status `PAYMENT_FAILED`; stock unchanged; `loyaltyPoints` unchanged. The frontend must check the body `status`, not `res.ok` (`api-contract.md` §14).

### S-PAY-3: Retry after failure succeeds

**Type:** Alternative  
**Traces to:** Task 8 AC ("retry after failure succeeds"); ADR 0004 D5.

**Precondition:** Prior order in `PAYMENT_FAILED`. `PAYMENT_MOCK_MODE` switched to `success` (or the mock's failure rule is exhausted, per ADR 0004).

| #   | Actor    | Action / System response                                                                                                                                         |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Customer | Clicks "retry" on the failed order.                                                                                                                              |
| 2   | System   | Creates a **new** payment attempt against the same order, with a **new** `Idempotency-Key` (ADR 0004 D5). On success, order transitions `PAYMENT_FAILED → PAID`. |

**Outcome:** Order `PAID`. The history shows one order, not two.

**Assertion:** one order row; status `PAID`; two payment rows (one `FAILED`, one `SUCCESS`).

### S-PAY-4: Double-submit before Task 10b

**Type:** Error (known gap)  
**Traces to:** Task 8 out-of-scope note; Task 10b fixes it.

**Precondition:** No idempotency key enforcement yet (Task 10b not merged).

| #   | Actor    | Action / System response                       |
| --- | -------- | ---------------------------------------------- |
| 1   | Customer | Double-clicks "confirm payment."               |
| 2   | System   | May create two payment attempts / two charges. |

**Outcome:** This is a **known defect** until Task 10b lands. The demo script must not double-click. Recorded here so the demo is honest and so Task 10b's test has a documented "before" state.

**Assertion (pre-fix):** documented, not asserted. **Post-fix (Task 10b):** S-PAY-5.

### S-PAY-5: Idempotent payment (post-Task 10b)

**Type:** Error (concurrency)  
**Traces to:** Task 10b AC; PDF §9 test (b); ADR 0004 D4.

**Precondition:** Order `PENDING`. Task 10b merged.

| #   | Actor  | Action / System response                                                                                                       |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Client | Sends `POST /api/v1/payments` twice with the **same** `Idempotency-Key` and the same body.                                     |
| 2   | System | First request creates a payment; second returns the **same** response (same `paymentId`), does not charge twice (ADR 0004 D4). |

**Outcome:** One payment, one charge, one order state transition.

**Assertion:** payment count for the order is 1; both responses carry the same `paymentId`; order status `PAID` exactly once.

### S-PAY-6: Idempotency key reused with different body

**Type:** Error  
**Traces to:** Task 10b AC ("replay with different body but same key is rejected"); ADR 0004 D4.

| #   | Actor  | Action / System response                                                             |
| --- | ------ | ------------------------------------------------------------------------------------ |
| 1   | Client | Reuses an `Idempotency-Key` with a different `orderId` or `amount`.                  |
| 2   | System | Returns `409` with `code: "IDEMPOTENCY_CONFLICT"`; does not create a second payment. |

**Outcome:** No side effects.

**Assertion:** `409` with `code: "IDEMPOTENCY_CONFLICT"`; payment count unchanged.

## 8. Order history flows — S-ORD-4

### S-ORD-4: History and access control

**Type:** Main + Error  
**Traces to:** Task 9 AC; Task 7 guard AC; ADR 0004 D3.

**Precondition:** Two users A and B, each with at least one order.

| #   | Actor             | Action / System response                                                                                                                                                                                      |
| --- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | A (authenticated) | `GET /api/v1/orders/me` returns A's orders, newest first.                                                                                                                                                     |
| 2   | A                 | Tries to open B's confirmation route `/orders/[code]/confirmation` directly. System returns `404` with `code: "ORDER_NOT_FOUND"` — same response as a nonexistent code, so B's order existence is not leaked. |
| 3   | Anonymous         | `GET /api/v1/orders/me` → `401`.                                                                                                                                                                              |

**Outcome:** A sees only A's orders; cross-user access is denied without information leakage.

**Assertion:** A's response set excludes B's order codes; anonymous request `401`; cross-user route renders the same safe "not found" message (`wireframes.md` §8).

## 9. State machine flows — S-ORD-5 (post-Task 10a)

### S-ORD-5: Invalid transition rejected

**Type:** Error  
**Traces to:** Task 10a AC; PDF §9 test (a); ADR 0004 D1, D5.

**Precondition:** Order `COMPLETED` (terminal).

| #   | Actor  | Action / System response                                                                                                                   |
| --- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Client | Requests a transition `COMPLETED → PAID` (or any non-diagram edge).                                                                        |
| 2   | System | `assertTransition` throws; API returns `409` with `code: "INVALID_STATE_TRANSITION"` and the offending `from`/`to`. Order state unchanged. |

**Outcome:** Order remains `COMPLETED`; error is specific, not a generic `500`.

**Assertion:** order status unchanged; response body names the transition. Diagram: `docs/diagrams/flows/flow-order-state-v1.mmd`.

## 10. Concurrent stock — S-ORD-6 (post-Task 10c)

### S-ORD-6: Concurrent orders do not oversell

**Type:** Error (concurrency)  
**Traces to:** Task 10c AC; PDF §9 test (c); ADR 0004 D1.

**Precondition:** Product stock = 1.

| #   | Actor                 | Action / System response                                                                                                                    |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Client A and Client B | Both submit payments for the same product, near-simultaneously.                                                                             |
| 2   | System                | Transaction + optimistic locking on `Product.version`: exactly one succeeds; the other fails with `409` `code: "OUT_OF_STOCK"` (not `500`). |
| 3   | System                | Final stock = 0.                                                                                                                            |

**Outcome:** One order `PAID`; one payment rejected; stock never negative.

**Assertion:** successful payments for that product = 1; final stock = 0; rejected request status is `409` with `code: "OUT_OF_STOCK"`.

## 11. Cancel flow — S-CANCEL-1

**Type:** Cancel  
**Traces to:** PDF §5 flowchart ("Hủy / thanh toán lỗi"); ADR 0004 D1, D6.

**Precondition:** Order `PENDING`.

| #   | Actor    | Action / System response                                                                         |
| --- | -------- | ------------------------------------------------------------------------------------------------ |
| 1   | Customer | Abandons checkout (navigates away) without paying.                                               |
| 2   | System   | The `PENDING` order remains; **no stock is reserved** (stock decrements at `PAID`, ADR 0004 D1). |
| 3   | System   | No TTL cleanup in Phase 1 (ADR 0004 D6); the order stays `PENDING` indefinitely.                 |

**Outcome:** No payment, no stock effect, no points. The order is visible in history as `PENDING`.

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

The three graded tests (PDF §9) are S-PAY-5, S-ORD-5, S-ORD-6. They must pass in CI and be demonstrated at Sprint Review. See `test-strategy.md` §4 for the level at which each is proven.

## 13. Decisions closed by ADR 0004

When this document was first drafted, six decisions were open. They are now closed by ADR 0004 and the API contract. This table records the closure so a future reader does not re-open them.

| #   | Decision                                                      | Closed by   | Current answer                                                               |
| --- | ------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------- |
| D1  | Does stock decrement at order creation or payment success?    | ADR 0004 D1                        | At payment success (`PAID`), under optimistic lock on `Product.version`.     |
| D2  | Does `POST /payments` failure return `402` or `200 + status`? | ADR 0004 D2; `api-contract.md` §9  | `200` with body `status: "PAYMENT_FAILED"`.                                  |
| D3  | Is the confirmation route keyed by order `id` or `code`?      | ADR 0004 D3; `api-contract.md` §11 | By `code`: `/orders/[code]/confirmation`.                                    |
| D4  | What is the loyalty accrual rule?                             | ADR 0004 D7                        | `floor(order.total / 1000)` points per paid order; no redemption in Phase 1. |
| D5  | Does retry create a new payment or reuse the failed one?      | ADR 0004 D5 | A new payment attempt with a new `Idempotency-Key`; order stays the same.    |
| D6  | Are stale `PENDING` orders auto-cancelled?                    | ADR 0004 D6 | No TTL in Phase 1; the order stays `PENDING`.                                |

Any new decision that arises from a scenario must be recorded in the relevant ADR (per ADR 0001 rule 5) and this table updated in the same PR.

## 14. What this document does not cover

- **UI visual behavior** (animations, exact copy) — `docs/design/ui-decisions.md`.
- **API request/response shapes** — `docs/architecture/api-contract.md`; scenarios reference it, not duplicate it.
- **Non-functional scenarios** (load, latency) — Phase 2+ `docs/testing/`.
- **Barista/back-office flows** — out of MVP, `product-backlog.md` §16.