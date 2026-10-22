# BrewLite - Setup and Onboarding

**Status:** Phase 1 deliverable  
**Owner:** Nghĩa (Task 1.0, Task 12.0)  
**Related:** [Project Structure](project-structure.md), [Configuration](config.md), [Working Agreement](working-agreement.md), [README](../README.md)

This guide takes a teammate from a clean machine to a running BrewLite stack: web app, API, and database, with seed data loaded. Follow it top to bottom the first time. If a step fails, check the [Troubleshooting](#troubleshooting) section before asking in the team channel.

> **Scope:** this doc covers local development only. Docker Compose end-to-end and deployment are Phase 2+ (`docs/deployment.md`).

## 1. Prerequisites

| Tool                         | Version               | Check command      | Notes                                                    |
| ---------------------------- | --------------------- | ------------------ | -------------------------------------------------------- |
| Node.js                      | 22 LTS or 24 LTS      | `node --version`   | Must be ≥ 22. The apps pin no engine field yet; use LTS. |
| npm                          | 10+ (ships with Node) | `npm --version`    | Package manager is npm per app, not a root workspace.    |
| Docker Desktop               | Current stable        | `docker --version` | Used for the PostgreSQL container only in Phase 1.       |
| Git                          | 2.40+                 | `git --version`    |                                                          |
| PostgreSQL client (optional) | 16+                   | `psql --version`   | Only needed for manual DB inspection.                    |
| IDE                          | VS Code recommended   | —                  | Install the Prisma and ESLint extensions.                |

Windows users: run commands in **PowerShell** unless a step says otherwise. The examples use PowerShell syntax.

## 2. Clone and enter the repository

```powershell
git clone <repository-url> BrewLite
cd BrewLite
```

The root has **no** `package.json` and no npm workspace. Every install and every script runs from `apps/api` or `apps/web`. Do not run `npm install` at the root — it will fail or create a stray lockfile.

## 3. Start the database

Phase 1 uses the PostgreSQL service from the root `docker-compose.yml`.

```powershell
docker compose up -d db
docker compose ps
```

Expected: the `db` service is `running` and healthy. If port `5432` is already taken by a local Postgres install, stop that service or change the host port in `docker-compose.yml` and update `DATABASE_URL` in `apps/api/.env` (see [Configuration](config.md)).

Verify connectivity:

```powershell
docker compose exec db pg_isready -U brewlite
```

## 4. Configure environment files

Each app owns its own `.env`. Copy the examples, then fill in values.

```powershell
Copy-Item apps/api/.env.example apps/api/.env
Copy-Item apps/web/.env.example apps/web/.env
```

The full variable table, defaults, and the reason for each variable live in [Configuration](config.md). The minimum you need for a local run:

- `apps/api/.env` — `DATABASE_URL`, `JWT_SECRET`, `PORT`, `WEB_ORIGIN`
- `apps/web/.env` — `NEXT_PUBLIC_API_URL`

**Never commit `.env`.** It is covered by `.gitignore`; if you find yourself needing to share a value, update `.env.example` instead.

## 5. Install dependencies

Install separately in each app. Order does not matter, but do not mix them.

```powershell
cd apps/api
npm install

cd ../web
npm install
```

Each app has its own `package-lock.json`. Commit the lockfile whenever you add, remove, or upgrade a dependency in that app.

## 6. Set up the database schema

From `apps/api`:

```powershell
cd apps/api
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

- `prisma generate` builds the client from `prisma/schema.prisma`.
- `migrate dev` applies migrations and creates the database if missing. In Phase 1, the first migration is created by the owner of Task 1.0 / Task 14.0 — if `prisma/migrations/` is empty, coordinate before running this.
- `db seed` loads sample menu data (Task 9.0, Task 14.0). The seed script is `apps/api/prisma/seed.ts`.

To reset to a clean state:

```powershell
npx prisma migrate reset
```

This drops the schema, re-applies migrations, and re-runs the seed. **It deletes all local data.** Confirm before running.

## 7. Run the apps

Use two terminals.

**Terminal 1 — API:**

```powershell
cd apps/api
npm run start:dev
```

Expected: Nest logs a startup banner and listens on the API port from `apps/api/.env` (see [Configuration](config.md) for the assigned port). The default endpoint check is:

```powershell
curl http://localhost:<API_PORT>/health
```

**Terminal 2 — web:**

```powershell
cd apps/web
npm run dev
```

Expected: Next.js prints `Local: http://localhost:3000` (or the next free port — read the log, do not assume). Open it in a browser.

## 8. Verify the scaffold ("Hello" check)

This is the acceptance criterion for Task 1.0 and Task 12.0. All four checks must pass before you consider setup complete.

| Check           | How                                                          | Expected                                                   |
| --------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| Web boots       | Open `http://localhost:3000`                                 | The starter page renders without console errors.           |
| Web reaches API | Open the browser devtools Network tab while loading the page | The request to `NEXT_PUBLIC_API_URL` succeeds (200).       |
| API responds    | `curl http://localhost:<API_PORT>/health`                    | JSON health payload.                                       |
| DB is wired     | `cd apps/api; npx prisma studio`                             | Prisma Studio opens and shows the seeded tables with rows. |

If any check fails, stop and use [Troubleshooting](#troubleshooting). A green scaffold is the exit condition for Phase 1 setup.

## 9. Run tests

From each app:

```powershell
cd apps/api
npm test
npm run test:e2e
```

```powershell
cd apps/web
npm test
```

The API uses Vitest for unit and e2e runs (`vitest.config.ts`, `vitest.config.e2e.ts`); the web app uses the runner configured in its `package.json`. Cross-app Playwright tests live in root `tests/e2e/` and are Phase 2+.

## 10. Daily workflow

1. Pull latest `main`, branch from it: `git switch -c feat/<task-stt>-<slug>`.
2. Start the database: `docker compose up -d db`.
3. Start API and web in two terminals (§7).
4. Make changes; run the relevant test suite (§9).
5. Commit referencing the task STT, e.g. `feat(api): products module (Task 2.0)` — see [Working Agreement](working-agreement.md) for the commit and PR rules.
6. Open a PR using the repository template; the checklist mirrors the Definition of Done.
7. Mark the task `● Xong` in the spreadsheet **and** add the evidence note in the same PR. See [Working Agreement](working-agreement.md) § "Task evidence notes".

## Troubleshooting

**`npm install` fails at the repo root**  
Expected. Install from `apps/api` or `apps/web`. There is no root `package.json`.

**Port 5432 already in use**  
A local PostgreSQL is running. Either stop it, or change the host port in `docker-compose.yml` (e.g. `"5433:5432"`) and update `DATABASE_URL` to `...@localhost:5433/...`.

**Prisma `P1001: Can't reach database server`**  
The `db` container is not up or not healthy. Run `docker compose ps` and `docker compose logs db`. Also confirm `DATABASE_URL` host is `localhost` (not `db`) when running the API on the host.

**Prisma `P3005: database schema is not empty` on `migrate dev`**  
The database has objects but no migration history. Run `npx prisma migrate reset` in `apps/api` (destroys local data), then re-run `migrate dev` and `db seed`.

**Web shows CORS errors**  
`WEB_ORIGIN` in `apps/api/.env` must match the exact origin the browser uses (`http://localhost:3000`, including protocol and port). Update it and restart the API.

**Web calls the wrong API URL**  
`NEXT_PUBLIC_*` variables are inlined at build/start time. After editing `apps/web/.env`, stop and restart `npm run dev`.

**`prisma generate` "client not found"**  
Run `npx prisma generate` from `apps/api` after any `npm install` that touched Prisma, and after every schema change.

**Seed fails with unique constraint**  
The seed is not idempotent against an already-seeded DB. Run `npx prisma migrate reset` and retry.

**Node version mismatch / unsupported engine**  
Switch to Node 22 or 24 LTS (`nvm use 22` or `fnm use 22`). Check with `node --version`.

## References

- [Project Structure](project-structure.md) — where files live and why.
- [Configuration](config.md) — every env var, port, and planning assumption.
- [Working Agreement](working-agreement.md) — task evidence notes, naming, commit/PR rules.
- [API Contract](architecture/api-contract.md) — endpoints and payload shapes.
- Root `README.md` — project summary and the quickstart that points here.

---

## Notes on choices I made (so you can accept or override)

1. **API port is deliberately left as `<API_PORT>`.** Your `Cấu hình` sheet and `.env.example` haven't fixed it yet — that's exactly the kind of thing `docs/config.md` is supposed to lock down. Once you write `config.md`, replace `<API_PORT>` here in one pass (there are 4 occurrences). If you want a default now, `3001` is the conventional Nest choice alongside Next on `3000`.

2. **The "Hello" check table is the actual Phase 1 exit gate.** I made it a table with four rows because Task 1.0's acceptance criterion is literally "both apps run 'Hello'", and a checklist is harder to skip than prose. It's also the demo evidence you'd cite in the Task 1.0 `● Xong` note.

3. **Troubleshooting is scoped to failures a Phase 1 teammate will actually hit** — the root-`npm install` mistake (called out three times across docs because it's the #1 onboarding failure for a two-app repo), Prisma `P1001`/`P3005`, CORS from a `WEB_ORIGIN` mismatch, and `NEXT_PUBLIC_*` restart semantics. I did not add generic "reinstall Node" advice.

4. **No Docker instructions for the apps themselves.** `apps/api/Dockerfile` and `apps/web/Dockerfile` exist in the scaffold, but wiring them into Compose is Task 57.0 (Phase 6) per the spreadsheet. The setup doc says so explicitly so nobody assumes `docker compose up` runs the whole stack in Phase 1 — only the `db` service.

5. **Windows-first commands.** Your spreadsheet and structure doc use PowerShell (`cd apps/api; npm install`), so the examples use `Copy-Item` and PowerShell syntax. I added a one-line note rather than duplicating every command in bash.

6. **Two forward references you should honor when writing the next docs:** `config.md` must define `WEB_ORIGIN`, `JWT_SECRET`, `PORT`, `DATABASE_URL`, `NEXT_PUBLIC_API_URL`, and the chosen ports; `working-agreement.md` must define the exact `[DoD]` evidence line and the `feat(<scope>): ... (Task <stt>)` commit format referenced in §10. If either drifts, this doc breaks.
