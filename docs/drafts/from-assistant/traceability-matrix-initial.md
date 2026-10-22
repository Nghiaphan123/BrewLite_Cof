# BrewLite - Requirements Traceability Matrix

**Status:** Working skeleton for Assignment 2 format. Requirement IDs are from [Requirements](requirements.md); use-case and test IDs are proposed in [T-01 Test Strategy](testing/test-strategy.md). Design/code references are conceptual until implementation files exist.

| Requirement | Use-case / User Story | Design / Diagram | Code / API | Test |
|---|---|---|---|---|
| FR-01 Browse menu | UC-01 / US-01 | D-07 activity; D-08 sequence; D-09 class model | `GET /products`; `GET /products/:id`; menu page | TST-PROD-01, TST-PROD-02 |
| FR-02 Customize product | UC-01 / US-02 | D-07 activity; D-09 class model | `GET /products/:id`; product detail UI | TST-DETAIL-01 |
| FR-03 Manage cart | UC-01 / US-03 | D-07 activity | Cart state and cart UI | TST-CART-01 |
| FR-04 Register and sign in | UC-01 / US-04 | D-07 activity; D-08 sequence; D-10 architecture | `POST /auth/register`; `POST /auth/login`; JWT guard | TST-AUTH-01, TST-AUTH-02 |
| FR-05 Create order | UC-01 / US-05 | D-07 activity; D-08 sequence; D-09 class model | `POST /orders` | TST-ORDER-01, TST-ORDER-02 |
| FR-06 Cashless payment | UC-01 / US-06 | D-07 activity; D-08 sequence; D-10 architecture | `POST /payments`; mock provider | TST-PAY-01, TST-PAY-02, TST-E2E-02 |
| FR-07 Confirm order | UC-01 / US-07 | D-07 activity; D-08 sequence | Payment result; confirmation page | TST-PAY-01, TST-E2E-01 |
| FR-08 View order history | UC-02 / US-08 | D-08 sequence; D-09 class model | `GET /orders/me` | TST-HISTORY-01, TST-E2E-02 |
| FR-09 Enforce order state machine | UC-03 / US-09 | D-08 sequence; D-09 class model; D-10 architecture | Order domain transition service; internal transition operation (route TBD) | TST-STATE-01 |
| FR-10 Idempotent payment | UC-01 / US-06 | D-08 sequence; D-09 class model; D-10 architecture | `POST /payments` with `Idempotency-Key`; unique persistence constraint | TST-IDEM-01 |
| FR-11 Protect stock under concurrency | UC-01 / US-05 | D-08 sequence; D-09 class model; D-10 architecture | `POST /orders`; transactional stock service | TST-ORDER-02, TST-STOCK-01 |
| FR-12 Promotion and loyalty | UC-01 / US-05, US-06 | D-09 class model; D-10 architecture | Promotion validation; payment/loyalty service | TST-PROMO-01, TST-LOYALTY-01 |
| NFR-01 API performance | All API use cases | D-10 architecture | API endpoints | Performance protocol in T-01; test ID TBD |
| NFR-02 Password security | UC-01 / US-04 | D-10 architecture | Auth service and User persistence | TST-AUTH-01 |
| NFR-03 JWT access control | UC-01, UC-02, UC-03 | D-08 sequence; D-10 architecture | JWT guard on protected APIs | TST-AUTH-02, TST-HISTORY-01 |
| NFR-04 Input validation | UC-01 / US-05, US-06 | D-08 sequence | DTO validation on write endpoints | TST-ORDER-02; payment validation ID TBD |
| NFR-05 Browser support | UC-01, UC-02 | D-07 activity | Next.js responsive UI | Browser matrix and smoke test ID TBD |
| NFR-06 Deployability / handover | Deployment use case TBD | D-10 architecture; D-12 production deployment | Docker Compose, migrations, health route, README/CI | TST-HEALTH-01, TST-MIG-01, TST-SEED-01 |
| NFR-07 UI resilience | UC-01 / US-01, US-06 | D-07 activity | Menu, checkout and history UI states | TST-PROD-02; checkout error test ID TBD |

## Reference key

- **UC-01:** Place and pay for an order (proposed; full specification should live under `docs/requirements/`).
- **UC-02:** View order history (proposed).
- **UC-03:** Advance an order through internal preparation states for the backend state-machine exercise (proposed; not a customer MVP use case).
- **D-07:** Activity diagram; **D-08:** sequence diagram; **D-09:** class/data model; **D-10:** architecture description; **D-12:** production deployment diagram. These IDs follow the shared planning conversation and need alignment with the actual document index.
- **TST-*** IDs are defined in [T-01 Test Strategy](testing/test-strategy.md). A test ID marked TBD is a known coverage gap, not evidence of a passing test.

## Update rules

1. Add each approved functional/non-functional requirement from the final SRS as a row.
2. Replace proposed UC/diagram IDs with the final IDs and links when their documents exist.
3. Replace conceptual code/API mappings with actual source paths, methods, routes, and DTOs after implementation.
4. Keep planned test IDs here; record execution status/results separately in CI or a test evidence log.
5. Review this matrix whenever a requirement, use case, design, API, or test changes.
