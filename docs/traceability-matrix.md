# BrewLite - Requirements Traceability Matrix

This matrix connects assignment requirements to backlog tasks, implementation areas, API surface, and verification evidence. File paths are proposed locations for implementation; update them when code is created.

| Requirement ID | Requirement summary                                         | Backlog task | Architecture area                                 | API / UI                                  | Verification evidence                                                                                                                                                    |
| -------------- | ----------------------------------------------------------- | -----------: | ------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR-01          | Browse menu; products include image, name, price            |         2, 3 | Products module; menu page                        | `GET /products`; Menu                     | API response; menu render; loading/empty states                                                                                                                          |
| FR-02          | Product detail, size/topping options, price updates         |            4 | Product detail UI; pricing rules                  | `GET /products/:id`; Detail               | UI acceptance check for options and recalculated price                                                                                                                   |
| FR-03          | Cart add/edit/remove, count, total                          |            5 | Frontend cart state                               | Cart UI                                   | Flow checks for quantities, removal, count, total                                                                                                                        |
| FR-04          | Register/login with bcrypt and JWT                          |            7 | Auth module                                       | `POST /auth/register`, `POST /auth/login` | Auth checks; stored value is bcrypt hash; JWT issued                                                                                                                     |
| FR-05          | Validated order creation starts PENDING                     |            6 | Orders module; persistence                        | `POST /orders`                            | Integration check: valid order persists as `PENDING`; invalid input rejected                                                                                             |
| FR-06          | Cashless wallet/card mock payment; success/failure behavior |            8 | Payments module; mock gateway                     | `POST /payments`                          | Success => `PAID`; failure => `PAYMENT_FAILED`; cart retained on failure                                                                                                 |
| FR-07          | Show order confirmation with identifier and status          |            9 | Confirmation page                                 | Payment response / confirmation UI        | End-to-end demo asserts identifier and status visible                                                                                                                    |
| FR-08          | Current user's order history                                |            9 | Orders module; JWT guard                          | `GET /orders/me`                          | Authenticated history check; other users' orders excluded                                                                                                                |
| FR-09          | Enforce legal order transitions                             |           10 | Order domain state machine                        | Internal domain operation                 | Unit/integration tests reject illegal transitions (including cancel from `PREPARING`/`READY`) and allow the legal path and cancel from `PENDING`/`PAYMENT_FAILED`/`PAID` |
| FR-10          | Same idempotency key has one payment effect                 |           10 | Payments module; unique DB constraint             | `POST /payments` + `Idempotency-Key`      | Integration test sends same key twice and observes one effect                                                                                                            |
| FR-11          | Concurrent orders cannot oversell stock                     |           10 | Orders module; transaction and optimistic locking | `POST /orders`                            | Concurrent integration test proves stock never negative/oversold; cancel restores held stock exactly once                                                                |
| FR-12          | Promotion and loyalty points                                |           10 | Promotion/loyalty domain rules                    | Order/payment flow                        | Valid promotion applied; paid order credits points once (policy to define)                                                                                               |
| NFR-01         | API responds < 500 ms on sample data                        |         1-10 | Backend/API and DB                                | API endpoints                             | Timed check with documented sample data and environment                                                                                                                  |
| NFR-02         | Hash passwords                                              |            7 | Auth module                                       | Register/login                            | Persistence check verifies bcrypt hash, not plaintext                                                                                                                    |
| NFR-03         | JWT protects user-specific routes                           |         7, 9 | Auth guard                                        | Orders and payments APIs                  | Unauthenticated request rejected; cross-user access denied                                                                                                               |
| NFR-04         | Validate input                                              |         1-10 | DTO validation                                    | All write endpoints                       | Invalid DTO test cases receive client errors                                                                                                                             |
| NFR-05         | Support mainstream browsers                                 |     3-5, 8-9 | Next.js UI                                        | Browser app                               | Manual smoke test on agreed browser/version matrix                                                                                                                       |
| NFR-06         | Compose stack and handover instructions                     |         1, 9 | Deployment                                        | Docker Compose, README                    | Clean-start runbook followed successfully                                                                                                                                |
| NFR-07         | Loading, empty, and basic error UI states                   |       3, 8-9 | Frontend pages                                    | Menu, checkout, history                   | UI checks/manual demo for applicable states                                                                                                                              |

## Backlog task coverage

| Task | Covered requirements                                     |
| ---: | -------------------------------------------------------- |
|    1 | NFR-06 (project foundation, README, `.env.example`, Git) |
|    2 | FR-01 (API)                                              |
|    3 | FR-01, NFR-07 (menu UI)                                  |
|    4 | FR-02                                                    |
|    5 | FR-03                                                    |
|    6 | FR-05, NFR-04                                            |
|    7 | FR-04, NFR-02, NFR-03                                    |
|    8 | FR-06, FR-10, NFR-07                                     |
|    9 | FR-07, FR-08, NFR-05, NFR-06                             |
|   10 | FR-09, FR-10, FR-11, FR-12                               |

## Gaps and assumptions to resolve

- Promotion and loyalty rules have no numeric acceptance policy in the assignment; agree on values before FR-12 implementation.
- Menu customization pricing and stock granularity need concrete rules.
- The <500 ms goal needs a defined request mix, data volume, and measurement environment.
- Browser versions, cancel trigger and refund handling, and the payment retry-expiry window need a team decision.