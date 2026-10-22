# ADR 001: Use a single repository with independent apps

**Status:** Accepted (fixed by Assignment 2, no vote needed)  
**Date:** 2026-10-19  
**Decision log:** Not in the log; fixed by Assignment 2, section 9  
**Related tasks:** S-01, S-03, S-05

## Context

The assignment requires one repository with `apps/web`, `apps/api`, `docs`, `tests`, and `.github/workflows`. A team of six works on documents, two applications, tests, and pipelines at the same time, and Assignment 2 only accepts later tasks when earlier artifacts are in the repository with clear history.

## Options considered

- One repository with `apps/web` and `apps/api` as independent npm projects (the required layout).
- Separate repositories for the web app, the API, and the documents.
- One repository with a workspace tool such as npm workspaces or Turborepo.

## Decision

Use **one Git repository** with the layout from Assignment 2, section 9. The two apps stay independent npm projects, each with its own `package.json` and lock file. There is no workspace tool and no root `package.json` for now.

## Consequences

**Benefits**

- A single pull request can change code, tests, and documents together, which keeps traceability simple.
- One place for the issue board, CI workflows, and the Docker Compose file.
- No extra tooling to learn.

**Costs and risks**

- Dependencies are installed in each app (`npm install` or `npm ci` twice), and the README must say so.
- CI needs one job per app, ideally with path filters so a docs-only change does not run every job.
- Types are not shared between the apps, so the web app keeps its own typed API client.

**Follow-up**

- Document the per-app install steps in the README (`D-16`).
- Set up CI jobs per app (`S-05`).

## Revisit if

The team needs shared code between the apps, or install and build times become painful. Workspaces can be added later without moving the apps.

---
Back to the [ADR index](README.md). Architecture overview: [architecture.md](../architecture.md).
