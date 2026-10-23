# BrewLite - Configuration

**Status:** Phase 1 deliverable  
**Owner:** Nghĩa (Task 1.0, Task 11.0, Task 12.0)  
**Related:** [Setup](setup.md), [Project Structure](project-structure.md), [ADR 0003 Database](architecture/adr/0003-database-postgres-prisma.md), [ADR 0004 Payment Mock](architecture/adr/0004-payment-mock-method.md), [Working Agreement](working-agreement.md)

This document is the written contract for every environment variable, port, and project constant in BrewLite. If a value here disagrees with `.env.example`, this document wins; if this document disagrees with a running app, one of them is wrong and must be fixed in the same PR.

> **Stability:** values marked **🔒 Locked** are settled and may only change via an ADR. Values marked **🟡 Provisional** are in use but not yet ratified — each carries a fix suggestion and a decision owner. Values marked **⬜ Open** are not decided; do not hard-code them.

## 1. Ports

### 1.1 Port table

| Service              | Port         | Status        | Binding     | Notes                                                                     |
| -------------------- | ------------ | ------------- | ----------- | ------------------------------------------------------------------------- |
| Web (Next.js)        | `3000`       | 🔒 Locked      | `localhost` | Next.js default; also the origin used in CORS.                            |
| API (NestJS)         | `3001`       | 🟡 Provisional | `localhost` | Conventional Nest default. See §1.2 for the risk and the fix.             |
| PostgreSQL           | `5432`       | 🔒 Locked      | `localhost` | Inside the `db` container; host port may be remapped (§1.3).              |
| Prisma Studio        | `5555`       | 🔒 Locked      | `localhost` | Default Prisma Studio port; dev-only.                                     |
| Mock payment gateway | *in-process* | 🔒 Locked      | —           | Phase 1 mock runs inside the API process; no separate port. See ADR 0004. |

**How these are consumed:**

- Web reads its own port from Next.js itself (`npm run dev -p <port>` if overridden); `NEXT_PUBLIC_API_URL` must point at the API port.
- API reads `PORT` from `apps/api/.env`; `main.ts` calls `app.listen(process.env.PORT)`.
- API's CORS allowlist reads `WEB_ORIGIN` (must include the web port).
- `apps/api/.env` `DATABASE_URL` must match the host-mapped Postgres port.
- `docker-compose.yml` maps host↔container ports for `db` only.

### 1.2 API port risk and fix (🟡 Provisional → 🔒)

**Why `3001` is provisional:** it is the conventional NestJS companion to Next's `3000`, but nothing in the assignment or spreadsheet pins it. Two failure modes are common enough to plan for:

1. **Collision on the developer machine.** Another local service (a second Nest app, a Docker dashboard, some IDE plugin) already holds `3001`. The API fails to bind and the error is easy to miss if you only watch the web terminal.
2. **Collision with a future service.** If Phase 2+ adds a second backend process (e.g. a queue worker or a mock gateway on its own port), `3001` is the first port it will want.

**Fix suggestions, in order of preference:**

| Option                                     | When to choose it                                          | What changes                                                                                                                                |
| ------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Keep `3001`, document it everywhere** | Team is confident nothing else needs `3001`                | Ratify in an ADR; no code change.                                                                                                           |
| **B. Move API to `4000`**                  | You want a visibly distinct API port and no Next adjacency | `PORT=4000`, `NEXT_PUBLIC_API_URL=http://localhost:4000`, `WEB_ORIGIN` unchanged, update `docker-compose.yml` if API is ever containerized. |
| **C. Allocate at runtime**                 | You expect per-developer drift                             | API reads `PORT` (default `3001`); web reads `NEXT_PUBLIC_API_URL` — already the design. No hard-coded ports in code, only in `.env`.       |

**What must not happen:** hard-coding the API port in frontend fetch calls, in `docker-compose.yml` healthchecks, or in any doc other than this one and `.env.example`. The fix for a port collision should be a one-line `.env` edit, never a code change.

**Decision owner:** Nghĩa. **Deadline:** before Task 11.0 (backend Hello) is marked `● Xong`. Until then, treat `3001` as the default in docs and `.env.example`, and record the actual bound port in the Task 11.0 evidence note.

### 1.3 PostgreSQL host-port remap

The `db` service always listens on `5432` **inside** the container. On the host it maps `5432:5432` by default. If `5432` is already taken by a local Postgres install:

```yaml
# docker-compose.yml (db service)
ports:
  - "5433:5432"   # host:container
```

Then update `apps/api/.env`:

```dotenv
DATABASE_URL="postgresql://brewlite:brewlite@localhost:5433/brewlite?schema=public"
```

Inside the Compose network (if the API is ever containerized), the host is `db` and the port is always `5432` — the remap only affects host connections. Document any remap in the Task 11.0 evidence note.

## 2. Environment variables

Two env files, one per app. Neither is committed. Both have a `.env.example` sibling that **is** committed and must stay in sync with this table.

### 2.1 `apps/api/.env`

| Variable            | Status | Required | Default / example                                                      | Purpose                                                                                            |
| ------------------- | ------ | -------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `NODE_ENV`          | 🔒      | yes      | `development`                                                          | Nest runtime mode. `production` disables pretty logs and enables stricter validation.              |
| `PORT`              | 🟡      | yes      | `3001`                                                                 | API listen port. See §1.2.                                                                         |
| `WEB_ORIGIN`        | 🔒      | yes      | `http://localhost:3000`                                                | CORS allowlist entry. Must be an exact origin — no trailing slash, no wildcard.                    |
| `DATABASE_URL`      | 🔒      | yes      | `postgresql://brewlite:brewlite@localhost:5432/brewlite?schema=public` | Prisma connection string. Host is `localhost` for host-run API, `db` for containerized API (§1.3). |
| `JWT_SECRET`        | 🟡      | yes      | *(dev only)* `change-me-in-dev-only-32-chars-min`                      | HMAC signing key. ≥ 32 chars. Never commit a real value. See §4.                                   |
| `JWT_EXPIRES_IN`    | 🔒      | yes      | `1d`                                                                   | Token TTL. Shorter for demo builds is fine.                                                        |
| `BCRYPT_ROUNDS`     | 🔒      | yes      | `10`                                                                   | Password hash cost.                                                                                |
| `PAYMENT_MOCK_MODE` | 🟡      | yes      | `success`                                                              | Mock behavior selector: `success` \| `failure` \| `random`. See ADR 0004.                          |
| `LOG_LEVEL`         | 🔒      | no       | `debug`                                                                | Nest logger level. `info` in demo builds.                                                          |

### 2.2 `apps/web/.env`

| Variable              | Status | Required | Default / example       | Purpose                                                                                      |
| --------------------- | ------ | -------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | 🟡      | yes      | `http://localhost:3001` | Base URL the browser uses to reach the API. Must include scheme and port, no trailing slash. |
| `NEXT_PUBLIC_APP_ENV` | 🔒      | no       | `development`           | UI environment badge / feature-flag gate.                                                    |

**`NEXT_PUBLIC_*` semantics:** these are inlined at build/start time. Editing `apps/web/.env` requires a dev-server restart; in a production build it requires a rebuild. Never put secrets in a `NEXT_PUBLIC_*` variable.

### 2.3 Sync rule with `.env.example`

`.env.example` must contain **every** variable in the tables above, with a safe placeholder value and a one-line comment. When a variable is added, removed, or renamed:

1. Update this table in the same PR.
2. Update the corresponding `.env.example`.
3. Grep the repo for the old name and fix stragglers.

A PR that touches env vars without touching this doc fails review. This is the enforcement point.

## 3. Constants that are not env vars

Some values are project decisions, not per-environment settings. They live in code, and this table is their source of truth.

| Constant                          | Value                                                                   | Status | Where                                                                   | Why a doc and not a comment                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Project start date                | `2026-10-26` (Mon)                                                      | 🔒      | spreadsheet `Cấu hình!B3`                                               | Drives all schedule math; see §5.                                                                                                 |
| Working days                      | Mon–Fri                                                                 | 🔒      | spreadsheet `Cấu hình!B4`                                               | No holidays in the plan.                                                                                                          |
| Max hours/day: H.Tài, Nghĩa, Luân | `5.0`                                                                   | 🔒      | spreadsheet `Cấu hình!E8:E10`                                           | Team capacity assumption.                                                                                                         |
| Max hours/day: P.Tài, Trí         | `3.0`                                                                   | 🔒      | spreadsheet `Cấu hình!E11:E12`                                          | Part-time capacity assumption.                                                                                                    |
| Standard task size                | `6.0` points                                                            | 🔒      | spreadsheet `Cấu hình!B5`                                               | Calibration anchor for effort estimates.                                                                                          |
| Order states                      | `PENDING, PAID, PAYMENT_FAILED, PREPARING, READY, COMPLETED, CANCELLED` | 🔒      | ADR 0004 + `orders.service.ts` + `OrderStatus` enum in `schema.prisma`  | State Machine vocabulary; must match PDF §9.1. The full enum is in the Task 1.0 ERD (ADR 0003 D-ERD-scope), not added in Phase 5. |
| Idempotency header                | `Idempotency-Key`                                                       | 🟡      | `api-contract.md`                                                       | Header name for `POST /payments`. Provisional until Task 7.0 closes.                                                              |
| Currency                          | VND, integer, no minor units                                            | 🔒      | Prisma schema (`price Int`, `total Int`, `lineTotal Int`, `amount Int`) | No floating point for money. See ADR 0003 D-ERD-scope.                                                                            |
| API error envelope                | `{ "statusCode", "message", "error" }`                                  | 🟡      | `api-contract.md`                                                       | Nest default; may be extended with `code`.                                                                                        |

If a value here must change, change it here **and** in its code/spreadsheet home in the same PR. Do not let the two drift.

### 3.1 Schema decisions recorded in ADR 0003 (batch, Task 1.0 + Task 10)

The Task 1.0 ERD batches the five-entity design with Task 10's schema needs. The following fields are in the schema from the first migration, not added later:

| Field                                                                | Entity    | Task | Why batched                                                                 |
| -------------------------------------------------------------------- | --------- | ---- | --------------------------------------------------------------------------- |
| `stock Int`, `version Int @default(0)`                               | `Product` | 10c  | Enum and version backfills are awkward after seed; see ADR 0003 D-ERD-scope |
| `idempotencyKey String @unique`, `requestHash String`, `status` enum | `Payment` | 10b  | Unique constraint must exist before the first payment row                   |
| `loyaltyPoints Int @default(0)`                                      | `User`    | 10d  | One column; free to batch                                                   |
| `status` enum (7 values)                                             | `Order`   | 10a  | Enum alteration is the most awkward Postgres migration                      |

**Deferred** (new tables, not columns): `Promotion` (Phase 5), `LoyaltyLedger` (Phase 2+), `OrderItemTopping` join table (Phase 2+). Each gets its own ERD version (`erd-core-v2`) when its phase arrives.

## 4. Secrets and local development

- **Committed:** `.env.example` with placeholder values only. Never a real secret.
- **Never committed:** `.env`, `.env.local`, any file matched by `.gitignore`'s env rules.
- **Dev `JWT_SECRET`:** it is acceptable to use an obvious placeholder in a local `.env` (e.g. `change-me-in-dev-only-32-chars-min`). It is **not** acceptable in any committed file, screenshot, or PR description. If you paste a terminal transcript into a PR, redact it.
- **Rotation:** if a real secret is ever committed, treat it as leaked — rotate immediately and note it in `docs/working-agreement.md`'s incident log (created when the first incident happens, not before).
- **Production:** Phase 2+ (`docs/deployment.md`) defines how production secrets are injected. This doc only covers local dev.

## 5. Planning assumptions (from the spreadsheet)

These are recorded here because the spreadsheet is a working artifact that cannot be diffed in a code review. If a reviewer asks "why is the schedule this way," the answer must be readable in Git.

- **Start date:** Monday `2026-10-26`. All `WORKDAY` formulas in the spreadsheet anchor on `Cấu hình!B3`. Changing it reflows every computed date; changing it does not reflow the hand-typed dates in the `Ngày` column of `Danh sách task` (they were computed once) — **if you change the start date, recompute those dates**, or the two sheets disagree.
- **Working week:** Monday–Friday. No public-holiday calendar is applied. If the team observes a holiday, it is an unplanned day off; the plan absorbs it via the buffer below.
- **Capacity:** H.Tài / Nghĩa / Luân at `5.0 h/day`; P.Tài / Trí at `3.0 h/day` (part-time). The `Giờ làm mỗi ngày` sheet flags any day that exceeds these caps in red; a red cell is a planning bug, not a runtime bug.
- **Effort model:** a "standard task" is `6.0` points ≈ `0.5` hours for a fast member (weight 10) and ≈ `2.0` hours for a slow member (weight 5); see `Cấu hình!C8:C12`. This is a calibration assumption, not a measurement.
- **Schedule is serial per phase:** a phase starts only after the previous phase's Definition of Done is met. Within a phase, tasks marked "Làm song song" may run concurrently.
- **Buffer:** the plan carries **no** explicit buffer. The spreadsheet's own rule 7 says to keep **20–30%** slack in practice for Scrum ceremonies, integration defects, and review waits. Treat every computed date as optimistic by that margin.
- **Estimated vs. actual:** the `Giờ hoàn thành (tích lũy)` column is a cumulative *estimate*; actuals are not tracked in the sheet. If actuals are needed for Retrospective, add them to `docs/plans/` in Phase 2+, not to the spreadsheet.

## 6. How to change a value in this document

1. Open an ADR if the value is 🔒 or if a 🟡 item is being ratified. Reference this doc's section number.
2. Edit this doc and the code/`.env.example`/spreadsheet in the same PR.
3. Add a line to `docs/working-agreement.md`'s change log if the change affects anyone beyond the author.
4. If the change affects the port table (§1) or an env var (§2), grep the repo for the old value and fix every hit — including `docs/setup.md`'s `<API_PORT>` placeholders.

## 7. Open items (tracked here until closed)

| Item                                                                       | Status | Owner | Closes when                                                           |
| -------------------------------------------------------------------------- | ------ | ----- | --------------------------------------------------------------------- |
| Ratify API port (`3001` vs `4000` vs runtime)                              | 🟡      | Nghĩa | ADR recorded; Task 11.0 `● Xong` evidence cites the bound port        |
| Ratify `JWT_SECRET` placeholder policy                                     | 🟡      | Nghĩa | Recorded in ADR 0005 or a one-line decision in `working-agreement.md` |
| Ratify error envelope (`code` field or not)                                | ✅      | H.Tài | Closed: ADR 0005 C3, `api-contract.md` §3                             |
| Ratify `Idempotency-Key` header spelling/casing                            | ✅      | H.Tài | Closed: ADR 0005 C5, `api-contract.md` §9                             |
| Ratify `PAYMENT_MOCK_MODE` values                                          | 🟡      | H.Tài | ADR 0004 closes                                                       |
| **Batch decision: Task 1.0 ERD includes Task 10's columns**                | ✅      | H.Tài | Closed: ADR 0003 D-ERD-scope                                          |
| **Task 1.0 ERD scope (5 entities + Task 10 columns, new tables deferred)** | ✅      | H.Tài | Closed: `erd-core-v1` committed                                       |

---

## Notes on choices I made (so you can accept or override)

1. **The 🟡/🔒/⬜ status vocabulary is the core design decision here.** You said ports may not be ready and 3001 is likely but not certain. Rather than pretend `3001` is locked (which would force a doc edit the moment it changes) or leave it open (which leaves `<API_PORT>` unfillable in `setup.md`), I made "provisional with a decision owner and a deadline" a first-class state. This is the same pattern ADRs use for "proposed" vs "accepted," applied at the value level.

2. **§1.2 is deliberately longer than a port table needs to be.** It lists two failure modes and three fix options, and it names the anti-pattern ("hard-coding the API port in frontend fetch calls") because that's the actual risk when a port is provisional — someone hard-codes it, then the port changes, and now a "config" change is a code change. The fix suggestions are ordered by cost, and option C ("allocate at runtime") is the one that makes the whole question moot — worth considering.

3. **I kept the "VND, integer minor-unit-free" constant** because the PDF's wireframe shows `35k`, `45.000đ` etc., and the Prisma schema will need a decision on `Int` vs `Decimal` before Task 1.0's ERD is final. Flagging it here means the ERD owner sees it.

4. **§5 (planning assumptions) is the section that answers "why is the schedule this way."** The spreadsheet's rule 7 says keep 20–30% buffer, but the plan carries none — that's a discrepancy worth recording, not hiding. I also flagged the `Ngày` column drift risk: those dates were computed once and won't reflow if `Cấu hình!B3` changes. That's a real trap.

5. **§7 (open items) is the section that keeps this doc from rotting.** Every 🟡 in the doc has a row here with an owner and a closing condition, so "provisional" can't become "permanent by neglect." When you ratify the API port, you delete its row — the doc shrinks as decisions land.

6. **One thing to fix in `setup.md` after this:** it has four `<API_PORT>` placeholders and two `<port>` references. With this doc written, replace them with `3001` and add "(see [Configuration §1.2](config.md#12-api-port-risk-and-fix--provisional--locked) if your machine needs a different port)". I left them as placeholders in the previous turn precisely so this turn could resolve them in one pass.
