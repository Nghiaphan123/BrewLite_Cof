# BrewLite - Context and Scope

**Version:** 0.1  
**Status:** Draft for team review (task D-03)  
**Related:** [SRS](srs.md), [Overview of plans](../plans/00-overview.md), [Documentation plan](../plans/01-documentation-plan.md)  
**Sources:** Assignment 1 (sections 1 to 4, 11, 12), Assignment 2 (Task 1.1)

Items marked **(proposed)** are the team's own suggestions, not stated in the assignments. Confirm or change them in the review. Items marked **(pending D-01)** depend on a decision from the decision meeting.

## 1. Business context and problem

Customers who buy drinks at a counter queue to order and often pay in cash, which slows service and wastes time. BrewLite is a cashless drink-ordering web application that lets a customer choose a drink, customize it, pay without cash, and collect the order at the counter.

**Product vision:** BrewLite helps customers order and pay for drinks without cash in a few taps, reducing queue time and speeding up order pickup.

**What the system must achieve:** let a customer go from choosing a product to a paid, confirmed order in one flow, and let the team demonstrate that flow end to end, locally and on a production URL.

## 2. Stakeholders

| Stakeholder                   | Role                                                              | Goals                                                        | Expectations of the system                                                                                                               | In the MVP?          |
| ----------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Customer                      | Orders and pays for drinks                                        | Order quickly without cash; track the order                  | Browse the menu, choose size and toppings, manage a cart, sign in, pay by Wallet or Card, see an order ID and status, view order history | Yes                  |
| Barista / counter staff       | Prepares orders                                                   | Receive orders and update preparation status                 | Order states `PREPARING`, `READY`, `COMPLETED` exist in the backend; a barista screen does not                                           | No (extension)       |
| Store manager / Product Owner | Defines requirements, prioritizes the backlog, accepts increments | Get a working increment each sprint that matches the backlog | Clear acceptance criteria; demonstrable increments; backlog items recorded from feedback                                                 | Yes (as acceptor)    |
| Instructor (acceptance)       | Evaluates process, product, and acceptance criteria               | See a correct process and a working product                  | Artifacts in the repository with clear history, a running demo, Docker Compose, README, and a reachable production URL                   | Yes (as evaluator)   |
| Development team              | Analyzes, designs, builds, tests, and hands over                  | Deliver all tasks to the Definition of Done                  | Clear requirements, a task list with dependencies, and a stable toolchain                                                                | Yes                  |
| Payment provider              | Processes payments                                                | Not a real party in this project; simulated                  | A mock Wallet/Card gateway that returns success or failure                                                                               | Yes (simulated only) |

## 3. Scope

### 3.1 In scope (MVP)

The MVP covers the customer flow from choosing a drink to a confirmed payment:

- Browse the drink menu with image, name, and price, with loading, empty, and error states.
- View product details and choose size (S, M, L) and toppings, with the price updating.
- Add, change quantity, and remove items in a cart with a running total and item count.
- Register and sign in (JWT, hashed passwords).
- Create an order from the cart; the order starts as `PENDING`.
- Pay by Wallet or Card through a mock gateway; success gives `PAID`, failure gives `PAYMENT_FAILED` and keeps the cart for retry.
- Show an order confirmation (order ID and status) and the customer's own order history.
- Backend rules from Assignment 1 Task 10: order state machine, idempotent payment, stock control under concurrent orders, promotion and loyalty points.
- Quality and delivery: validation, tests (unit, integration, end to end), migrations and seed data, a health endpoint, Docker Compose, CI/CD, and a production deployment.

### 3.2 Extension scope (later, not in this delivery)

- A barista screen to accept and update orders. The backend states already exist; only the customer MVP is built.
- Integration with a real payment provider.
- Barista-driven and refund-related behavior beyond what the state diagram needs.

### 3.3 Out of scope

- Real money, real bank accounts, and production payment credentials.
- Automatic detection of real bank transfers.
- A barista or manager application.
- An admin dashboard or menu-management screen **(proposed)**.
- Delivery, table service, or multiple stores **(proposed)**.
- Native mobile apps; the product is a mobile-first web app and PWA **(proposed)**.
- Email or push notifications **(proposed)**.

## 4. Assumptions

| #   | Assumption                                                                                                                | Status                  |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| A1  | Payment is simulated by a mock gateway; no real money moves.                                                              | Fixed by the assignment |
| A2  | The menu is a small sample set loaded from seed data.                                                                     | Proposed                |
| A3  | Prices are whole VND amounts stored as integers.                                                                          | Pending D-01            |
| A4  | Size and topping prices follow a fixed surcharge rule.                                                                    | Pending D-01            |
| A5  | Stock is counted per product (finished drinks), matching the minimum data model.                                          | Pending D-01            |
| A6  | A `PAID` order can be cancelled as the state diagram shows; who may cancel and how refunds are recorded is decided later. | Pending D-01            |
| A7  | There is one store and one counter.                                                                                       | Proposed                |
| A8  | Customers identify themselves with an email and password.                                                                 | From the data model     |
| A9  | Promotion and loyalty rules (code format, discount type, points per amount) are set by the team.                          | Pending D-01            |
| A10 | Current mainstream browsers are supported; an exact version list is set by the team.                                      | Pending D-01            |

## 5. Constraints

| #   | Constraint                                                                                                                       | Source                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| K1  | Frontend must be Next.js, backend NestJS, database PostgreSQL; these may not be replaced.                                        | Assignments 1 and 2      |
| K2  | The stack must run locally with Docker Compose.                                                                                  | Assignments 1 and 2      |
| K3  | API responses under 500 ms with sample data.                                                                                     | Assignment 1             |
| K4  | Passwords hashed with bcrypt; API protected by JWT; all inputs validated.                                                        | Assignment 1             |
| K5  | Required tests: invalid state transitions blocked, same Idempotency-Key gives one effect, concurrent orders do not exceed stock. | Assignment 1, Task 10    |
| K6  | Assignment 2 tasks are accepted in order; later tasks count only if earlier artifacts are in the repository with clear history.  | Assignment 2             |
| K7  | A production URL over HTTPS must be reachable at grading; otherwise the deployment part of Assignment 2 Task 5 does not count.   | Assignment 2             |
| K8  | Secrets must not appear in the repository or CI logs; the production database must not be public.                                | Assignment 2             |
| K9  | The team has five members and a fixed academic schedule (Sprint 1, Sprint 2, delivery).                                          | Brief                    |
| K10 | Every task must meet the Definition of Done.                                                                                     | Assignment 1, section 10 |

## 6. Initial risks

| #   | Risk                                                                        | Impact                                   | Mitigation                                                                                                |
| --- | --------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| R1  | The payment approach is unclear and a QR screenshot cannot confirm payment. | Payment flow cannot be tested end to end | Use a mock provider behind a `PaymentProvider` interface; see [payment plan](../plans/05-payment-plan.md) |
| R2  | Key decisions (ORM, hosting, pricing, stock, cancel policy) are delayed.    | Blocks diagrams, schema, and deployment  | Hold the decision meeting first (D-01) and record ADRs                                                    |
| R3  | Production deployment fails or is unavailable at grading.                   | Loses the deployment marks               | Choose the platform early (S-06); rehearse deployment and rollback (S-09)                                 |
| R4  | Concurrency or idempotency bugs appear late.                                | Task 10 tests fail                       | Build them in the payment and stock phase with tests alongside                                            |
| R5  | Documents and diagrams contradict each other.                               | Fails the consistency criterion          | Run the consistency review (D-13); change documents only through pull requests                            |
| R6  | Work is uneven across five people or a teammate is unavailable.             | Delays the critical path                 | Assign critical-path tasks first; keep the board current                                                  |
| R7  | Local setup differs between machines (Windows, Docker, ports).              | Demo and handover problems               | Use Docker Compose; document steps in the README; test a clean clone (T-11)                               |
| R8  | A free hosting tier is slow or sleeps.                                      | May break the 500 ms target and the demo | Check platform limits; warm the service before the demo                                                   |
| R9  | Scope grows beyond the MVP.                                                 | Missed deadlines                         | Keep extension items in the backlog, not the sprint                                                       |

## 7. Open items

Decisions that change this document are tracked in the [decision checklist](../plans/01-documentation-plan.md#3-decision-checklist-d-01). When they are settled, update the **(pending D-01)** rows above and the SRS.
