# BrewLite - Software Requirements Specification

**Version:** 1.0  
**Status:** Draft for team review  
**Source:** BrewLite Software Engineering assignment (2026-2027)

## 1. Purpose

This document records the requirements for BrewLite, a cashless drink-ordering web application. It turns the assignment brief into a reviewable baseline for implementation and acceptance. The assignment is authoritative; decisions marked **Assumption** are implementation choices that the team should confirm.

## 2. Product scope

BrewLite lets a customer browse a sample drink menu, customize a drink, build a cart, authenticate, place an order, pay through a simulated wallet/card gateway, and view the result and order history. The MVP covers the customer flow from product selection through payment confirmation.

Barista order management is outside the MVP, although order states include preparation and completion for the backend state-machine exercise. Real payment-provider integration is out of scope; payment is simulated.

## 3. Users and stakeholders

- **Customer:** browses and customizes drinks, places and pays for orders, and views order history.
- **Store manager / Product Owner:** prioritizes the backlog and accepts increments.
- **Instructor:** evaluates process, product, and acceptance criteria.
- **Development team:** analyzes, designs, implements, verifies, and hands over the system.
- **Payment service:** simulated wallet/card gateway for this assignment.
- **Barista:** future stakeholder; receives/updates orders in a later extension, outside MVP.

## 4. Functional requirements

| ID | Requirement | Acceptance criteria / observable result | Priority |
|---|---|---|---|
| FR-01 | Browse drinks | `GET /products` returns menu items with id, name, price, and image URL; the menu UI displays them and handles loading and empty states. | Must |
| FR-02 | View and customize a drink | Customer can view product details, choose size S/M/L and available toppings, and see the resulting price. | Must |
| FR-03 | Manage cart | Customer can add items, change quantities, and remove items; cart shows item count and recalculates totals. | Must |
| FR-04 | Register and sign in | `POST /auth/register` and `POST /auth/login` support account creation and sign-in; passwords are hashed and login returns a JWT. | Must |
| FR-05 | Create order | Authenticated customer submits cart to `POST /orders`; input is validated, order is persisted as `PENDING`, and response includes an order identifier. | Must |
| FR-06 | Pay without cash | Customer chooses Wallet or Card and submits payment through `POST /payments`; successful payment moves the order to `PAID`; failed payment moves it to `PAYMENT_FAILED` and leaves cart contents available for retry. | Must |
| FR-07 | Confirm order | After successful payment, UI displays order identifier and `PAID` status. | Must |
| FR-08 | View order history | `GET /orders/me` returns the authenticated customer's orders only. | Must |
| FR-09 | Enforce order state machine | Valid flow includes `PENDING -> PAID -> PREPARING -> READY -> COMPLETED`; failure/retry and cancellation transitions follow the state diagram. Invalid transitions are rejected; `COMPLETED` and `CANCELLED` are terminal. | Must (Task 10) |
| FR-10 | Make payment idempotent | Repeated payment requests with the same `Idempotency-Key` do not charge or create duplicate payment/order effects; retries return the recorded outcome. | Must (Task 10) |
| FR-11 | Protect stock under concurrency | Concurrent orders cannot consume more stock than available; inventory changes use a database transaction and optimistic concurrency control. | Must (Task 10) |
| FR-12 | Apply promotion and loyalty | A valid promotion is applied to the order; loyalty points are credited once after successful payment. | Must (Task 10; policy details are assumptions) |

### 4.1 Payment acceptance scenario (US-05)

1. With at least one cart item, checkout displays the total.
2. Customer selects Wallet or Card and confirms.
3. On successful mock payment, the order becomes `PAID` and confirmation shows its identifier.
4. On payment failure, order becomes `PAYMENT_FAILED` and cart remains available.

## 5. Non-functional requirements

| ID | Requirement | Acceptance measure |
|---|---|---|
| NFR-01 | API performance | API response time is under 500 ms with sample data (assignment target; load profile is not specified). |
| NFR-02 | Credential security | Passwords are stored as bcrypt hashes, never plaintext. |
| NFR-03 | API authentication | JWT protects order-creation and user-specific order-history endpoints; users cannot read another user's history. |
| NFR-04 | Input validation | API inputs are validated; invalid data is rejected with an appropriate client error. |
| NFR-05 | Browser support | Web interface works on current mainstream browsers. Exact browser/version matrix is a team assumption. |
| NFR-06 | Run and handover | Docker Compose can run frontend, backend, and database; README explains setup and demo. |
| NFR-07 | Basic UI resilience | Loading, empty, and basic error states are handled where data is fetched. |

## 6. Business rules and data

- Order creation starts at `PENDING`.
- A successful payment moves an order to `PAID`; a failed attempt is represented by `PAYMENT_FAILED` and can be retried as defined by the state machine.
- Order transitions not represented in the state diagram are rejected.
- The same idempotency key must not cause duplicate payment effects.
- Stock must never become negative due to concurrent ordering.
- Loyalty points are awarded after an order is paid, at most once per paid order.
- Minimum entities: `Product(id, name, price, imageUrl, stock)`, `User(id, email, passwordHash, loyaltyPoints)`, `Order(id, userId, status, total, createdAt)`, `OrderItem(id, orderId, productId, size, qty, lineTotal)`, and `Payment(id, orderId, idempotencyKey, amount, method)`.
- **Assumptions to confirm:** promotion rules, loyalty conversion rate, size/topping price adjustments, currency/rounding, stock unit definition, and cancellation policy are not fully specified in the assignment.

## 7. API baseline

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/products` | List menu products | Public |
| GET | `/products/:id` | Get product details | Public |
| POST | `/auth/register` | Register user | Public |
| POST | `/auth/login` | Login and issue JWT | Public |
| POST | `/orders` | Create `PENDING` order from cart | JWT |
| POST | `/payments` | Make/retry payment; send `Idempotency-Key` | JWT, owner of order |
| GET | `/orders/me` | List current user's orders | JWT |

## 8. Verification and Definition of Done

Each backlog item is done when its code runs, meets its acceptance criteria, has a clear Git commit and peer review, validates API input, handles basic UI loading/error states where relevant, and has run instructions in README.

Task 10 additionally requires unit/integration evidence for: rejecting invalid state transitions; duplicate same-key payment requests producing one effect; and concurrent orders not exceeding stock.

## 9. Delivery scope

The final increment is demonstrated end to end: select product, add to cart, authenticate if needed, pay, and show order confirmation. Handover includes source control, Docker Compose, README, sprint retrospective, and captured customer feedback/backlog items.

## 10. Scrum plan from the brief

- Sprint 1: foundation and menu (Tasks 1-4).
- Sprint 2: cart, order creation, authentication (Tasks 5-7).
- Sprint 3: payment, handover, and advanced backend (Tasks 8-10).

## 11. Open decisions

1. Confirm promotion eligibility/discount and loyalty-point calculation.
2. Decide exact size/topping price rules and inventory granularity.
3. Decide whether user can cancel before payment/after payment and define retry expiry.
4. Choose Prisma or TypeORM and database migration/seeding approach.
5. Define the performance test sample size and browser support baseline.
