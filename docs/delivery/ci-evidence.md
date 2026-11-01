# CI evidence

**Status:** No pipeline run.  
**Related:** [ADR 0007](../architecture/adr/0007-hosting-platform.md), [NFR-05](../requirements/srs.md)

Assignment 2 Task 4.4 asks for a pull request that ran CI, plus proof of one successful pipeline and one pipeline that caught a failure. This repository has no `.github/workflows` file, so there is no run to paste.

Do not add a screenshot of another project, a cropped log, or a made-up Actions URL.

## What to attach later

| Evidence | Link or path | Status |
| --- | --- | --- |
| Workflow file | `.github/workflows/ci.yml` | Missing |
| Pull request whose checks ran | | Not run |
| Successful run: install, lint, unit test, build | | Not run |
| Failed run that blocked merge | | Not run |
| CD run: image SHA pushed to GHCR, Render deploy, smoke `GET /api/v1/health` | | Not run |

The failed run must be a real failure of lint, test, or build. A cancelled run does not count. The log must not contain `JWT_SECRET` or `DATABASE_URL`.

## Local commands the pipeline is expected to run

These commands exist today. They are not a substitute for the Actions evidence.

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

`apps/web` has `npm test` (Vitest). The menu-to-confirmation browser test is `tests/e2e`. It is not started by GitHub Actions until the CI workflow exists.
