# UC-01 — Place and pay an order

**Status:** Assignment 2, Task 1.3  
**Owner:** team  
**Diagram:** [use-case-checkout.puml](../diagrams/use-case-checkout.puml), [use-case-checkout.svg](../diagrams/use-case-checkout.svg)  
**Related:** [SRS](srs.md) FR-03, FR-04, FR-05, FR-06, FR-07, FR-09, FR-10, FR-11, FR-14; [scenarios](scenarios.md) S-MAIN-1, S-PAY-1, S-PAY-2, S-PAY-3, S-PAY-5, S-ORD-6; [ADR 0004](../architecture/adr/0004-payment-mock-and-order-lifecycle.md)

This is the core use case. A reader should be able to say what the system does, what it does not do, and which tests would prove it.

## 1. Summary

| Field | Value |
| --- | --- |
| ID | UC-01 |
| Name | Đặt và thanh toán đơn hàng (place and pay an order) |
| Primary actor | Khách hàng (customer) |
| Secondary actor | Payment provider, simulated inside the API |
| Scope | BrewLite web app and API |
| Level | User goal |
| Trigger | The customer confirms payment for the current cart. |
| Priority | Must |

Staff do not participate. There is no counter screen in this use case.

## 2. Preconditions

- The customer has an account, or can register and then sign in (FR-04).
- The cart has at least one line with a known product, a size in `{S, M, L}`, a quantity greater than zero, and only known toppings (FR-03, FR-09).
- The menu prices used to display the cart are the current catalog prices. The server still recomputes them (FR-05, NFR-06).
- The mock payment provider is configured to approve or decline. It is not a bank.

## 3. Postconditions

**Success**

- One order exists with status `PAID`, a stable order code, and the server-computed total.
- One successful payment row exists for that attempt.
- Stock for each paid drink has decreased by the paid quantity and is still zero or greater (FR-11).
- Loyalty points have increased by `floor(total / 1000)` if FR-13 is implemented. A missing point update does not undo a paid order, but it fails FR-13.
- The cart is empty.
- The customer sees the order code and status `PAID` (FR-07).

**Failure (payment declined, still a completed use case)**

- The order exists and its status is `PAYMENT_FAILED`, or the payment attempt is recorded as failed against that order.
- Stock is unchanged. Points are unchanged.
- The cart still holds the lines the customer tried to buy (FR-06).
- The customer can retry UC-01 against the same order with a new idempotency key (FR-14).

**Abandoned before payment**

- No paid order exists. If an order was created and left `PENDING`, it does not hold stock.

## 4. Main flow

| Step | Actor | Action |
| --- | --- | --- |
| 1 | Customer | Opens the menu and selects a drink (FR-01, FR-02). |
| 2 | Customer | Chooses size and toppings. The UI shows the line price. |
| 3 | Customer | Adds the line to the cart. Repeats steps 1–3 if they want another drink (FR-03). |
| 4 | Customer | Opens the cart and checks the total. |
| 5 | Customer | Chooses to pay. |
| 6 | System | If there is no valid session, includes UC-AUTH. The customer signs in or registers, then returns to checkout (FR-04). |
| 7 | Customer | Chooses Wallet or Card and confirms payment. |
| 8 | System | Creates an order with `POST /api/v1/orders`. Status is `PENDING`. Total is computed on the server. Client prices are ignored (FR-05). |
| 9 | System | Calls `POST /api/v1/payments` with the order id, method, amount, and an `Idempotency-Key` (FR-06, FR-10). |
| 10 | Payment provider | Approves the mock charge. |
| 11 | System | In one transaction: marks the payment successful, moves the order `PENDING → PAID`, decrements stock, and accrues loyalty points. |
| 12 | System | Clears the cart and shows confirmation with the order code and status `PAID` (FR-07). |

The customer can then open history and see that order.

## 5. Alternative flows

### 5.1 A1 — Already signed in

At step 6 the token is valid. The system skips the login screen and stays on checkout.

### 5.2 A2 — Promotion code

Before step 8 the customer enters a promo code. If it is valid, the server stores the discount and the total is subtotal minus discount (FR-12). If it is not valid, the system reports the error and does not create a discounted order. The customer may remove the code and continue the main flow.

### 5.3 A3 — Retry after a failed payment

The customer already has an order in `PAYMENT_FAILED` (flow E1). They confirm payment again. The system does not create a second order. It sends a new payment attempt with a new `Idempotency-Key`. On approval, the order moves `PAYMENT_FAILED → PAID` (FR-14).

### 5.4 A4 — Same payment request sent twice

The client repeats step 9 with the same `Idempotency-Key` and the same body, because of a double tap or a timeout retry. The system returns the original result and does not create a second payment or a second stock decrement (FR-10).

## 6. Exception flows

### 6.1 E1 — Payment declined

At step 10 the mock declines.

| Step | Action |
| --- | --- |
| E1.1 | The system stores a failed payment and sets the order to `PAYMENT_FAILED`. |
| E1.2 | Stock and loyalty points stay as they were. |
| E1.3 | The cart is not cleared. |
| E1.4 | The UI tells the customer the payment failed and that they can retry. |
| E1.5 | The use case ends in the failure postcondition. The customer may start A3. |

### 6.2 E2 — Not signed in, and the customer will not sign in

At step 6 the customer cancels login. No order is created. The cart is kept. The use case ends with no order.

### 6.3 E3 — Out of stock at payment

Stock was available when the line was added, but not when step 11 runs.

| Step | Action |
| --- | --- |
| E3.1 | The payment transaction sees insufficient stock. |
| E3.2 | The order does not become `PAID`. Stock does not go below zero (FR-11). |
| E3.3 | The customer is told the drink is unavailable. The cart is kept. |

A `PENDING` order does not reserve stock, so this race is expected. See ADR 0004.

### 6.4 E4 — Invalid cart or tampered price

The client sends an empty cart, an unknown product, a size outside `{S, M, L}`, or a total lower than the catalog price.

| Step | Action |
| --- | --- |
| E4.1 | The API rejects the create-order call with a validation error (FR-09). |
| E4.2 | No order is created. If a price field was tampered, a valid order that does get created stores the server total, never the tampered total (NFR-06). |

### 6.5 E5 — Session expired during checkout

Step 8 or 9 returns unauthorized. The system drops the invalid session and asks the customer to sign in again. The cart is kept. No second charge is made.

### 6.6 E6 — Idempotency key reused with a different body

The client resends an `Idempotency-Key` with a different order id or amount. The API rejects the call and does not create another payment (FR-10).

## 7. What this use case does not do

- It does not call a bank, a card network, or VietQR (FR-W1).
- It does not notify the counter. Staff are outside the system boundary (FR-W2).
- It does not take cash.
- It does not spend loyalty points.
- It does not let the customer edit an order after it is `PAID`.
- Scanning a demo QR is not a step. Wallet or Card confirmation is the step that pays.

## 8. Business rules inside the flow

| Rule | Where it binds |
| --- | --- |
| Money is an integer number of VND. | Steps 2, 4, 8, 9 |
| Server price wins. | Step 8 |
| Stock moves at `PAID`, not at `PENDING`. | Step 11, E3 |
| Payment success and failure are states, not a second order. | Steps 11, E1, A3 |
| One idempotency key plus one body means one payment. | A4, E6 |
| History is owner-scoped. | After step 12, FR-07 |

Allowed payment methods in this use case are `WALLET` and `CARD` only.

## 9. Requirements traced

| Requirement | Where it is proved in this use case |
| --- | --- |
| FR-03 | Steps 3–4, empty-cart rejection in E4 |
| FR-04 | Step 6, E2, E5 |
| FR-05 | Step 8 |
| FR-06 | Steps 9–12, E1 |
| FR-07 | Step 12 |
| FR-09 | E4 |
| FR-10 | A4, E6 |
| FR-11 | Step 11, E3 |
| FR-12 | A2 |
| FR-13 | Step 11 |
| FR-14 | A3 |
| NFR-02 | Steps 6, 8, 9 |
| NFR-06 | Steps 4, 8, E4 |

The sequence diagram for this use case is [sequence-checkout.puml](../diagrams/sequence-checkout.puml) (export: [sequence-checkout.svg](../diagrams/sequence-checkout.svg)). The end-to-end activity is [activity-order-flow.puml](../diagrams/activity-order-flow.puml).

## 10. Test ideas

These are the checks a later test should assert. They are not the tests themselves.

| Check | Flow | Expected evidence |
| --- | --- | --- |
| Happy path menu to confirmation | Main | Order `PAID`, cart empty, history contains the code |
| Declined mock payment | E1 | Status `PAYMENT_FAILED`, cart unchanged, stock unchanged |
| Same `Idempotency-Key` twice | A4 | One payment row |
| Same key, different body | E6 | Conflict, no new payment |
| Two payments racing the last unit | E3 | Stock not negative |
| No token | E2 / E5 | Unauthorized, no order or no payment |

## 11. Open point

ADR 0004 keys the confirmation URL by order code (`/orders/[code]/confirmation`). This use case requires the customer to see the code and the status. It does not require a particular path string beyond that. The sequence diagram in Batch 2 should use the code, because that is the customer-facing identifier.
