# ADR 0005 — API contract conventions

- **Status:** Accepted (2026-10-22; accepted when Task 7.0 API contract closed)
- **Date:** 2026-10-22
- **Deciders:** H.Tài, Nghĩa
- **Related:** [ADR 0001](0001-record-architecture-decisions.md), [ADR 0003](0003-database-postgres-prisma.md), [ADR 0004](0004-payment-mock-and-order-lifecycle.md), [API Contract](../api-contract.md), [Configuration](../../config.md) §3, §7, [Scenarios](../../requirements/scenarios.md) §13

## Context

The BrewLite API has six endpoints (PDF §12.1) and will grow as Task 10 adds promotions and loyalty. Without shared conventions, each endpoint invents its own shape:

- Success bodies may be bare objects, `{ data }`, or `{ result }`.
- Errors may be `{ message }`, `{ error }`, `{ errors: [...] }`, or a plain string.
- Timestamps may be ISO strings, Unix milliseconds, or Prisma `Date` serialized inconsistently.
- Money may be a number or a string; the frontend may receive `35000`, `"35000"`, or `"35.000đ"`.
- The `Idempotency-Key` header may be `Idempotency-Key`, `idempotency-key`, or `X-Idempotency-Key` depending on which endpoint implements it.
- Auth may be `Authorization: Bearer <jwt>` or a custom header.

The frontend (`apps/web/src/lib/api.ts`) must parse every response. If the shape varies per endpoint, the client needs per-endpoint parsing, and every new endpoint re-litigates the shape. The grader reviews the API (PDF §12.1) and the e2e tests (`scenarios.md` §12); inconsistent shapes make both harder.

Constraints:

- NestJS already provides a default error envelope via its exception filter (`{ statusCode, message, error }`). The convention should align with Nest where reasonable, not fight it.
- `class-validator` is the validation mechanism (PDF §6); its error format is `{ property, constraints }` per field.
- The assignment's endpoints are fixed (PDF §12.1); the convention must cover all six plus Task 10's additions.
- The frontend is Next.js App Router with native `fetch` (`ui-decisions.md` §1); no React Query, no generated client. The convention must be simple enough to consume by hand.

## Decision

The API follows these conventions. They apply to every endpoint, including Task 10's additions.

### C1 — Base path and versioning

- **Base path:** `/api/v1`. All endpoints are under it. `GET /api/v1/products`, not `GET /products`.
- **Versioning:** path-based (`/v1`), not header-based. A breaking change introduces `/v2` and keeps `/v1` until the frontend migrates. Non-breaking changes (new optional fields, new endpoints) do not bump the version.
- **Rationale:** path versioning is visible in logs, curl commands, and the frontend's base URL (`NEXT_PUBLIC_API_URL` includes `/api/v1`). Header versioning is invisible and easy to forget in tests.
- **Health check:** `GET /api/v1/health` is the only endpoint outside the auth rules; it returns `{ status: "ok", version: "v1" }`. It is not versioned further.

### C2 — Success response shape

- **Single resource:** the resource object directly, no wrapper. `GET /api/v1/products/:id` returns `{ id, name, price, imageUrl, stock }`.
- **Collection:** a wrapper with `items` and `total`. `GET /api/v1/products` returns `{ items: [...], total: 6 }`. `total` is the count of items in this response, not the total in the database (Phase 1 has no pagination; `total` is the array length). If pagination is added, `total` becomes the DB count and `nextCursor` is added.
- **Created resource:** `201` with the resource, including server-generated fields (`id`, `code`, `status`). `POST /api/v1/orders` returns `{ id, code, status: "PENDING", total, createdAt }`.
- **Mutation with no body:** `204 No Content` (e.g. a future `DELETE`). Phase 1 has no such endpoint.
- **No `{ data: ... }` wrapper.** It adds a level of nesting for no benefit; the frontend reads `res.items` or `res.id` directly.

### C3 — Error response shape

All errors use a single envelope:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "items", "message": "items must not be empty" }
  ]
}
```

- **`statusCode`:** the HTTP status (redundant with the response, but Nest includes it and clients sometimes read it).
- **`error`:** the HTTP reason phrase (`"Bad Request"`, `"Unauthorized"`, `"Not Found"`, `"Conflict"`). Machine-readable, stable.
- **`message`:** a human-readable summary. In Vietnamese for user-facing errors, English for developer errors. The frontend may display `message` directly for known cases; it should not display raw validation details.
- **`details`:** optional; present for validation errors and any error with field-level information. Each entry has `field` and `message`. Absent for non-field errors (e.g. `404`).
- **`code`:** optional machine-readable string (e.g. `"OUT_OF_STOCK"`, `"IDEMPOTENCY_CONFLICT"`). Present when the frontend needs to branch on the error without parsing `message`. Not required for generic validation errors.

This is a **superset** of Nest's default envelope; the global exception filter maps Nest exceptions to it and leaves unknown errors as `500` with a generic message (no stack trace in the response).

Status codes in use:

| Code  | When                                                                                                        |
| ----- | ----------------------------------------------------------------------------------------------------------- |
| `200` | Successful read or mutation (including `PAYMENT_FAILED` per ADR 0004 D2)                                    |
| `201` | Resource created (`POST /orders`, `POST /auth/register`)                                                    |
| `204` | Successful mutation with no body (future)                                                                   |
| `400` | Validation failure (malformed body, missing field, invalid enum)                                            |
| `401` | Missing or invalid JWT                                                                                      |
| `403` | Authenticated but not allowed (future; Phase 1 uses `404` for cross-user access to avoid leaking existence) |
| `404` | Resource not found, or cross-user access (per `scenarios.md` S-ORD-4)                                       |
| `409` | Conflict (duplicate email, idempotency key reused with different body, invalid state transition)            |
| `500` | Unexpected server error (generic message, logged with a correlation id)                                     |

### C4 — Authentication header

- **Header:** `Authorization: Bearer <jwt>`. Standard, not custom.
- **Token source:** `POST /api/v1/auth/login` returns `{ accessToken, expiresIn, user: { id, email } }`. The frontend stores `accessToken` in `localStorage` (`ui-decisions.md` §5.2) and sends it on every request via `apps/web/src/lib/api.ts`.
- **Missing token on a protected route:** `401` with `error: "Unauthorized"` and `code: "AUTH_REQUIRED"`.
- **Expired token:** `401` with `code: "AUTH_EXPIRED"`. The frontend clears the token and redirects to login.
- **No refresh token in Phase 1.** `JWT_EXPIRES_IN` is `1d` (`config.md` §2.1); a refresh flow is a Phase 2+ item.

### C5 — Idempotency header

- **Header spelling:** `Idempotency-Key` (exact casing). HTTP headers are case-insensitive, but the API's documentation and tests use this casing consistently.
- **Required for:** `POST /api/v1/payments` only (ADR 0004 D4). Not required for `POST /api/v1/orders`.
- **Format:** a client-generated UUID v4 or any opaque string ≤ 128 chars. The server does not validate the format beyond length.
- **Behavior:** see ADR 0004 D4. The server stores the key with the payment; a replay with the same body returns the stored response; a replay with a different body returns `409` with `code: "IDEMPOTENCY_CONFLICT"`.

### C6 — Timestamps

- **Format:** ISO 8601 with milliseconds and `Z` (UTC): `"2026-10-22T14:30:00.000Z"`.
- **Fields:** all timestamps end in `At` (`createdAt`, `updatedAt`, `paidAt`). No Unix milliseconds, no date-only strings for timestamps.
- **Frontend display:** `apps/web/src/lib/format.ts` has `formatDateTime(iso: string): string` that renders in the browser's local timezone with Vietnamese locale (`22/10/2026 21:30`). The API always sends UTC; the frontend always converts.

### C7 — Money fields

- **Type:** integer in VND (`config.md` §3). JSON number, not string, not decimal.
- **Fields:** all money fields end in `Price`, `Total`, or `Amount` (`unitPrice`, `lineTotal`, `total`, `amount`). The unit is VND; it is not in the field name (no `totalVnd`).
- **Formatting:** done only on the frontend via `formatVnd` (`ui-decisions.md` §4.3). The API never returns formatted strings.

### C8 — IDs and codes

- **DB `id`:** UUID v4, exposed only in URLs where the route is keyed by id (products: `/products/:id`). Never exposed for orders in URLs (ADR 0004 D3 keys orders by `code`).
- **Human-readable `code`:** orders have a `code` (format decided in `api-contract.md`, e.g. `BL-2026-0001`). The code is exposed in URLs and responses; it is unique and immutable.
- **Response `id` field:** included in responses alongside `code` where the client might need it for internal linking, but the client uses `code` for user-facing URLs.

### C9 — Pagination (deferred, but reserved)

Phase 1 has no pagination. Collections return all items with `total` = array length (C2). If pagination is added:

- Cursor-based, not offset-based (`nextCursor` in the response, `cursor` query param).
- `total` becomes the DB count (requires a count query); `items` is the page.
- This is a Phase 2+ decision; the shape is reserved here so a future addition is non-breaking.

### C10 — Correlation id

- Every request has an `X-Request-Id` header (client-supplied) or a server-generated UUID. The response echoes it in `X-Request-Id`.
- `500` errors include the correlation id in the body (`"requestId": "..."`), and the server logs the full error with the same id.
- The frontend logs the correlation id to the console for any `5xx` so a user can report it.

## Consequences

### Positive

- **The frontend has one parser.** `apps/web/src/lib/api.ts` has one `request<T>()` function that handles the envelope, the auth header, the idempotency header, and the error mapping. Every endpoint uses it. Adding an endpoint is one function call, not a new parser.
- **The grader can read one doc.** `api-contract.md` references this ADR for conventions and lists only endpoint-specific shapes. A reviewer reading `api-contract.md` does not re-argue `{ data }` vs. bare objects.
- **Errors are machine-readable.** `code` lets the frontend branch on `OUT_OF_STOCK` or `IDEMPOTENCY_CONFLICT` without string-matching `message`. This matters for `scenarios.md` S-PAY-5, S-PAY-6, S-ORD-6.
- **Money and time are unambiguous.** The integer-VND and ISO-UTC rules are stated once; `ui-decisions.md` §4.1 and `config.md` §3 reference them. No per-endpoint decisions.
- **Versioning is visible.** `/api/v1` in `NEXT_PUBLIC_API_URL` and in every curl command in `setup.md` and `api-contract.md`.

### Negative / costs

- **`/api/v1` is a prefix every route must remember.** Nest's `setGlobalPrefix('api/v1')` handles it centrally, but a controller that forgets it will 404 in a way that's easy to miss. Mitigation: the first controller (health) sets the pattern; reviewers check the prefix.
- **The error envelope is a superset of Nest's default**, so a custom `HttpExceptionFilter` must map Nest exceptions into it. That's one filter, written once, tested once. Without it, errors leak Nest's default shape and the frontend parser breaks.
- **`code` is optional, which means some errors have it and some don't.** The frontend must handle both. Mitigation: `code` is present for all errors the frontend branches on (auth, stock, idempotency, state transition); generic validation errors omit it.
- **`items`/`total` wrapper on collections is an extra nesting level.** It's the price of a consistent collection shape; the alternative (bare array) makes adding pagination a breaking change.
- **`PAYMENT_FAILED` returning `200`** (ADR 0004 D2) violates the naive "non-2xx means error" rule. The frontend must check `status` in the body, not just `res.ok`. Documented in `api-contract.md` and in `apps/web/src/lib/api.ts`'s payment handler.

### Neutral

- The convention does not prescribe the *content* of `message` (English vs. Vietnamese). The frontend displays it only for known cases; unknown cases fall back to a generic message. Task 7.0's `api-contract.md` may specify per-endpoint messages if needed.
- `X-Request-Id` is optional for the client; the server generates one if absent. It's a debugging aid, not a contract.
- C9 (pagination) is reserved but not implemented; the shape is recorded so a future addition is non-breaking.

## Alternatives considered

| Alternative                                                        | Why rejected                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **No versioning (just `/api/`)**                                   | The first breaking change (e.g. Task 10 adding a required field to `POST /orders`) would break the frontend with no migration path. `/api/v1` costs one line in `main.ts` and one segment in the base URL.                                                               |
| **Header versioning (`Accept: application/vnd.brewlite.v1+json`)** | Invisible in logs, curl commands, and browser devtools; easy to forget in tests. Path versioning is simpler for a student team.                                                                                                                                          |
| **`{ data: ... }` wrapper for all responses**                      | Adds nesting for no benefit; the frontend reads `res.items` or `res.id` directly. Wrappers are useful when responses carry metadata (pagination, warnings); Phase 1 doesn't. Revisit if metadata is added (C9 adds `nextCursor` at the top level, not inside a wrapper). |
| **Bare array for collections**                                     | Adding pagination later would be a breaking change (array → object). `{ items, total }` is future-proof.                                                                                                                                                                 |
| **`402 Payment Required` for failed payment**                      | Rejected in ADR 0004 D2; `200 + status` is the decision. This ADR's C3 table reflects that.                                                                                                                                                                              |
| **`{ error: "string" }` for all errors**                           | Loses status code, field-level details, and machine-readable codes. The envelope in C3 is the minimum that supports all three.                                                                                                                                           |
| **OAuth2 / refresh tokens in Phase 1**                             | Over-scoped for an MVP with a mock gateway and no sensitive data beyond the user's own orders. `JWT_EXPIRES_IN=1d` is sufficient; refresh is Phase 2+.                                                                                                                   |
| **`Idempotency-Key` as a query param or body field**               | Headers are the standard for idempotency (Stripe, PayPal, RFC draft); query params leak into logs and caches; body fields change the canonical body hash. Header is correct.                                                                                             |
| **Timestamps as Unix milliseconds**                                | Not human-readable in logs or devtools; ISO 8601 is self-describing. The frontend converts either way.                                                                                                                                                                   |
| **Money as string (`"35000"`)**                                    | Strings invite parsing bugs and locale issues. Integer JSON numbers are unambiguous; the frontend formats.                                                                                                                                                               |

## When to revisit

Reopen this ADR (new ADR superseding 0005) if any of the following becomes true:

- A breaking change is needed and `/v2` is introduced. (The convention for `/v2` should mirror `/v1` unless there's a reason not to.)
- Pagination is added (C9), which changes the collection shape from `{ items, total }` to `{ items, total, nextCursor }` — non-breaking, but the ADR should be updated to reflect the implemented shape.
- Refresh tokens or OAuth2 is added (C4), which changes the auth flow.
- A real gateway replaces the mock (ADR 0004 "When to revisit"), which may add webhook endpoints with different idempotency semantics.
- The frontend adds a generated API client (e.g. OpenAPI), which may prefer a `{ data }` wrapper or a different error shape.
- `code` becomes mandatory for all errors (currently optional), which is a non-breaking tightening but changes the convention.

## Open questions

| Question | Owner | Closes when |
|---|---|---|
| Decide whether `HttpExceptionFilter` is written in Task 7.0 or Task 11.0 | H.Tài | Task 11.0 `● Xong` |
| Add a "Prisma generate" step to CI (Phase 2+) | H.Tài | First CI workflow |

**Closed by Task 7.0 (2026-10-22):**

- `/api/v1` prefix confirmed; `NEXT_PUBLIC_API_URL` includes it (`config.md` §2.2, `setup.md` §7–§8 updated).
- Order `code` format is `BL-YYYY-NNNN` (`api-contract.md` §8).
- `code` is optional for generic `4xx`, present for branchable errors (C3, `api-contract.md` §3).
- `X-Request-Id` generated by server when absent (C10).
- Per-endpoint `message` language: VN for user-facing, EN for developer (`api-contract.md` §3).
- `config.md` §7 rows for "error envelope" and "`Idempotency-Key`" closed, pointing at C3/C5.
- `scenarios.md` §13 D2, D3 cite `api-contract.md` §9/§11.

## References

- Assignment PDF §12.1 (endpoints), §6 (class-validator, JWT/Passport), §9.2 (idempotency).
- [ADR 0001](0001-record-architecture-decisions.md) — the ADR process this follows.
- [ADR 0003](0003-database-postgres-prisma.md) — Prisma types that shape the responses (integer `price`, `DateTime` timestamps).
- [ADR 0004](0004-payment-mock-and-order-lifecycle.md) — D2 (`200 + status`), D3 (order `code`), D4 (idempotency scope and key).
- [Configuration](../../config.md) §2.1 (`JWT_EXPIRES_IN`), §3 (`Idempotency-Key`, currency), §7 (open items closed here).
- [Scenarios](../../requirements/scenarios.md) §13 (D2 closed here).
- [UI Decisions](../../design/ui-decisions.md) §4.1 (money), §4.3 (formatting), §5.2 (token storage).
- [API Contract](../api-contract.md) — endpoint-specific shapes; this ADR is the conventions layer.
- 
---

## Notes on choices I made (so you can accept or override)

1. **The conventions are numbered `C1`–`C10` so `api-contract.md` can reference them by ID** (e.g. "errors follow C3"). This is a small thing that pays off: when Task 7.0's endpoint tables need to say "returns C2 single-resource shape," they can cite a section instead of restating the convention. Without IDs, `api-contract.md` either duplicates the rules (and drifts) or says "see ADR 0005" vaguely.

2. **C2 (no `{ data }` wrapper) is the most opinionated call, and I stated the rationale bluntly.** Many teams default to `{ data }` because it's what tutorials do. For an API with no metadata, it's pure nesting cost. The ADR says "revisit if metadata is added" — which is exactly what C9 does (adds `nextCursor` at the top level, not inside a wrapper). If you prefer `{ data }`, flip C2 and update `api-contract.md`; but then every endpoint table grows a nesting level.

3. **C3's error envelope is a *superset* of Nest's default, not a replacement.** Nest already returns `{ statusCode, message, error }`; this convention adds optional `details` and `code` and pins the semantics. That means the `HttpExceptionFilter` is a thin mapper, not a from-scratch error system. The "when to write the filter" open question (Task 7.0 or 11.0) is real — if it's deferred to 11.0, Task 7.0's endpoints will temporarily return Nest's default shape, which is *almost* C3 but missing `details`/`code`. I'd write it in Task 7.0.

4. **C4 (Bearer token, no refresh) is scoped to Phase 1, and the ADR says so.** A reviewer may ask "why no refresh token?" — the answer is "MVP, mock gateway, no sensitive data, Phase 2+." The alternative (refresh flow) would add a token store, rotation, and a `/auth/refresh` endpoint, none of which the assignment asks for.

5. **C5's "required only for `POST /payments`" is the ADR 0004 D4 scope restated here.** This is deliberate duplication: a reader of `api-contract.md` should not have to open ADR 0004 to learn that idempotency is payment-only. The two docs must agree; if D4's scope changes, both change.

6. **C9 (pagination reserved) is a "shape now, implement later" decision.** It costs one paragraph today and saves a breaking change later. The key sentence is "`total` becomes the DB count" — that's the semantic difference between Phase 1's `total` (array length) and a paginated `total` (DB count), and it's the thing a future implementer would get wrong if not written down.

7. **C10 (`X-Request-Id`) is the one convention that's not strictly necessary, and I kept it because `500` errors otherwise have no traceable handle.** For a student project, a `500` with no request id means the user reports "it broke" and the team greps logs. The correlation id is one middleware and one log line; it's worth it. If you'd rather drop it to reduce scope, delete C10 and its open question — nothing else depends on it.

8. **The open-questions table has three rows that close existing docs' open items** (`config.md` §7, `scenarios.md` §13 D2, and `setup.md`'s `<API_PORT>`-style base URL). That's the pattern: an ADR that closes a forward reference should have a row for each doc it unblocks. When you accept this ADR, the PR that flips it to `Accepted` should also update `config.md` §7 and `scenarios.md` §13 — same PR, per `working-agreement.md` §4's "evidence in the same PR" rule applied to docs.
