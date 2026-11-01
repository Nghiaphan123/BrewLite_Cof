# BrewLite — Context and Scope

**Status:** Assignment 2, Task 1.1  
**Owner:** team  
**Related:** [SRS](srs.md), [UC-01](use-case-uc01-place-and-pay.md), [scenarios](scenarios.md), [product backlog](product-backlog.md), [API contract](../architecture/api-contract.md), [ADR 0004](../architecture/adr/0004-payment-mock-and-order-lifecycle.md)

This file is the Assignment 2 context-and-scope deliverable. It states the business problem, who cares, what the MVP includes, what it refuses, and the assumptions and constraints a reader needs before the SRS. It does not replace `product-backlog.md`. Where Assignment 2 widens Assignment 1, this file wins for grading.

## 1. Business problem

A customer at a coffee counter waits while staff take the order, repeat the size and toppings, calculate the total, and take payment. Mistakes show up as the wrong drink, the wrong price, or a second charge when the customer taps pay again.

BrewLite is a mobile-first web app for that counter. The customer browses the menu, chooses size and toppings, reviews a cart, signs in, pays through a simulated Wallet or Card gateway, and sees a confirmation and order history. No real money moves. The payment provider is a mock behind a `PaymentProvider` boundary.

The minimum business flow is:

```text
Xem menu → Chọn tùy chọn → Giỏ hàng → Đặt đơn → Thanh toán → Theo dõi đơn
```

## 2. Stakeholders

| Stakeholder | Goal | What they expect from the MVP | In the product? |
| --- | --- | --- | --- |
| Khách hàng (customer) | Order a drink without waiting at the till to recite options and pay cash. | See the menu, choose size and toppings, keep a cart, register or sign in, pay with mock Wallet or Card, and see confirmation, status, and history. | Yes. Primary actor. |
| Nhân viên quầy (counter staff) | Receive a clear paid order instead of a verbal one. | A paid order has a code, items, size, toppings, and total. They do not get a staff screen in this MVP. | Stakeholder only. No counter UI. |
| Quản lý cửa hàng (store manager) | Know what the shop sells and that stock and money rules are enforced. | Prices are whole VND and recomputed by the server. Stock cannot go negative. Promotions and loyalty accrual follow the written rules. No admin catalog UI. | Stakeholder only. No back office. |
| Giảng viên / khách hàng nghiệm thu (lecturer) | Grade process and product against Assignment 2. | Requirements, diagrams, architecture, a running MVP, tests, CI/CD, and a reachable production URL, in that order, with git history. | Stakeholder. Not a system actor. |
| Nhóm phát triển (development team) | Build, test, and hand over one system without replacing the required stack. | A monorepo with `apps/web`, `apps/api`, and `docs`, plus Docker Compose for local run. | Builds the system. Not a runtime actor. |
| Đơn vị thanh toán (payment provider) | Be the boundary that approves or declines a charge. | Simulated only. Wallet and Card. Success and failure are observable. The same payment request is not charged twice. | Secondary actor, in-process mock. |

Roles inside the team (product owner, scrum master, developer) are recorded in `working-agreement.md`. They are not additional product stakeholders.

## 3. In scope

The MVP must let an authenticated customer complete the flow in §1 on a phone-sized browser.

| Area | In scope |
| --- | --- |
| Menu | List drinks with image, name, price, and stock. Loading, empty, and error states. `GET /api/v1/products`. |
| Product detail | Size `S`, `M`, `L` and toppings. The displayed price updates before the item enters the cart. `GET /api/v1/products/:id`. |
| Cart | Add, change quantity, remove. Total is the sum of line totals. Cart is required before checkout. |
| Auth | Register, log in, JWT on protected calls, reject a missing or invalid token. |
| Order | Create one order from the cart. Server recomputes the price. New order status is `PENDING`. |
| Payment | Mock Wallet and mock Card. Success moves the order to `PAID`. Failure moves it to `PAYMENT_FAILED` and keeps the cart. |
| Tracking | Confirmation shows code and status. History lists only the signed-in customer's orders. Status values are the order state machine. |
| Money and stock | Integer VND. Stock decrements when payment succeeds, under a lock, and never goes negative. |
| Promo and loyalty | A valid promo reduces the total. Points accrue when an order becomes `PAID`. Spending points is out of scope. |
| Local run | `docker-compose.yml` runs web, API, and PostgreSQL. Migrations and seed can rebuild the database. |
| Quality and delivery | Unit tests, API integration tests for order and payment, one end-to-end test from menu to confirmation, CI on pull requests, a health check, and a production deploy with rollback notes. These are specified here and built in later tasks. |
| Client | Next.js, mobile-first, installable as a PWA (manifest, icons, service worker). |

Assignment 1's backlog listed PWA as out of scope. Assignment 2 puts mobile-first/PWA in the required stack, so PWA is in scope for this assignment.

## 4. Out of scope

| Item | Why it is out |
| --- | --- |
| Real payment gateway (VNPay, MoMo, Stripe, or a bank QR) | The assignment requires a simulated provider. No real money, no card numbers, no bank credentials. |
| Counter, barista, or kitchen screen | Staff are stakeholders. They are not given a UI in this MVP. |
| Store-manager catalog, reports, or user admin | No admin CRUD. |
| Delivery, pickup scheduling, multi-store | One counter, one menu. |
| Loyalty redemption | Points may accrue. They cannot be spent. |
| Email, SMS, or push notifications | Status is visible in the app only. |
| Multi-language UI | Vietnamese UI text. English is allowed in code, APIs, and engineering docs. |
| Offline ordering | A PWA shell may cache the app shell. Placing an order still requires the API. |
| Public production database | PostgreSQL is not exposed to the internet in production. |
| Replacing Next.js, NestJS, or PostgreSQL | Other tools may be added. These three may not be swapped out. |

A demo QR on the checkout screen, if present, is not a payment method. It must not be described as a bank or VietQR payment. Wallet and Card remain the required methods.

## 5. Assumptions

- One store, one menu, one currency (VND). Prices have no decimal subunit.
- Customers use a current mobile or desktop browser. The layout is designed for a phone first.
- The lecturer accepts a mock payment provider as the payment stakeholder.
- Seed data is enough to demonstrate the menu, a successful payment, a failed payment, and an out-of-stock case.
- The customer creates an account in the app. There is no social login and no guest checkout for a paid order.
- Order creation is not idempotent. Payment is. A double submit of `POST /payments` with the same key and body has one effect.
- Stock is checked again at payment time. A `PENDING` order does not reserve stock.
- "Theo dõi đơn" means the customer can see status and history. It does not mean a live map or a staff push.

## 6. Constraints

| Constraint | Consequence |
| --- | --- |
| Stack | Frontend is Next.js. Backend is NestJS. Database is PostgreSQL. |
| Process | Tasks 1 through 5 are sequential. A later task is accepted only when the earlier task's required files are in git. |
| Money | No real charges. Secrets and payment credentials are not committed and do not appear in CI logs. |
| API | JSON over `/api/v1`. Protected routes require `Authorization: Bearer <jwt>`. |
| Identity of an order in the UI | The customer-facing identifier is the order code, not an internal UUID, as decided in ADR 0004. |
| Time | Dates in the API are UTC. Display may be local. |
| Repository | `apps/web`, `apps/api`, `docs`, `docker-compose.yml`, `.env.example`, `README.md`. |

## 7. Initial risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Some application code already exists before this Task 1 file. | A strict reading of the sequential rule may question Task 4 evidence. | Commit Task 1–3 documents on their own branch before claiming later tasks. Do not delete the existing app. |
| Hosting platform is not chosen yet. | Task 3.2 cannot be an honest deployment diagram. | Choose the host before Batch 3. Do not draw a generic cloud. |
| CD and a recorded CI run are not present yet. The CI workflow file is. | The SRS and the running system can drift. | Track the open delivery items. Do not invent a pipeline log. |
| Frontend total and server total can diverge. | The customer sees one price and is charged another. | Server price is authoritative. A shared pricing fixture must agree. |
| Production URL missing at grading time. | Task 5 deployment is incomplete even if the code is done. | Deploy only after the documents and the pipeline exist. Record the URL in the README. |

## 8. Acceptance for this file

A reader can answer, without opening the code:

- what problem BrewLite solves;
- who the six stakeholders are and what each expects;
- what is in the MVP and what is refused;
- which assumptions and constraints the design must respect.
