# BrewLite - Local Deployment Guide

This guide describes the local Docker Compose deployment for development and class demo. The stack is defined in [`docker-compose.yml`](../docker-compose.yml) (`S-04`) with the images in `apps/api/Dockerfile` and `apps/web/Dockerfile`. The production part and rollback are added in `D-15` (P7).

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
- `api` starts only after `db` is healthy, runs `prisma migrate deploy`, then starts NestJS. Its health check calls `GET /health`, which is added in `C-04`; until then `docker compose ps` shows the API as unhealthy even though it answers on port 3001.
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

## 9. Production note

This runbook targets local development and academic demo only. Public deployment needs TLS, managed secrets, restricted database networking, backups, monitoring, real payment integration, and a reviewed production platform configuration.