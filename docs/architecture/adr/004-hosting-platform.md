# ADR 004: Deploy to Render, with a VPS as the fallback

**Status:** Proposed (verify before accepting)  
**Date:** 2026-10-19  
**Decision log:** [Decision 3](../../plans/decision-log.md)  
**Related tasks:** S-06, S-07, S-08, D-12, D-15

## Context

Assignment 2 needs a production URL over HTTPS, a database that is not public, secrets kept out of the repository, a deploy pipeline with a smoke test, and a rollback. The platform must be one the team actually uses, and the deployment diagram must show it. The URL must be live when the work is graded.

## Options considered

- Render (Docker)
- Railway
- Fly.io
- Azure
- AWS
- One small VPS running Docker Compose with Caddy for automatic HTTPS

## Decision

Use **Render**, deploying Docker images for the web app and the API with a managed PostgreSQL database on the private network. If Render's plan limits do not fit, fall back to **one small VPS running Docker Compose with Caddy**.

## Consequences

**Benefits**

- Automatic HTTPS, private networking for the database, health checks, and rollback to an earlier deploy.
- Fits the existing Docker setup.
- AWS and Azure add setup cost this scope does not justify.

**Costs and risks**

- Free plans may sleep or limit database lifetime, which conflicts with the 500 ms target (risk R8) and with the rule that the URL is live at grading.
- Vendor-specific settings must be written down so the setup can be recreated.
- The VPS fallback means the team operates the server and its security updates.

**Follow-up**

- Before accepting, check the current plan limits, that the database is not publicly reachable, health-check support, and how rollback works.
- `S-06` provisions the web service, API service, and database. `D-12` draws the deployment diagram from the real setup. `S-07` deploys by image tag (commit SHA).
- Pass the production API URL to the web image as a build argument (see ADR 014).
- Consider a low-cost paid plan shared by the team if the free tier is not enough.

## Revisit if

Plan limits make the production URL unreliable, or the team cannot create the database privately on the chosen plan.

---
Back to the [ADR index](README.md). Architecture overview: [architecture.md](../architecture.md).
