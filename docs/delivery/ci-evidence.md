# CI evidence

**Status:** Workflow file exists. No pipeline run is recorded.  
**Related:** [ADR 0007](../architecture/adr/0007-hosting-platform.md), [NFR-05](../requirements/srs.md), [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

Assignment 2 Task 4.4 asks for a pull request that ran CI, plus proof of one successful pipeline and one pipeline that caught a failure. The workflow file is present. Opening a pull request is what creates the runs. Do not paste a run that has not happened.

Do not add a screenshot of another project, a cropped log, or a made-up Actions URL.

## What to attach later

| Evidence | Link or path | Status |
| --- | --- | --- |
| Workflow file | `.github/workflows/ci.yml` | Present |
| Playwright E2E job | `.github/workflows/ci.yml` (`browser-e2e`) | Configured; no run recorded |
| Pull request whose checks ran | | Not run |
| Successful run: install, lint, unit test, build, API integration, browser E2E | | Not run |
| Failed run that blocked merge | | Not run |
| CD workflow | `.github/workflows/cd.yml` | Present. Not run. |

The failed run must be a real failure of lint, test, or build. A cancelled run does not count. The log must not contain `JWT_SECRET` or `DATABASE_URL`.

## Local commands the pipeline is expected to run

These commands exist today. They are not a substitute for the Actions evidence. The `browser-e2e` workflow job additionally installs Chromium, seeds its temporary database, and runs the Playwright journey.

```powershell
cd apps/api
npm test
npm run test:e2e
npm run lint
npm run build

cd ../web
npm test
npm run lint
npm run build
```

`apps/web` has `npm test` (Vitest). The `browser-e2e` job installs Chromium, migrates and seeds its temporary Postgres service, then Playwright starts the API and web servers and runs `tests/e2e/menu-to-confirmation.spec.ts`. This job is not evidence of a passing run until it has completed successfully in GitHub Actions.
