# BrewLite — Software Requirements Specification (short)

**Status:** Assignment 2, Task 1.2  
**Owner:** team  
**Related:** [Context and scope](context-and-scope.md), [UC-01](use-case-uc01-place-and-pay.md), [system use-case diagram](../diagrams/use-case-system.puml), [API contract](../architecture/api-contract.md), [scenarios](scenarios.md)

This is the short SRS for Assignment 2. Each requirement has an id, a MoSCoW priority, and an acceptance check a test can fail. The system use-case diagram is `docs/diagrams/use-case-system.puml` (export: `use-case-system.svg`).

Priority words:

| Word | Meaning |
| --- | --- |
| Must | Required for Assignment 2 acceptance. |
| Should | Required for a complete counter flow if time allows after the Must set. Already part of the domain model. |
| Could | Useful, not graded as a missing feature if absent. |
| Won't | Refused for this assignment. See [context and scope](context-and-scope.md) §4. |

## 1. Functional requirements

| ID | Requirement | Priority | Use case | Acceptance criterion |
| --- | --- | --- | --- | --- |
| FR-01 | The customer can view the menu. | Must | UC-MENU | Given the API is up and the database is seeded, when the customer opens the menu, then the UI shows each drink's image, name, and price from `GET /api/v1/products`. An empty catalog shows an empty state, not a blank page. A failed request shows an error and a way to retry. |
| FR-02 | The customer can open one drink and choose size and toppings. | Must | UC-DETAIL | Given a known product id, when the customer opens the detail screen, then name, image, and base price are shown. Choosing `S`, `M`, or `L` and zero or more toppings changes the displayed line price before add-to-cart. An unknown id shows not found, not a server error page. |
| FR-03 | The customer can keep a cart and see the total. | Must | UC-CART | Given at least one line, when the customer changes quantity or removes a line, then the cart total equals the sum of line totals. Two lines with the same product, size, and topping set merge. An empty cart cannot start payment. |
| FR-04 | The customer can register, sign in, and call protected APIs with a JWT. | Must | UC-AUTH | Given a new email and a password of at least 6 characters, when the customer registers and signs in, then the API returns an access token and the password is stored only as a hash. A duplicate email is rejected. A wrong password and an unknown email return the same generic unauthorized response. `POST /api/v1/orders` without a valid token is rejected. |
| FR-05 | The customer can place an order from the cart. | Must | UC-01 | Given an authenticated customer and a non-empty valid cart, when the client calls `POST /api/v1/orders`, then the API creates one order with status `PENDING`, returns its id and code, and persists the server-computed total. A client-supplied price is ignored. An empty cart or an unknown product does not create an order. |
| FR-06 | The customer can pay a pending order with mock Wallet or mock Card. | Must | UC-01 | Given a `PENDING` order, when the client calls `POST /api/v1/payments` with method `WALLET` or `CARD` and the mock approves, then the order becomes `PAID`, stock decreases, and the response reports success. When the mock declines, the order becomes `PAYMENT_FAILED`, stock and points do not change, and the cart remains. |
| FR-07 | The customer can see confirmation and order history. | Must | UC-TRACK | Given a paid order, when payment succeeds, then the UI shows the order code and status `PAID`. `GET /api/v1/orders/me` returns only that customer's orders, newest first. Another customer's code returns the same not-found result as a missing code. |
| FR-08 | The system exposes a defined order status and rejects illegal changes. | Must | UC-TRACK | Given the states `PENDING`, `PAID`, `PAYMENT_FAILED`, `PREPARING`, `READY`, `COMPLETED`, and `CANCELLED`, when a client requests a transition that is not allowed, then the API rejects it and the stored status does not change. `COMPLETED` and `CANCELLED` are terminal. |
| FR-09 | The system validates input on the client and the server. | Must | UC-01 | Given a malformed body (bad size, missing fields, non-integer money), when it is submitted, then the UI blocks or explains the error and the API returns a validation error, not an unhandled exception. |
| FR-10 | Repeating the same payment request does not charge twice. | Must | UC-01 | Given one `Idempotency-Key` and the same payment body, when `POST /api/v1/payments` is sent twice, then exactly one payment is stored and both responses refer to that payment. The same key with a different body is rejected and creates nothing new. |
| FR-11 | Concurrent paid orders cannot oversell a drink. | Must | UC-01 | Given a product with stock N, when more than N payments for that product succeed concurrently, then successful paid quantity does not exceed N and stock does not become negative. The losing request fails with an out-of-stock result. |
| FR-12 | A valid promotion code reduces the order total. | Should | UC-01 | Given a code that is active, in date, and above the minimum total, when the order is created, then the discount is applied once and the stored total is subtotal minus discount. An expired, unknown, or inapplicable code does not change the total and returns a specific error. |
| FR-13 | Loyalty points accrue when an order is paid. | Should | UC-01 | Given a successful payment, when the order becomes `PAID`, then the customer's point balance increases by `floor(total / 1000)` and a loyalty transaction records the change. A failed payment adds no points. Points cannot be redeemed. |
| FR-14 | The customer can retry a failed payment on the same order. | Should | UC-01 | Given an order in `PAYMENT_FAILED`, when the customer pays again with a new idempotency key and the mock approves, then that same order becomes `PAID`. A second order is not created. |

### 1.1 Won't (functional)

These are not missing features. They are refused.

| ID | Won't | Priority |
| --- | --- | --- |
| FR-W1 | Real bank, card network, or VietQR payment. | Won't |
| FR-W2 | Counter-staff screens and full manager/back-office functionality. A limited admin extension may exist but is not part of the required customer MVP. | Won't |
| FR-W3 | Delivery, multi-store, notifications, admin catalog, loyalty redemption. | Won't |
| FR-W4 | Guest checkout of a paid order. | Won't |

A demo QR image that encodes the order id and amount is **Could** (FR-C1). Scanning it must not be required to complete FR-06. Confirming payment remains an explicit action against the mock provider.

The repository includes a limited role-protected admin extension for topping stock, promotions, read-only user listing, and order status. This is additional implementation, not a change to the graded customer-MVP scope or evidence of a complete back office.

## 2. Non-functional requirements

| ID | Requirement | Priority | Acceptance criterion |
| --- | --- | --- | --- |
| NFR-01 | Menu and order calls are fast enough on seed data. | Must | On the seeded catalog, `GET /api/v1/products` and a valid `POST /api/v1/orders` return in under 500 ms, measured locally or in Docker, excluding cold start. |
| NFR-02 | Credentials, orders, and secrets are protected. | Must | Passwords are hashed. Protected routes require a valid JWT. Order reads are owner-scoped. `.env` is not committed. CI logs do not print `JWT_SECRET` or database passwords. Auth failures do not reveal whether the email exists. |
| NFR-03 | The customer UI is usable on a phone. | Must | The menu, detail, cart, checkout, and confirmation layouts are usable at a 390 px width without horizontal scrolling of the main task. Each of those screens has a loading, empty, and error state where data can be missing. Status is text plus color, not color alone. |
| NFR-04 | The app is a mobile-first PWA. | Must | The web app serves a web app manifest and icons, and registers a service worker so a browser can offer installation. Ordering still requires the network. |
| NFR-05 | The stack can be run, checked, and deployed. | Must | `docker compose up` starts web, API, and PostgreSQL. `GET /api/v1/health` returns success when the API process is up. Migrations and seed are repeatable. A pull request runs install, lint, unit test, and build, and cannot merge if one fails. Production is HTTPS. The database is not publicly reachable. Rollback is written in the README. |
| NFR-06 | Money and prices stay consistent. | Must | Every money field is an integer number of VND. The server total is the one stored and charged. The web display total and the API total agree on the shared pricing fixture. |
| NFR-07 | Failures are logged without leaking secrets. | Should | API errors are logged with a request id and status. Logs do not include passwords, tokens, or raw card data. There is no card data to log, because payment is mocked. |
| NFR-08 | The documented diagrams match this SRS. | Must | The activity, sequence, and class diagrams do not invent a flow or a class that this SRS marks Won't, and they include every Must class and the UC-01 success and failure branches. |

## 3. System use-case diagram

The overview diagram required by Task 1.2 is:

- source: [docs/diagrams/use-case-system.puml](../diagrams/use-case-system.puml)
- export: [docs/diagrams/use-case-system.svg](../diagrams/use-case-system.svg)

Actors on that diagram are the customer and the mock payment provider. Counter staff, the store manager, the lecturer, and the development team are stakeholders in [context and scope](context-and-scope.md). They are not drawn as actors, because they do not operate a use case in this MVP.

UC-01 is specified in [use-case-uc01-place-and-pay.md](use-case-uc01-place-and-pay.md). Its diagram is `docs/diagrams/use-case-checkout.puml`.

## 4. Requirement index by assignment group

| Assignment 2 group | IDs |
| --- | --- |
| Menu | FR-01 |
| Product detail | FR-02 |
| Cart | FR-03 |
| Auth | FR-04 |
| Place order | FR-05, FR-09, FR-12 |
| Payment | FR-06, FR-10, FR-14 |
| History | FR-07 |
| Order status | FR-08 |
| Performance | NFR-01 |
| Security | NFR-02, NFR-06 |
| Usability | NFR-03, NFR-04 |
| Deployability | NFR-05, NFR-07 |

## 5. How to use this SRS

A test, a diagram, or a pull request names the id it proves (`FR-06`, `NFR-05`). If an implementation disagrees with a Must criterion, the implementation is wrong unless this file is changed in the same pull request with a reason. Won't items are not backlog debt.
