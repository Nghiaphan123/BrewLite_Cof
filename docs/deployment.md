# BrewLite - Local Deployment Guide

This guide describes local Docker Compose and the intended Render production path. The local stack is [`docker-compose.yml`](../docker-compose.yml), with images from `apps/api/Dockerfile` and `apps/web/Dockerfile`. Production is [ADR 0007](architecture/adr/0007-hosting-platform.md). The Render services are not created yet.

## 1. Prerequisites

- Docker Desktop with Docker Compose v2, running on Windows/macOS/Linux.
- Git.
- Node.js is optional for container-only use; install it if running apps outside containers.
- PostgreSQL is provided by Compose; a separate local PostgreSQL installation is not required.

## 2. Expected services and ports

| Service | Container port |                      Host port | Purpose         |
| ------- | -------------: | -----------------------------: | --------------- |
| `web`   |           3000 |                           3000 | Next.js web UI  |
| `api`   |           3001 |                           3001 | NestJS REST API |
| `db`    |           5432 | `POSTGRES_PORT` (default 5432) | PostgreSQL      |

Inside Compose, the API connects to host `db`, not `localhost`. Browser requests use the host-visible API URL; configure it separately from the backend's internal database URL.

## 3. Configuration

1. Copy `.env.example` to `.env` at repository root.
2. Set local development values. Never commit `.env` or real secrets.
3. Settings in `.env.example`:

```dotenv
POSTGRES_DB=brewlite
POSTGRES_USER=brewlite
POSTGRES_PASSWORD=change-me-local
POSTGRES_PORT=5432
DATABASE_URL=postgresql://brewlite:change-me-local@localhost:5432/brewlite
JWT_SECRET=replace-with-local-random-secret
API_PORT=3001
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
```

`DATABASE_URL` in `.env` is for Prisma commands run on your machine (host `localhost`). Docker Compose builds the API container's own `DATABASE_URL` from the `POSTGRES_*` values with host `db`, so you do not edit it for Compose. Prisma (ADR 002) reads it through `apps/api/prisma.config.ts`. `CORS_ORIGIN` must match the URL the browser uses for the frontend, because the browser calls the API directly. Use URL-encoded credentials in `DATABASE_URL` if the password contains URL-reserved characters; Compose inserts `POSTGRES_PASSWORD` into its URL as is, so pick a local password without them. Production secrets must come from the deployment environment or secret store.

## 4. Start the stack

From the repository root:

```powershell
docker compose up --build -d
```

Check status and logs:

```powershell
docker compose ps
docker compose logs -f api
```

The API container applies pending migrations (`prisma migrate deploy`) every time it starts. Load the sample data once (30 products, 5 toppings, 10 demo users, promotions `BREW10` and `WELCOME20K`); the seed is safe to run again:

```powershell
docker compose exec api npm run db:seed
```

Prisma scripts in `apps/api` (run them in the container, or on your machine against the Compose database with `DATABASE_URL` pointing to `localhost`):

| Script                | Prisma command          | Use                                         |
| --------------------- | ----------------------- | ------------------------------------------- |
| `npm run db:generate` | `prisma generate`       | Generate the client into `src/generated/`   |
| `npm run db:validate` | `prisma validate`       | Check `prisma/schema.prisma`                |
| `npm run db:migrate`  | `prisma migrate dev`    | Create and apply a migration in development |
| `npm run db:deploy`   | `prisma migrate deploy` | Apply committed migrations (CI, production) |
| `npm run db:seed`     | `prisma db seed`        | Load the sample data                        |
| `npm run db:reset`    | `prisma migrate reset`  | Drop and rebuild the local database         |

Open the UI at `http://localhost:3000`; it shows sign-in/registration first and opens the menu at `/menu` after successful authentication. The menu header displays the customer's name beside the cart; the account dropdown provides profile details, password change, and sign-out. The API base is `http://localhost:3001`.

## 5. Demo smoke flow

1. Register or sign in.
2. Verify `GET /products` returns the sample menu and browse a drink.
3. Select size/topping and add it to cart.
4. Create an order and verify `PENDING` plus an order identifier.
5. Pay with mock Wallet/Card; verify confirmation and `PAID`.
6. Simulate payment failure and retry; verify cart remains available and idempotency behavior is correct.
7. View `GET /orders/me` and confirm only the signed-in user's orders appear.

## 6. Stop and reset

Stop containers while retaining database data:

```powershell
docker compose down
```

For a fresh local database, remove the Compose volume (this deletes local DB contents):

```powershell
docker compose down -v
```

Rebuild after code or dependency changes:

```powershell
docker compose up --build -d
```

## 7. Compose manifest

- `db` has a `pg_isready` health check and keeps its data in the named volume `db-data`.
- `api` starts only after `db` is healthy, runs `prisma migrate deploy`, then starts NestJS. Compose calls `GET /api/v1/health` (ADR 0005). `web` waits until that check passes.
- `web` is built with `NEXT_PUBLIC_API_URL` as a build argument, because Next.js inlines it at build time. Rebuild the web image after changing it.
- All services share the default private Compose network; only ports 3000, 3001, and the database port are published for local use.
- The payment provider is the mock (`PAYMENT_PROVIDER=mock`); local credentials are placeholders.
- `.env`, database files, and secrets stay out of Git (`.gitignore`, `.dockerignore`).

## 8. Troubleshooting

- **Docker daemon unavailable:** start Docker Desktop and retry `docker compose ps`.
- **Port already in use:** stop the conflicting service or change host port mapping and frontend API URL together.
- **API cannot reach DB:** use `db` as hostname inside Compose; confirm DB health and credentials.
- **Schema/table missing:** check `docker compose logs api` for the migration step, then run `docker compose exec api npm run db:seed`.
- **Browser cannot reach API:** publish the API host port and set `NEXT_PUBLIC_API_URL` to `localhost`, not the Compose-only service name.
- **Browser reports a CORS error:** set `CORS_ORIGIN` to the exact frontend origin (scheme, host, and port), then restart the API (`docker compose up -d api`).
- **Web shows an empty menu:** check the API logs, seed products, and verify API URL.

## 9. Production target

Production is Render, as decided in [ADR 0007](architecture/adr/0007-hosting-platform.md). This section is the procedure. It is not a record of a deploy that has happened.

| Item | Value |
| --- | --- |
| Web URL | Not assigned. Do not invent an `onrender.com` host. |
| API URL | Not assigned. |
| Health URL | Not assigned. The path, once the API URL exists, is `GET /api/v1/health`. |
| Database | Render PostgreSQL, internal URL only. Not public. |
| Images | `ghcr.io/<github-owner>/brewlite-web:<commit-sha>` and `ghcr.io/<github-owner>/brewlite-api:<commit-sha>` |
| Registry owner | The GitHub owner, lowercased, when [`.github/workflows/cd.yml`](../.github/workflows/cd.yml) runs. |

HTTPS is provided by Render for the two web services. The browser calls the API directly, so `CORS_ORIGIN` must be the exact web origin and `NEXT_PUBLIC_API_URL` must be the public API origin including `/api/v1`. That API URL is a build argument. Changing it requires a new web image.

## 10. Secrets

Production secrets live in the Render service environment. They are not committed, and they must not be printed by GitHub Actions.

| Name | Service | Secret |
| --- | --- | --- |
| `DATABASE_URL` | API | Yes. Render internal Postgres URL. |
| `JWT_SECRET` | API | Yes. |
| `CORS_ORIGIN` | API | No. Exact web origin. |
| `PAYMENT_PROVIDER` | API | No. `mock`. |
| `NEXT_PUBLIC_API_URL` | Web build | No. Must not hold a password or a token. |

`.env` stays out of git. A log line that contains `JWT_SECRET` or `DATABASE_URL` is a failed deploy, even if the health check is green.

## 11. Deploy, when the pipeline exists

The workflow is [`.github/workflows/cd.yml`](../.github/workflows/cd.yml). It has not been run. It refuses to deploy until these GitHub secrets exist: `RENDER_API_KEY`, `RENDER_API_SERVICE_ID`, `RENDER_WEB_SERVICE_ID`, and `API_PUBLIC_ORIGIN`. `API_PUBLIC_ORIGIN` is the public API origin with no path and no trailing slash. The intended order is:

1. Pull request runs install, lint, unit test, and build for `apps/api` and `apps/web`. A failure blocks merge.
2. A tag, or the protected branch, builds both Dockerfiles.
3. Actions pushes both images to GHCR with the full commit SHA as the tag. `latest` is not the deploy tag.
4. Render pulls those images for `brewlite-web` and `brewlite-api`.
5. The API container runs `prisma migrate deploy` before `node dist/main.js`. If migration fails, the deploy fails. Seed is not run in production.
6. Smoke calls `GET /api/v1/health` and expects `200` and `{ "status": "ok", "version": "v1" }`. Retry long enough to survive a cold start. If it still fails, stop. Do not point the README at that URL.

## 12. Rollback

Rollback is deploying the previous image SHA, not editing the running container.

1. Find the last SHA whose health check passed. It is the previous row in [release-notes.md](delivery/release-notes.md), once a real release exists.
2. In Render, deploy that SHA for both `brewlite-web` and `brewlite-api`. The web image must be the one built for the same API URL.
3. Call `GET /api/v1/health` again.
4. Write the SHA that was restored into the release notes.

A database migration that already ran is not reversed by the old image. If the new migration is not backward compatible, rollback of the image is not enough. That case needs a written forward fix, not a silent `migrate reset`.

Local rollback of a developer database is different: `docker compose down -v` deletes the local volume. Do not run that against production.