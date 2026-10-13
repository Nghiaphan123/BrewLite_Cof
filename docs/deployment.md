# BrewLite - Local Deployment Guide

This guide describes the intended local Docker Compose deployment for development and class demo. It is a target runbook; this repository currently contains documentation only, so Compose commands work after the frontend/backend projects and `docker-compose.yml` are added.

## 1. Prerequisites

- Docker Desktop with Docker Compose v2, running on Windows/macOS/Linux.
- Git.
- Node.js is optional for container-only use; install it if running apps outside containers.
- PostgreSQL is provided by Compose; a separate local PostgreSQL installation is not required.

## 2. Expected services and ports

| Service | Container port | Host port | Purpose |
|---|---:|---:|---|
| `frontend` | 3000 | 3000 | Next.js web UI |
| `backend` | 3001 | 3001 | NestJS REST API |
| `db` | 5432 | 5432 (optional host exposure) | PostgreSQL |

Inside Compose, backend connects to host `db`, not `localhost`. Browser requests use the host-visible API URL; configure it separately from the backend's internal database URL.

## 3. Configuration

1. Copy `.env.example` to `.env` at repository root.
2. Set local development values. Never commit `.env` or real secrets.
3. Expected settings (proposed names; align with application configuration):

```dotenv
POSTGRES_DB=brewlite
POSTGRES_USER=brewlite
POSTGRES_PASSWORD=change-me-local
DATABASE_URL=postgresql://brewlite:change-me-local@db:5432/brewlite?schema=public
JWT_SECRET=replace-with-local-random-secret
API_PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Use URL-encoded credentials in `DATABASE_URL` if password contains URL-reserved characters. Production secrets must come from the deployment environment or secret store.

## 4. Start the stack

After code and Compose manifest exist:

```powershell
docker compose up --build -d
```

Check status and logs:

```powershell
docker compose ps
docker compose logs -f backend
```

Apply migrations and sample menu seed using project-defined commands. Suggested convention (confirm when implementation is added):

```powershell
docker compose exec backend npm run db:migrate
docker compose exec backend npm run db:seed
```

Open the UI at `http://localhost:3000`; API base is `http://localhost:3001`.

## 5. Demo smoke flow

1. Verify `GET /products` returns the sample menu.
2. Browse a drink, select size/topping, and add it to cart.
3. Register or sign in.
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

## 7. Compose manifest expectations

- Add health checks for PostgreSQL and backend readiness; make backend wait for a healthy database.
- Persist PostgreSQL data in a named volume.
- Keep app containers on a private Compose network; expose only ports needed locally.
- Run migrations explicitly or through a controlled one-shot step before demo startup.
- Use a mock payment service and non-sensitive local credentials.
- Exclude `.env`, database files, and secrets from Git.

## 8. Troubleshooting

- **Docker daemon unavailable:** start Docker Desktop and retry `docker compose ps`.
- **Port already in use:** stop the conflicting service or change host port mapping and frontend API URL together.
- **Backend cannot reach DB:** use `db` as hostname inside Compose; confirm DB health and credentials.
- **Schema/table missing:** run migrations and seed data using implementation-defined commands.
- **Browser cannot reach API:** publish backend host port and set `NEXT_PUBLIC_API_URL` to `localhost`, not the Compose-only service name.
- **Frontend shows empty menu:** check backend logs, seed products, and verify API URL.

## 9. Production note

This runbook targets local development and academic demo only. Public deployment needs TLS, managed secrets, restricted database networking, backups, monitoring, real payment integration, and a reviewed production platform configuration.
