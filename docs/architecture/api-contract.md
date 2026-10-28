# BrewLite - API Contract

**Status:** Phase 1 deliverable  
**Owner:** H.Tài (Task 7.0)  
**Related:** [ADR 0005 (conventions)](adr/0005-api-contract-conventions.md), [ADR 0004 (payment/lifecycle)](adr/0004-payment-mock-and-order-lifecycle.md), [ADR 0003 (database)](adr/0003-database-postgres-prisma.md), [Scenarios](../requirements/scenarios.md), [Product Backlog](../requirements/product-backlog.md), [Configuration](../config.md), [UI Decisions](../design/ui-decisions.md), [Wireframes](../design/wireframes.md)

This document specifies every HTTP endpoint in the BrewLite MVP. It is the contract between `apps/api` and `apps/web`: the API implements it, the web client consumes it, and the e2e tests in `scenarios.md` §12 assert it. Endpoints not listed here are not part of the MVP.

> **Conventions live in [ADR 0005](adr/0005-api-contract-conventions.md).** This doc does not restate C1–C10; it cites them. If a rule here conflicts with an ADR, the ADR wins and this doc is wrong.

## 1. Scope and base URL

- **Base path:** `/api/v1` (C1). Every endpoint below is relative to it.
- **Base URL in dev:** `http://localhost:3001/api/v1` (the API port; see `config.md` §1.2). The frontend reads `NEXT_PUBLIC_API_URL` which includes `/api/v1`.
- **Content type:** `application/json` for all request and response bodies, except `204`.
- **Character encoding:** UTF-8. Vietnamese text in responses is UTF-8, not HTML-escaped.
- **Auth:** `Authorization: Bearer <jwt>` on protected routes (C4). Public routes are noted per endpoint.

Endpoints in the assignment (PDF §12.1): `GET /products`, `GET /products/:id`, `POST /auth/register`, `POST /auth/login`, `POST /orders`, `POST /payments`, `GET /orders/me`. Plus `GET /orders/:code` (needed by the confirmation screen, `wireframes.md` §8) and `GET /health` (used by `setup.md` §8). Task 10 adds promo/loyalty endpoints (not in Phase 1 endpoints below; listed in §9 as reserved).

## 2. Endpoint summary

| Method | Path             | Auth    | Success                                        | Reference |
| ------ | ---------------- | ------- | ---------------------------------------------- | --------- |
| `GET`  | `/health`        | Public  | `200 { status, version }`                      | §3        |
| `GET`  | `/products`      | Public  | `200 { items, total }`                         | §4        |
| `GET`  | `/products/:id`  | Public  | `200 Product` / `404`                          | §5        |
| `POST` | `/auth/register` | Public  | `201 { user }` / `409`                         | §6        |
| `POST` | `/auth/login`    | Public  | `200 { accessToken, expiresIn, user }` / `401` | §7        |
| `GET`  | `/auth/me`       | **JWT** | `200 UserProfile` / `401`                      | §7.1      |
| `PATCH`| `/auth/password` | **JWT** | `200 { message }` / `400` / `401`              | §7.2      |
| `POST` | `/orders`        | **JWT** | `201 Order` / `400` / `401`                    | §8        |
| `POST` | `/payments`      | **JWT** | `200 PaymentResult` / `400` / `401` / `409`    | §9        |
| `GET`  | `/orders/me`     | **JWT** | `200 { items, total }` / `401`                 | §10       |
| `GET`  | `/orders/:code`  | **JWT** | `200 Order` / `404`                            | §11       |

`/health`, `GET /products`, `GET /products/:id`, `POST /auth/register`, and `POST /auth/login` are public. User profile and password changes, orders, and payments require JWT.

## 3. `GET /api/v1/health`

**Auth:** Public.  
**Purpose:** liveness and version check (`setup.md` §8).

**Response `200`:**
```json
{ "status": "ok", "version": "v1" }
```

No other responses. Not cached; no rate limit in Phase 1.

## 4. `GET /api/v1/products`

**Auth:** Public.  
**Purpose:** menu list (`scenarios.md` S-MAIN-1 step 1; `product-backlog.md` Task 2/3).  
**Query params:** none in Phase 1. Pagination is reserved (C9) but not implemented.

**Response `200` (C2 collection):**
```json
{
  "items": [
    {
      "id": "0f8fad5b-d9cb-469f-a165-70867728950e",
      "name": "Cà phê sữa",
      "price": 35000,
      "imageUrl": "https://cdn.example.com/ca-phe-sua.jpg",
      "stock": 20
    },
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "name": "Americano",
      "price": 40000,
      "imageUrl": "https://cdn.example.com/americano.jpg",
      "stock": 15
    }
  ],
  "total": 2
}
```

**Rules:**
- `price` and `stock` are integers (`config.md` §3; C7).
- `total` is the array length in Phase 1 (C9).
- Order of items is stable (by `name` asc, or by a `sortOrder` column if added in Task 1.0's ERD). The frontend does not re-sort.
- Empty menu returns `{ "items": [], "total": 0 }` with `200`, not `404`. The UI shows the empty state (`wireframes.md` §4).
- `imageUrl` is absolute; the frontend renders it directly. Product photos are stored in `apps/web/public/images/products/` as `1.jpg` through `30.jpg`. In `apps/api/prisma/seed.ts`, each seeded product uses `/images/products/<n>.jpg`, where `<n>` is its 1-based position in the `products` array. Keep the seed order and filenames aligned when adding or reordering products.

**Errors:** none expected for a valid request. A DB failure returns `500` (C3) with `requestId` (C10).

## 5. `GET /api/v1/products/:id`

**Auth:** Public.  
**Purpose:** product detail (`scenarios.md` S-MAIN-1 step 2; `product-backlog.md` Task 4).

**Path param:** `id` — the product UUID. Must be a valid UUID; a malformed id returns `404` (not `400`) to avoid leaking id-format information.

**Response `200` (C2 single resource):**
```json
{
  "id": "0f8fad5b-d9cb-469f-a165-70867728950e",
  "name": "Cà phê sữa",
  "price": 35000,
  "imageUrl": "https://cdn.example.com/ca-phe-sua.jpg",
  "stock": 20,
  "sizes": ["S", "M", "L"],
  "toppings": [
    { "id": "t1", "name": "Trân châu", "price": 5000 },
    { "id": "t2", "name": "Kem", "price": 7000 }
  ]
}
```

**Rules:**
- `sizes` and `toppings` are returned here, not on the list endpoint, to keep the menu response small. The detail page uses them to render the selector (`wireframes.md` §5).
- The base `price` is the **S** size price. Size-specific prices are computed by the pricing rule (`ui-decisions.md` §4.2), not returned as a table. If the team later wants a size-price table, add `sizePrices: { S: 35000, M: 40000, L: 45000 }` — non-breaking additive.
- `toppings` is the full catalogue; a product may restrict toppings later (Phase 2+). In Phase 1 all products accept all toppings.

**Response `404` (C3):**
```json
{ "statusCode": 404, "error": "Not Found", "message": "Product not found", "code": "PRODUCT_NOT_FOUND" }
```

**Errors:** `404` for unknown id; `500` for DB failure. Malformed UUID → `404` (see above).

## 6. `POST /api/v1/auth/register`

**Auth:** Public.  
**Purpose:** create an account (`scenarios.md` S-AUTH-1, S-AUTH-2; `product-backlog.md` Task 7).

**Request body:**
```json
{ "name": "An Nguyen", "email": "an@example.com", "password": "correct-horse-battery" }
```

**Validation (`class-validator`):**
- `name`: 2–80 characters after trimming.
- `email`: valid email format, normalized to lowercase before storage.
- `password`: ≥ 8 chars, at least one letter and one digit. The same rule is enforced client-side (`wireframes.md` §10); if one changes, both change.

**Response `201`:**
```json
{
  "user": { "id": "a3f1...", "name": "An Nguyen", "email": "an@example.com", "loyaltyPoints": 0 }
}
```

No token is returned here. The client calls `POST /auth/login` after register (`scenarios.md` S-AUTH-1 step 3). Auto-login on register is not part of the contract; if the team adds it, it returns the same body as `/auth/login` and this section is updated.

**Response `400` (C3):**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "email must be an email" },
    { "field": "password", "message": "password must be at least 8 characters" }
  ]
}
```

**Response `409` (C3):**
```json
{ "statusCode": 409, "error": "Conflict", "message": "Email already registered", "code": "EMAIL_TAKEN" }
```

**Rules:**
- Password is bcrypt-hashed with `BCRYPT_ROUNDS` (`config.md` §2.1). The hash never appears in any response.
- Duplicate email returns `409`, never `200` with a "user exists" body (no account enumeration beyond the explicit email the requester already knows).
- `loyaltyPoints` starts at `0`.

## 7. `POST /api/v1/auth/login`

**Auth:** Public.  
**Purpose:** authenticate and receive a JWT (`scenarios.md` S-AUTH-1, S-AUTH-3; `product-backlog.md` Task 7).

**Request body:**
```json
{ "email": "an@example.com", "password": "correct-horse-battery" }
```

**Response `200`:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "user": { "id": "a3f1...", "name": "An Nguyen", "email": "an@example.com", "loyaltyPoints": 12 }
}
```

**Rules:**
- `expiresIn` is seconds, matching `JWT_EXPIRES_IN=1d` (`config.md` §2.1). The frontend may use it to warn before expiry; Phase 1 does not refresh.
- The JWT payload contains `sub` (user id), `email`, and `iat`/`exp`. It does **not** contain `loyaltyPoints` (that would go stale); the frontend fetches the user via a future `GET /auth/me` if needed. Phase 1 reads `loyaltyPoints` from login/register responses only.

**Response `401` (C3):**
```json
{ "statusCode": 401, "error": "Unauthorized", "message": "Invalid credentials", "code": "AUTH_INVALID" }
```

## 7.1. `GET /api/v1/auth/me`

**Auth:** JWT. Returns only the authenticated user's profile; the password hash is never selected.

**Response `200`:**
```json
{
  "id": "a3f1...",
  "name": "An Nguyen",
  "email": "an@example.com",
  "loyaltyPoints": 12,
  "createdAt": "2026-01-15T00:00:00.000Z"
}
```

## 7.2. `PATCH /api/v1/auth/password`

**Auth:** JWT.

**Request body:**
```json
{ "currentPassword": "correct-horse-battery", "newPassword": "another-correct-password" }
```

The current password must be verified before storing a bcrypt hash of the new password. The new password must be at least 8 characters and contain a letter and a digit. An incorrect current password returns `401 CURRENT_PASSWORD_INVALID`.

**Rules:**
- The `401` body is **identical** for "unknown email" and "wrong password" (`scenarios.md` S-AUTH-3). Do not return "email not found."
- No rate limiting in Phase 1; a Phase 2+ item.

## 8. `POST /api/v1/orders`

**Auth:** **JWT required** (C4). Missing or invalid token → `401` with `code: "AUTH_REQUIRED"` or `"AUTH_EXPIRED"`.  
**Purpose:** create a `PENDING` order from a cart (`scenarios.md` S-MAIN-1 step 8, S-ORD-1..3; `product-backlog.md` Task 6).

**Request body:**
```json
{
  "items": [
    { "productId": "0f8fad5b-...", "size": "M", "toppingIds": ["t1", "t2"], "qty": 2 },
    { "productId": "7c9e6679-...", "size": "S", "toppingIds": [], "qty": 1 }
  ]
}
```

**Validation (`class-validator`):**
- `items`: non-empty array; each item has `productId` (UUID), `size` (`S`|`M`|`L`), `toppingIds` (array of strings, possibly empty), `qty` (integer ≥ 1, ≤ 99).
- Unknown `productId` → `400` with `code: "PRODUCT_NOT_FOUND"` (specific, not a generic validation error).
- Unknown `toppingId` for a valid product → `400` with `code: "TOPPING_NOT_FOUND"`.
- `size` not in the product's `sizes` → `400` with `code: "INVALID_SIZE"`.

**Server behavior:**
- **Recomputes `total` and each `lineTotal` from the DB.** Client-supplied prices are ignored (`scenarios.md` S-ORD-1). The pricing rule is the shared fixture (`ui-decisions.md` §4.2).
- Creates `Order` with `status = "PENDING"`, `userId` from the JWT, `createdAt`, and `code` (D3). **Does not decrement stock** (ADR 0004 D1).
- Creates `OrderItem` rows with `productId`, `size`, `qty`, `lineTotal`, and the topping ids.
- Returns `201` with the order summary; the client then calls `POST /payments` (`scenarios.md` S-MAIN-1 step 8).

**Response `201`:**
```json
{
  "id": "8a1c...",
  "code": "BL-2026-0001",
  "status": "PENDING",
  "total": 95000,
  "items": [
    { "productId": "0f8fad5b-...", "name": "Cà phê sữa", "size": "M", "qty": 2, "lineTotal": 80000 },
    { "productId": "7c9e6679-...", "name": "Americano", "size": "S", "qty": 1, "lineTotal": 15000 }
  ],
  "createdAt": "2026-10-22T14:30:00.000Z"
}
```

**Rules:**
- The order `code` format is `BL-YYYY-NNNN` (year + zero-padded sequence per year). The sequence is server-generated, unique, immutable. Recorded here as the decision that closes ADR 0004's open question.
- `id` is a UUID, included for internal linking but **not** used in user-facing URLs (D3: confirmation route is keyed by `code`).
- Empty `items` → `400` with `code: "CART_EMPTY"` (`scenarios.md` S-ORD-2).
- The response includes `items` with `name` resolved for the confirmation screen; the client does not need a second call to render the confirmation summary.
- **No idempotency key here** (ADR 0004 D4). A double-submit creates two orders; this is a documented limitation (`scenarios.md` S-PAY-4), not a contract violation.

**Errors:**
- `400` validation (`code: "VALIDATION_FAILED"` with `details`).
- `400` `CART_EMPTY`, `PRODUCT_NOT_FOUND`, `TOPPING_NOT_FOUND`, `INVALID_SIZE`.
- `401` missing/expired JWT.
- `500` unexpected (C3, C10).

## 9. `POST /api/v1/payments`

**Auth:** **JWT required**. The order must belong to the caller; a cross-user order returns `404` (not `403`, to avoid leaking existence — `scenarios.md` S-ORD-4).  
**Purpose:** pay a `PENDING` or `PAYMENT_FAILED` order (`scenarios.md` S-MAIN-1 steps 8–9, S-PAY-1..6; `product-backlog.md` Task 8, Task 10b).

**Headers:**
- `Idempotency-Key: <uuid>` — **required** (C5, ADR 0004 D4). Missing → `400` with `code: "IDEMPOTENCY_KEY_REQUIRED"`.

**Request body:**
```json
{ "orderId": "8a1c...", "method": "WALLET" }
```

`method` ∈ `WALLET` | `CARD`. `orderId` is the DB `id` from `POST /orders` (not the `code`; the code is for URLs).

**Server behavior (ADR 0004):**
- Inside a `prisma.$transaction`:
  1. Look up the order; if not found or not owned by caller → `404`.
  2. Assert the current state is `PENDING` or `PAYMENT_FAILED`; otherwise `409` with `code: "INVALID_STATE_TRANSITION"` (Task 10a).
  3. Check stock for all items under optimistic lock (`version`); if insufficient → `409` with `code: "OUT_OF_STOCK"` (Task 10c).
  4. Call the mock gateway (`PAYMENT_MOCK_MODE`; `config.md` §2.1).
  5. On success: decrement stock, transition to `PAID`, accrue loyalty points (ADR 0004 D1, D7).
  6. On failure: transition to `PAYMENT_FAILED`, no stock change, no points.
  7. Store the `Payment` row with `idempotencyKey`, `requestHash`, `method`, `amount`, `status`.
- If the `idempotencyKey` already exists:
  - Same `requestHash` → return the stored response (same payment id, same order status).
  - Different `requestHash` → `409` with `code: "IDEMPOTENCY_CONFLICT"` (ADR 0004 D4; `scenarios.md` S-PAY-6).

**Response `200` (success):**
```json
{
  "orderId": "8a1c...",
  "orderCode": "BL-2026-0001",
  "status": "PAID",
  "paymentId": "p_9f2a...",
  "amount": 95000,
  "method": "WALLET",
  "paidAt": "2026-10-22T14:31:00.000Z",
  "loyaltyPointsEarned": 95,
  "userLoyaltyPoints": 107
}
```

**Response `200` (payment failed — ADR 0004 D2):**
```json
{
  "orderId": "8a1c...",
  "orderCode": "BL-2026-0001",
  "status": "PAYMENT_FAILED",
  "paymentId": "p_9f2b...",
  "reason": "MOCK_DECLINED",
  "retryable": true
}
```

**Rules:**
- Failure is `200` with `status: "PAYMENT_FAILED"`, not `402` (ADR 0004 D2). The frontend checks the body `status`, not `res.ok`.
- The order remains retrievable; the cart is preserved (`scenarios.md` S-PAY-2). The user retries with a **new** `Idempotency-Key` (ADR 0004 D5); the order goes `PAYMENT_FAILED → PAID` on success.
- `loyaltyPointsEarned` = `floor(amount / 1000)` (ADR 0004 D7). `userLoyaltyPoints` is the post-accrual total.
- A replay with the same key and same body returns the **same** response body (including `paymentId`), even if the original was a failure. Idempotency covers both outcomes, not just success.

**Errors:**
- `400` missing/invalid body, missing `Idempotency-Key` (`IDEMPOTENCY_KEY_REQUIRED`).
- `401` missing/expired JWT.
- `404` order not found or not owned (`ORDER_NOT_FOUND`).
- `409` `INVALID_STATE_TRANSITION`, `OUT_OF_STOCK`, `IDEMPOTENCY_CONFLICT`.
- `500` unexpected.

## 10. `GET /api/v1/orders/me`

**Auth:** **JWT required**.  
**Purpose:** order history (`scenarios.md` S-ORD-4; `product-backlog.md` Task 9; `wireframes.md` §11).

**Query params:** none in Phase 1. Pagination reserved (C9).

**Response `200` (C2 collection):**
```json
{
  "items": [
    {
      "id": "8a1c...",
      "code": "BL-2026-0001",
      "status": "PAID",
      "total": 95000,
      "createdAt": "2026-10-22T14:30:00.000Z"
    },
    {
      "id": "7b0d...",
      "code": "BL-2026-0000",
      "status": "PAYMENT_FAILED",
      "total": 45000,
      "createdAt": "2026-10-21T09:00:00.000Z"
    }
  ],
  "total": 2
}
```

**Rules:**
- Sorted by `createdAt` **descending** (newest first; `wireframes.md` §11). Server-side sort, not client-side.
- Only the caller's orders. Cross-user orders are absent, not `403`.
- `items` here are order summaries (no line items). The confirmation/detail screen (`GET /orders/:code`) returns the full order.
- Empty history returns `{ "items": [], "total": 0 }` with `200`; the UI shows the empty state.

**Errors:** `401` missing/expired JWT; `500` unexpected.

## 11. `GET /api/v1/orders/:code`

**Auth:** **JWT required**. Owner-scoped.  
**Purpose:** confirmation and order detail (`scenarios.md` S-MAIN-1 step 10, S-ORD-4; `wireframes.md` §8).

**Path param:** `code` — the human-readable order code (`BL-YYYY-NNNN`), not the UUID (ADR 0004 D3).

**Response `200`:**
```json
{
  "id": "8a1c...",
  "code": "BL-2026-0001",
  "status": "PAID",
  "total": 95000,
  "items": [
    { "productId": "0f8fad5b-...", "name": "Cà phê sữa", "size": "M", "qty": 2, "lineTotal": 80000 },
    { "productId": "7c9e6679-...", "name": "Americano", "size": "S", "qty": 1, "lineTotal": 15000 }
  ],
  "payment": {
    "method": "WALLET",
    "paidAt": "2026-10-22T14:31:00.000Z",
    "loyaltyPointsEarned": 95
  },
  "createdAt": "2026-10-22T14:30:00.000Z"
}
```

**Rules:**
- `payment` is `null` if the order has never had a successful payment (e.g. `PENDING` or all attempts `PAYMENT_FAILED`). The confirmation screen (`wireframes.md` §8) renders the status badge accordingly.
- The order code is the URL key; the `id` is included for internal linking but is not used in user-facing URLs.
- **Not found and not-yours both return `404`** with `code: "ORDER_NOT_FOUND"` (`scenarios.md` S-ORD-4 step 2). The UI shows the same safe message for both (`wireframes.md` §8).

**Errors:** `401` missing/expired JWT; `404` not found or not owned; `500` unexpected.

## 12. Reserved endpoints (Task 10, not Phase 1)

These are listed so the frontend and API agree on the shape before Task 10 adds them. They are **not** implemented in Phase 1 and are not part of Task 7.0's acceptance criteria.

| Method | Path                   | Purpose                  | Notes                                                                            |
| ------ | ---------------------- | ------------------------ | -------------------------------------------------------------------------------- |
| `POST` | `/orders/:code/cancel` | Cancel a `PENDING` order | ADR 0004 D6 says no auto-cancel; explicit cancel is a possible Phase 2 addition. |
| `POST` | `/orders/:id/transition` | Drive an order status transition (test enabler for graded test a) | Internal/test endpoint; auth JWT (currently a test fixture, see Task 7 gap); not part of the public MVP API. |
| `POST` | `/promotions/validate` | Validate a promo code    | Task 10d; `product-backlog.md` §13 10d.                                          |
| `GET`  | `/loyalty/me`          | Current points balance   | Task 10d; the login/register responses carry `loyaltyPoints` in Phase 1.         |

If any is added, it follows ADR 0005 conventions and is appended to this doc.

## 13. Cross-cutting behaviors

These are conventions from ADR 0005 that apply to every endpoint; listed here for convenience.

- **Error envelope:** C3. Every `4xx`/`5xx` body matches it.
- **Timestamps:** C6. ISO 8601 UTC with milliseconds.
- **Money:** C7. Integer VND.
- **Correlation id:** C10. Every response has `X-Request-Id`; `500` bodies include it.
- **No `{ data }` wrapper:** C2. Single resources are returned directly; collections are `{ items, total }`.
- **Auth:** C4. `Authorization: Bearer <jwt>`.
- **Idempotency:** C5. `Idempotency-Key` required for `POST /payments` only.

## 14. Frontend integration notes

- **Client:** `apps/web/src/lib/api.ts` has one `request<T>(path, init)` that sets the base URL, attaches the JWT when present, sets `Content-Type`, attaches `Idempotency-Key` for payments, and maps the C3 error envelope into a typed `ApiError`. Every feature calls this function; no feature calls `fetch` directly.
- **Payment handling:** because failure is `200 + status` (ADR 0004 D2), the payment handler checks `body.status === "PAID"` and not `res.ok`. This is the one place the "check `res.ok`" reflex is wrong.
- **Token storage:** `localStorage` under `brewlite.token` (`ui-decisions.md` §5.2). The client clears it on `401` `code: "AUTH_EXPIRED"` and redirects to `/auth/login`.
- **Base URL:** `NEXT_PUBLIC_API_URL` includes `/api/v1` (`config.md` §2.2). Do not append `/api/v1` in `api.ts`; the env var owns it.

## 15. Open items

| Item                                                                                                       | Owner | Closes when                               |
| ---------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------- |
| Confirm `GET /products` includes `sizes`/`toppings` on detail only, not list                               | Nghĩa | Task 2.0/4.0 `● Xong`                     |
| Confirm the `POST /orders` response includes resolved item `name`s (avoids a second call for confirmation) | H.Tài | Task 6.0 `● Xong`                         |
| Confirm the `BL-YYYY-NNNN` code sequence is per-year and server-generated                                  | Nghĩa | Task 1.0 ERD (sequence/unique constraint) |
| Confirm payment retry uses a new `Idempotency-Key` (ADR 0004 D5)                                           | H.Tài | Task 8.0 `● Xong`                         |
| Decide whether `GET /orders/me` paginates in Phase 1 (currently no)                                        | H.Tài | Sprint 3 Planning                         |
| Update `config.md` §7 (error envelope, `Idempotency-Key`) to point at this doc                             | H.Tài | Same PR that accepts ADR 0005             |
| Update `scenarios.md` §13 (D2, D3 closed) to point at this doc                                             | H.Tài | Same PR                                   |
| Update `wireframes.md` §8 and `ui-decisions.md` §2 for `[code]` route (ADR 0004 D3)                        | Nghĩa | Same PR that accepts ADR 0004             |
| Add the `HttpExceptionFilter` (C3) in Task 7.0 or Task 11.0                                                | H.Tài | Task 7.0 `● Xong`                         |

## 16. References

- Assignment PDF §12.1 (endpoint list), §12.2 (entities), §4.3 (US-05), §9.2 (idempotency).
- [ADR 0005](adr/0005-api-contract-conventions.md) — C1–C10 conventions this doc references.
- [ADR 0004](adr/0004-payment-mock-and-order-lifecycle.md) — D1 (stock at `PAID`), D2 (`200 + status`), D3 (order `code`), D4 (idempotency), D5 (retry), D7 (loyalty).
- [ADR 0003](adr/0003-database-postgres-prisma.md) — `price Int`, `version` for locking.
- [Configuration](../config.md) §2.1 (`JWT_EXPIRES_IN`, `PAYMENT_MOCK_MODE`), §2.2 (`NEXT_PUBLIC_API_URL`), §3 (currency, states, `Idempotency-Key`).
- [Scenarios](../requirements/scenarios.md) §3–§10 (flows this contract serves), §13 (D2, D3 closed here).
- [Product Backlog](../requirements/product-backlog.md) Task 6, 7, 8, 9, 10 (acceptance criteria).
- [UI Decisions](../design/ui-decisions.md) §2 (routes), §4 (money), §5 (auth).
- [Wireframes](../design/wireframes.md) §4–§11 (screens that consume these endpoints).

---

## Notes on choices I made (so you can accept or override)

1. **The doc cites ADR 0005 by section ID (`C3`, `C7`) instead of restating conventions.** This is the single most important structural decision: if `api-contract.md` restated the error envelope, `config.md` §7's "error envelope" row would have two sources of truth, and a change to one would silently diverge. Citing `C3` means there's exactly one place to change the envelope, and this doc stays a *shape* spec, not a *convention* spec.

2. **Endpoint sections follow a fixed template: Auth / Purpose / Request / Response / Rules / Errors.** That's boring and that's the point — a reviewer or frontend dev can jump to any section and know where to look. The `Purpose` line cites the `scenarios.md` IDs and `product-backlog.md` tasks, so every endpoint traces to a requirement. This is the "traceability" the spreadsheet's evidence notes will point at.

3. **The `POST /orders` response includes resolved item `name`s, and I flagged it as an open item.** This is a real design fork: returning names means the order creation response is self-sufficient for the confirmation screen; not returning them means the client needs a second call. The self-sufficient version is what `wireframes.md` §8 assumes (the confirmation page renders without a second fetch), so I wrote it that way — but if the team prefers a leaner `POST /orders` and a second fetch on confirmation, this is the place to flip it. The open item gives that decision a home.

4. **`GET /orders/:code` is added even though PDF §12.1 doesn't list it.** The PDF lists `GET /orders/me` but the confirmation screen (`wireframes.md` §8) needs single-order detail. `GET /orders/me` returns summaries; without a detail endpoint, the confirmation screen would have to filter the history client-side, which breaks for a fresh order whose history hasn't refreshed. The detail endpoint is one Nest controller method and it closes `wireframes.md` §8's "renders `GET /orders/:id`" forward reference (updated to `:code` per ADR 0004 D3).

5. **The `BL-YYYY-NNNN` code format is decided here, not in ADR 0004.** ADR 0004 D3 says "format decided in `api-contract.md`" — this is that decision. Putting it here rather than in the ADR keeps the ADR about the *decision to use a code*, and this doc about the *format*. If the format needs to change (e.g. to `BL-26-0001`), it's a one-line edit to this doc and its open-item row.

6. **`GET /products` returns the list without `sizes`/`toppings`, and `GET /products/:id` returns them.** This keeps the menu response small (a grid of cards needs name/price/image, not size tables) and matches `wireframes.md` §4 (menu cards show base price only) and §5 (detail screen shows the selector). If the menu later needs to filter by size, this split is the thing to revisit — but that's a Phase 2 concern.

7. **The `POST /payments` failure path returns `200` with `status: "PAYMENT_FAILED"`, and the section says *twice* that the frontend must check `body.status`, not `res.ok`.** ADR 0004 D2 is the *decision*; this is the *contract consequence*, and it's the single most likely place for a frontend bug. Stating it in the endpoint section and again in §14 is deliberate redundancy — the payment handler is the one place where the "check `res.ok`" reflex is wrong, and a junior dev will get it wrong unless told twice.

8. **§12 (reserved endpoints) is a scope-control device.** Task 10 adds promotions and loyalty, and the frontend will eventually need a promo-validation endpoint. Listing them as "reserved, not Phase 1" means the frontend can be designed against the shape without anyone thinking they're in scope. It also stops a reviewer from asking "where's the promo endpoint?" — the answer is "§12, Task 10, not now."

9. **§15 (open items) has nine rows, and three of them are cross-doc updates** (`config.md` §7, `scenarios.md` §13, `wireframes.md`/`ui-decisions.md` for the `[code]` route). That's a lot for one doc, but they're all consequences of the four ADRs this contract is built on — when an ADR is accepted, its dependent docs must be updated, and this table is the checklist. The alternative (updating them silently in the ADR's PR without a checklist) is how docs drift.

10. **One small inconsistency to fix in `wireframes.md` after this:** §8 of `wireframes.md` says the confirmation route renders `GET /orders/:id`; with ADR 0004 D3 and this doc, it's `GET /orders/:code`. That's already on the open-items table (§15's eighth row), but it's worth flagging here because `wireframes.md` §1's screen inventory and §8's layout both say `[id]`. The update is mechanical: `:id` → `:code` in three places in `wireframes.md` and two in `ui-decisions.md` §2.
