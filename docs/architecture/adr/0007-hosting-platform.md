# ADR 0007 — Host BrewLite on Render

- **Status:** Accepted
- **Date:** 2026-10-31
- **Deciders:** team, for Assignment 2 Task 3
- **Related:** [Architecture overview](../overview.md), [deployment diagram](../../diagrams/deployment-production.puml), [ADR 0002](0002-monorepo-two-apps.md), [ADR 0003](0003-database-postgres-prisma.md), [ADR 0005](0005-api-contract-conventions.md), [deployment runbook](../../deployment.md)

## Context

Assignment 2 Task 3.2 requires a deployment diagram of the platform the team will actually use. A generic cloud drawing does not pass. The README had already named Render as a proposal, but it pointed at `docs/architecture/adr/004-hosting-platform.md`, which does not exist. ADR 0004 is the payment decision, not hosting.

ADR 0001 reserves number 0006 for UI state and auth-token storage. That file is not written yet. This hosting decision is therefore 0007, not 0006.

The running shape of the system constrains the host:

- Two deployable containers, `apps/web` and `apps/api`, each with its own Dockerfile. There is no root `package.json` (ADR 0002).
- The browser calls the API directly. `NEXT_PUBLIC_API_URL` is baked in at image build time.
- PostgreSQL is required (ADR 0003). Production must not publish the database.
- Payment is an in-process mock (ADR 0004). It is not a third public service.
- The assignment pipeline wants an image tagged by commit SHA, a registry push when the platform needs one, a health check after deploy, and a rollback path.

Render can host two Docker web services and a private Postgres database, with HTTPS on the public services. It can pull prebuilt images from GitHub Container Registry (GHCR). That matches the two-container repo and the required pipeline better than a single VPS Compose file, and it does not require the team to operate a Kubernetes cluster.

This ADR chooses the platform. It does not claim that a production URL, a GitHub Actions workflow, or a Render service already exists.

## Decision

Production runs on **Render**, in one Render account, with three services:

| Service | Render type | Image | Public? |
| --- | --- | --- | --- |
| `brewlite-web` | Web Service | `ghcr.io/<github-owner>/brewlite-web:<commit-sha>` built from `apps/web/Dockerfile` | Yes. HTTPS. |
| `brewlite-api` | Web Service | `ghcr.io/<github-owner>/brewlite-api:<commit-sha>` built from `apps/api/Dockerfile` | Yes. HTTPS. The browser calls it directly. |
| `brewlite-db` | Render PostgreSQL | Managed by Render | No. Internal connection string only. The external connection string is not used by the app and is not shared. |

Rules that follow:

1. **Images are tagged with the full git commit SHA.** `latest` is not the deploy tag. Rollback is "deploy the previous SHA tag", not a hand edit of the running container.
2. **GitHub Actions builds and pushes the images to GHCR.** Render pulls those images. Render's own Git build is not the production path, because the assignment asks for a registry push and a SHA tag when the platform can use them.
3. **The API uses Render's internal database URL.** `DATABASE_URL` is a Render secret. It is not committed and must not be printed in CI logs.
4. **The web image is rebuilt when the API URL changes.** `NEXT_PUBLIC_API_URL` is a Docker build arg set to the public API origin, including `/api/v1`. It is not a secret.
5. **CORS allows only the web origin.** `CORS_ORIGIN` is the public web origin. No wildcard.
6. **Health check path is `GET /api/v1/health`.** That is the path in ADR 0005 and `api-contract.md`. Render's health check on `brewlite-api` uses that path. A successful body is `{ "status": "ok", "version": "v1" }`.
7. **Migrations run before the new API process serves traffic.** The API image already runs `prisma migrate deploy` and then `node dist/main.js`. A failed migration must fail the deploy. Seed is not run automatically in production.
8. **Logs go to stdout.** Render collects them. Logs must not contain `JWT_SECRET`, `DATABASE_URL`, passwords, or tokens.
9. **Local Docker Compose is not production.** Compose may publish Postgres to localhost for development. Render must not.

The production URL is assigned when the Render services are created. Until then, documents say `https://<web-service>.onrender.com` and `https://<api-service>.onrender.com` rather than inventing a live address.

## Consequences

### Positive

- The deployment diagram can name real Render service types, ports, and the private database.
- Rollback has a concrete handle: the previous image SHA in GHCR.
- HTTPS is provided by Render for the two public services. The team does not terminate TLS itself.
- The database can stay off the public internet without a custom firewall script.

### Negative / costs

- Render free instances sleep. A cold start can miss a short health-check window. The smoke test must retry, and a graded demo should wake the services first.
- `NEXT_PUBLIC_API_URL` is fixed at build time, so the web image cannot be promoted to another API URL without a rebuild.
- Two public services mean two origins and a CORS setting that must match exactly.
- GHCR plus Render is more moving parts than "connect the repo and let Render build". The extra part is intentional.

### Gaps this decision does not close

These are still missing. The diagram marks them planned. They are not reasons to draw a different platform.

| Gap | Where it shows |
| --- | --- |
| CI workflow exists. CD and a recorded run do not. | `.github/workflows/ci.yml` runs on pull requests. |
| No Render service and no production URL | URL placeholders only |
| `GET /api/v1/health` is implemented. The public URL is not assigned. | Health arrow is the contract path. Smoke evidence is still open. |
| Compose health check currently calls `GET /api/v1`, and `deployment.md` says `GET /health` | Both disagree with ADR 0005. Production follows ADR 0005. The local docs are a known defect. |
| PWA manifest, icons, and service worker exist. Install still needs HTTPS. | Web service hosts them. |
| Request logs include a request id and are redacted. | `logging.interceptor.ts` and `redact.ts`. |

## Alternatives considered

| Alternative | Why not |
| --- | --- |
| Railway, Fly.io, Azure, AWS, or a VPS | Usable, and the assignment allows them. The team confirmed Render. Drawing one of the others would not match the platform we will use. |
| One VPS running the existing Compose file | Smaller to explain, but the database port is easy to leave public, TLS is our job, and rollback is weaker than an image SHA. |
| Render builds from Git, no registry | Fewer accounts. It does not give the SHA-tagged registry artifact the assignment pipeline asks for. |
| One Render service that serves both apps | Fights ADR 0002. The two Dockerfiles are the deploy boundary. |

## Open questions

| Question | Closes when |
| --- | --- |
| GitHub owner and exact GHCR image names | The CD workflow is added |
| Render region and instance type | The services are created |
| Custom domain, or the default `onrender.com` host | Before the README records the production URL |
| Whether the free-tier sleep is acceptable for grading | Before the demo |
