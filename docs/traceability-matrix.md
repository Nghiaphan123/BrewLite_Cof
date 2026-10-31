# BrewLite — Traceability matrix

**Status:** Assignment 2 rewrite. Evidence is what exists in this repository today.  
**Owner:** team  
**Related:** [SRS](requirements/srs.md), [UC-01](requirements/use-case-uc01-place-and-pay.md), [modeling notes](diagrams/task2-modeling.md), [ADR 0007](architecture/adr/0007-hosting-platform.md)

Columns follow the Assignment 2 template: requirement, use case, design, code or API, test. The status column is extra so a row is not read as "done in production" when it is not.

Status words:

| Status | Meaning |
| --- | --- |
| Covered | The named code and test exist in this repo. |
| Partial | Some of the requirement is implemented or tested. The gap is named. |
| Documented | The design exists. The code or the test does not. |
| Refused | The requirement is Won't. No code is expected. |
| Not run | The check needs a pipeline, a deploy, or a measurement that has not happened. |

No row claims a production URL, a CI run, or an end-to-end browser test. Those do not exist yet.

## 1. Functional requirements

| Requirement | Use case | Design | Code / API | Test | Status |
| --- | --- | --- | --- | --- | --- |
| FR-01 View menu | UC-MENU | [activity-order-flow.puml](diagrams/activity-order-flow.puml), [use-case-system.puml](diagrams/use-case-system.puml) | `GET /api/v1/products`. `apps/web/src/features/menu/menu-page.tsx` | `apps/api/test/products.e2e-spec.ts` | Partial. API list is tested. A browser test of loading, empty, and error is not in `tests/e2e/`. |
| FR-02 Product detail, size, toppings | UC-DETAIL | activity diagram, [ui-decisions.md](design/ui-decisions.md) | `GET /api/v1/products/:id`. `apps/web/src/app/products/[id]/page.tsx` | `products.e2e-spec.ts` covers the API, including 404. UI price update is not in an e2e test. | Partial |
| FR-03 Cart and total | UC-CART | activity diagram | `apps/web/src/store/cart.store.ts`, `apps/web/src/app/cart/page.tsx` | `apps/web/src/__tests__/unit/pricing-and-cart.spec.ts` | Covered for the cart rules that spec asserts. Persistence across reload is not required. |
| FR-04 Register, login, JWT | UC-AUTH | [api-contract.md](architecture/api-contract.md) §6–§7 | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`. `apps/api/src/modules/auth/` | `apps/api/test/auth.e2e-spec.ts` | Covered for the API cases in that file. |
| FR-05 Place order | UC-01 | [sequence-checkout.puml](diagrams/sequence-checkout.puml) | `POST /api/v1/orders`. `apps/api/src/modules/orders/` | Order creation is exercised by `payments.e2e-spec.ts` and `promotions.e2e-spec.ts` | Partial. Server total is the stored total. A dedicated tamper test file is not named here. |
| FR-06 Mock Wallet / Card payment | UC-01 | sequence diagram, [ADR 0004](architecture/adr/0004-payment-mock-and-order-lifecycle.md) | `POST /api/v1/payments`. Methods `WALLET` and `CARD`. `apps/api/src/modules/payments/` | `payments.e2e-spec.ts` includes `PAYMENT_FAILED`. `apps/web/src/__tests__/integration/frontend-api-flow.spec.tsx` covers the checkout client. | Partial. Success and failure are tested at the API. A Playwright journey from menu to confirmation does not exist. |
| FR-07 Confirmation and history | UC-TRACK | activity diagram, ADR 0004 D3 | `GET /api/v1/orders/me`, `GET /api/v1/orders/:code`. UI: `apps/web/src/app/orders/[id]/page.tsx` | `orders-read.e2e-spec.ts` | Partial. API owner-scope is tested. The running confirmation route is `/orders/[id]`, not `/orders/[code]/confirmation`. |
| FR-08 Order status, illegal transition rejected | UC-TRACK | [class-domain.puml](diagrams/class-domain.puml) `OrderStatus` | `apps/api/src/modules/orders/order-state-machine.ts` | `order-state-machine.spec.ts`, `order-state-machine.e2e-spec.ts` | Covered |
| FR-09 Validate input on both sides | UC-01 | API contract, DTOs under `apps/api/src/modules/**/dto/` | class-validator on the API. Client forms use required fields. | Auth, payment, and promotion e2e tests cover several 400 responses. | Partial. There is no single test that walks every malformed field. |
| FR-10 Idempotent payment | UC-01 | sequence diagram, ADR 0004 D4 | `Payment.idempotencyKey`, `requestHash` | `payments.e2e-spec.ts`: same key and body, same key and different body | Covered |
| FR-11 No oversell | UC-01 | sequence diagram, ADR 0004 D1 | `Product.stock`, `Product.version`. Stock moves at `PAID`. | `orders-concurrent-stock.e2e-spec.ts` | Covered |
| FR-12 Promotion | UC-01 A2 | class diagram `Promotion` | `POST /api/v1/promotions/validate`, promo on `POST /api/v1/orders` | `promotions.e2e-spec.ts` | Covered for the cases in that file. Priority is Should. |
| FR-13 Loyalty accrual | UC-01 | class diagram `LoyaltyTransaction` <<planned>> | `loyaltyPointsFor` in `apps/api/src/modules/payments/loyalty.ts`. Points field on `User`. | `loyalty.spec.ts` tests the formula only. | Partial. The formula is tested. The `LoyaltyTransaction` table is not in `schema.prisma`. |
| FR-14 Retry a failed payment on the same order | UC-01 A3 | state machine `PAYMENT_FAILED → PAID` | `order-state-machine.ts` | `order-state-machine.spec.ts` allows the edge. | Partial. The legal edge is unit-tested. An API test that pays again and keeps one order is not cited here. |
| FR-C1 Demo QR | not a payment step | checkout page note | `apps/web/src/app/checkout/page.tsx` | `frontend-api-flow.spec.tsx` | Could. Not required to pass FR-06. |
| FR-W1 Real bank or VietQR | none | context-and-scope §4 | none | none | Refused |
| FR-W2 Staff or manager screens | none | context-and-scope §4 | none | none | Refused |
| FR-W3 Delivery, multi-store, notifications, admin catalog, point redemption | none | context-and-scope §4 | none | none | Refused |
| FR-W4 Guest checkout of a paid order | none | UC-01 E2 | orders require JWT | `auth.e2e-spec.ts` unauthenticated payment is 401 | Refused |

## 2. Non-functional requirements

| Requirement | Use case | Design | Code / API | Test | Status |
| --- | --- | --- | --- | --- | --- |
| NFR-01 Response under 500 ms on seed data | UC-MENU, UC-01 | [overview.md](architecture/overview.md) | `GET /api/v1/products`, `POST /api/v1/orders` | none | Not run. No measurement is stored. |
| NFR-02 Secrets, hash, JWT, owner scope | UC-AUTH, UC-01 | ADR 0005, ADR 0007 | bcrypt hash, JWT guard, owner-scoped order reads. `.env` is gitignored. | `auth.e2e-spec.ts`, `orders-read.e2e-spec.ts` | Partial. CI logs cannot be checked because there is no workflow yet. |
| NFR-03 Phone layout, loading, empty, error, status text | UC-MENU, UC-TRACK | ui-decisions.md | menu, cart, checkout, orders pages | no viewport test | Partial. Layout is mobile-first in the pages. A 390 px check is not automated. |
| NFR-04 PWA manifest and service worker | none yet | overview.md §2 | no `manifest.ts`, no `sw.js` | none | Documented. Not implemented. |
| NFR-05 Compose, health, CI, HTTPS, private database, rollback | deploy | [deployment-production.puml](diagrams/deployment-production.puml), [ADR 0007](architecture/adr/0007-hosting-platform.md), [deployment.md](deployment.md) | `docker-compose.yml`, both Dockerfiles. Health route is not implemented. No `.github/workflows`. | none in CI | Partial. Local Compose exists. Health, CI, and the production URL do not. |
| NFR-06 Integer VND, server price wins | UC-01 | ADR 0005, ui-decisions.md | Prisma `Int` money fields. Server recomputes the order total. | `pricing-and-cart.spec.ts` | Partial. The shared pricing fixture named in older docs is not the proof used here. The cart unit test is the current web proof. |
| NFR-07 Logs without secrets | operations | overview.md §5 | Nest default logging only. No logging interceptor. | none | Documented. Should, not yet built. |
| NFR-08 Diagrams match this SRS | UC-01 | activity, sequence, and class diagrams | docs only | review, not an automated test | Documented. `LoyaltyTransaction` is marked planned so the class diagram does not claim the table exists. |

## 3. Assignment 2 tasks

| Task | Design | Code / API | Test or evidence | Status |
| --- | --- | --- | --- | --- |
| 1 Requirements | `docs/requirements/context-and-scope.md`, `srs.md`, `use-case-uc01-place-and-pay.md`, use-case diagrams | none required | this matrix | Documented |
| 2 Modeling | `activity-order-flow`, `sequence-checkout`, `class-domain` | none required | this matrix | Documented |
| 3 Architecture | `docs/architecture/overview.md`, ADR 0007, `deployment-production` | none required | this matrix | Documented. Host is chosen. Services are not created. |
| 4 Sprint 1 and CI | menu and products API already exist | `GET /api/v1/products`, `GET /api/v1/products/:id` | [ci-evidence.md](delivery/ci-evidence.md) | Partial. Product API and menu exist. The CI workflow and the green/red run evidence do not. |
| 5 Sprint 2 and delivery | ADR 0007, deployment.md §9–§12 | order, payment, auth, Dockerfiles | no production URL. No Playwright spec. | Partial. See [release-notes.md](delivery/release-notes.md). |

## 4. How to update a row

Change the status in the same pull request as the code or the test. Do not mark NFR-05 Covered until `GET /api/v1/health` responds, a pull request has run the pipeline, and the README contains a URL that answers. Do not invent that URL in this file.
