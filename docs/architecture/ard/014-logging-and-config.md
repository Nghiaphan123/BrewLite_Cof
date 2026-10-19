# ADR 014: Use structured logs, validated configuration, and build-time web settings

**Status:** Proposed  
**Date:** 2026-10-19  
**Decision log:** New (see architecture.md, sections 9.2 and 9.4)  
**Related tasks:** C-01, C-04, C-13, S-04, S-07

## Context

Task 3.1 asks for logging, a health check, and configuration management. Docker and the hosting platform collect standard output. Next.js inlines `NEXT_PUBLIC_*` values when the web image is built, so the API URL must be known at build time.

## Options considered

- Built-in NestJS logger writing JSON lines
- A dedicated logging library such as `nestjs-pino`
- Runtime configuration endpoint for the web app

## Decision

- **Logging:** one structured JSON line per request (method, path, status, duration, request ID), plus info logs for state transitions, payment outcomes, stock conflicts, and expiry runs. Never log passwords, JWTs, secrets, or full payment details. Logs go to standard output.
- **Configuration:** the API reads environment variables through the NestJS configuration module and **fails at startup** if a required value is missing or invalid.
- **Health:** `GET /health` returns 200 when the API is up and a trivial database query succeeds, and 503 otherwise.
- **Web configuration:** `NEXT_PUBLIC_API_URL` is passed as a **build argument**, so a web image is built for one environment.

## Consequences

**Benefits**

- Logs are searchable on the platform and safe to share.
- Misconfiguration fails fast instead of at the first request.
- One health endpoint serves Compose, the platform, and the CD smoke test.

**Costs and risks**

- A web image is tied to the API URL it was built with; staging and production need separate builds.
- A dedicated logging library might be nicer later but adds a dependency.

**Follow-up**

- `C-04` adds `/health`; `C-13` adds the logging interceptor, exception filter, and configuration validation.
- `S-07` passes the production API URL as a build argument when building the web image **(verify the build step)**.
- Keep `.env.example` as the list of all variables.

## Revisit if

The same web image must run in several environments without rebuilding.

---
Back to the [ADR index](README.md). Architecture overview: [architecture.md](../architecture.md).
