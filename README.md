# BrewLite

BrewLite is a mobile-first web app for ordering coffee at a counter. A customer browses the menu, chooses size and toppings, builds a cart, signs in, pays through a simulated Wallet or Card gateway, and sees the confirmation and order history. It is the course project for Assignment 1 and Assignment 2 (Software Engineering).

> **Status:** Phase 2 (modeling and architecture). The apps are scaffolds; the database schema, seed, and Docker Compose stack exist. Features arrive from Phase 3 on. See the [plan overview](docs/plans/00-overview.md).
>
> This README is the `D-16` skeleton. Test, build, deploy, and rollback sections are completed in later phases.

## Tech stack

| Part      | Technology                                                                  |
| --------- | --------------------------------------------------------------------------- |
| Web       | Next.js (App Router), React, TypeScript, Tailwind CSS, Zustand for the cart |
| API       | NestJS, TypeScript, Prisma ORM, Vitest and Supertest                        |
| Database  | PostgreSQL                                                                  |
| Payment   | Mock provider behind a `PaymentProvider` interface (no real money)          |
| Local run | Docker Compose                                                              |
| Hosting   | Render (accepted, [ADR 0007](docs/architecture/adr/0007-hosting-platform.md)) |

Decisions and their reasons are in the [decision log](docs/plans/decision-log.md) and the [ADRs](docs/architecture/adr/README.md).

## Repository structure

```text
BrewLite/
|-- apps/
|   |-- api/                 # NestJS API, Prisma schema/migrations, port 3001
|   `-- web/                 # Next.js App Router, port 3000
|-- tests/                   # E2E and NFR tests as implementation tasks are added
|-- docs/                    # requirements, diagrams, architecture, plans, testing
|-- .github/                 # PR template and CI/CD workflows
|-- docker-compose.yml
|-- .env.example
`-- README.md
```

This is the monorepo layout. The detailed target tree and conventions for NestJS modules, DTOs, Next.js features, and test placement are in [Project Structure](docs/architecture/project-structure.md). Some target folders are not present until their implementation tasks begin.

## Prerequisites

- Git
- Node.js 24 LTS (`node -v`) and npm
- Docker Desktop with Docker Compose v2, for the database and the full stack

## Install

There is no root `package.json`. Install each app separately:

```powershell
git clone https://github.com/Nghiaphan123/BrewLite_Cof.git
cd BrewLite_Cof
cd apps/api; npm install
cd ../web; npm install
cd ../..
Copy-Item .env.example .env      # macOS/Linux: cp .env.example .env
```

Edit `.env` if you need other local values. Never commit `.env`.

## Run with Docker Compose (whole stack)

```powershell
docker compose up --build -d
docker compose exec api npm run db:seed
docker compose ps
```

- Web: http://localhost:3000
- API: http://localhost:3001
- Opening the web URL starts at sign-in/registration; after successful authentication, BrewLite opens the menu at `/menu`.
- The menu header shows the signed-in customer's name beside the cart; the account dropdown opens profile details, password change, and sign-out.
- The API applies database migrations when it starts. Its health check needs `GET /health`, which arrives with `C-04`; until then `docker compose ps` shows the API as unhealthy even though it answers.

Stop with `docker compose down`; add `-v` to delete the local database. More detail and troubleshooting: [docs/deployment.md](docs/deployment.md).

## Run the apps on your machine (development)

Start only the database in Docker, then run each app in its own terminal:

```powershell
docker compose up -d db

cd apps/api
npm run db:deploy        # apply migrations (DATABASE_URL from .env uses localhost)
npm run db:seed          # sample menu, toppings, users, BREW10 and WELCOME20K
npm run start:dev        # http://localhost:3001

cd apps/web
npm run dev              # http://localhost:3000
```

## Database scripts (`apps/api`)

| Script                | What it does                                     |
| --------------------- | ------------------------------------------------ |
| `npm run db:generate` | Generate the Prisma client into `src/generated/` |
| `npm run db:validate` | Check `prisma/schema.prisma`                     |
| `npm run db:migrate`  | Create and apply a migration (development)       |
| `npm run db:deploy`   | Apply committed migrations (CI, production)      |
| `npm run db:seed`     | Load sample data; safe to run again              |
| `npm run db:reset`    | Drop and rebuild the local database              |

Seeded demo users are `customer01@brewlite.test` to `customer10@brewlite.test`; the password is set by `SEED_USER_PASSWORD` (default in `prisma/seed.ts`). They are demo data only.

## Test and lint

```powershell
cd apps/api
npm test                 # unit tests (Vitest)
npm run test:e2e         # API tests with Supertest
npm run lint
npm run build

cd ../web
npm test                 # unit and integration tests (Vitest)
npm run lint
npm run build
```

The browser journey from menu to confirmation is `tests/e2e`. It is a separate package because this repo has no root `package.json`. Start the database, API, and web first, with the web app pointing at `http://localhost:3001/api/v1`.

```powershell
cd tests/e2e
npm install
npm run test:install
npm test
```

## Build

Each app builds in its own directory. There is no root `package.json`.

```powershell
cd apps/api
npm run build            # prisma generate, then nest build

cd ../web
npm run build            # next build
```

Docker images, from the repository root:

```powershell
docker compose build
```

`NEXT_PUBLIC_API_URL` is baked into the web image at build time. Rebuild the web image after changing it.

## Recent updates

- Auth flow: yêu cầu đăng nhập trước khi vào trang chủ, hỗ trợ đăng nhập/đăng ký, lưu token và thông tin người dùng.
- Profile page: hiển thị thông tin tài khoản, điểm tích lũy, đơn hàng đã mua và đổi mật khẩu.
- Order details: hiển thị đầy đủ sản phẩm, số lượng, size, giá tiền và trạng thái đơn hàng.
- Menu header: thêm nút người dùng với menu (Thông tin chi tiết, Đăng xuất).

The test levels, IDs, and required evidence are in the [test strategy](docs/testing/test-strategy.md). The CI pipeline (`S-05`), test database (`T-02`), and Playwright end-to-end tests (`T-09`) are added in later phases.

## Deploy and rollback

Target platform: Render. Images are tagged with the commit SHA and stored in GHCR. The decision is [ADR 0007](docs/architecture/adr/0007-hosting-platform.md). The steps are in [docs/deployment.md](docs/deployment.md) §9–§12.

These URLs are not assigned. Do not replace them with a guessed host.

| Check | URL |
| --- | --- |
| Web | Not assigned |
| API | Not assigned |
| Health `GET /api/v1/health` | Not assigned |

`GET /api/v1/health` is implemented. Pull requests run [`.github/workflows/ci.yml`](.github/workflows/ci.yml): install, lint, unit test, and build for both apps, plus API integration tests against Postgres. That workflow fails the check when a step fails. GitHub branch protection must require the check before a merge is blocked. No pipeline run is recorded yet. The public health URL is still not assigned. Evidence slots are in [docs/delivery/ci-evidence.md](docs/delivery/ci-evidence.md). There is no production release: [docs/delivery/release-notes.md](docs/delivery/release-notes.md).

Rollback, once a SHA has been deployed, is "deploy the previous image SHA" for both web and API, then call the health URL again. It is not `docker compose down -v`. That command deletes only a local database volume.

## Documentation

| Topic                        | Document                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Plans, phases, task IDs      | [docs/plans/00-overview.md](docs/plans/00-overview.md)                                                                                                        |
| Decisions                    | [docs/plans/decision-log.md](docs/plans/decision-log.md), [docs/architecture/adr/](docs/architecture/adr/README.md)                                           |
| Context, scope, requirements | [context-and-scope.md](docs/requirements/context-and-scope.md), [srs.md](docs/requirements/srs.md), [UC-01](docs/requirements/use-case-uc01-place-and-pay.md) |
| Diagrams                     | [docs/diagrams/](docs/diagrams/)                                                                                                                              |
| Architecture                 | [overview](docs/architecture/overview.md), [folder tree](docs/architecture/architecture.md)                                                                    |
| Testing                      | [docs/testing/test-strategy.md](docs/testing/test-strategy.md), [CI evidence](docs/delivery/ci-evidence.md)                                                   |
| Traceability                 | [docs/traceability-matrix.md](docs/traceability-matrix.md)                                                                                                    |
| Deployment                   | [docs/deployment.md](docs/deployment.md), [ADR 0007](docs/architecture/adr/0007-hosting-platform.md)                                                          |
| Handover                     | [release notes](docs/delivery/release-notes.md), [sprint review](docs/delivery/sprint-review.md), [retrospective](docs/delivery/sprint-retrospective.md)    |
| Contributing                 | [CONTRIBUTING.md](CONTRIBUTING.md) and [.github/pull_request_template.md](.github/pull_request_template.md)                                                  |

## Working rules

- Branch, commit, and PR naming rules and review checklists are in [CONTRIBUTING.md](CONTRIBUTING.md). The PR description template is in [.github/pull_request_template.md](.github/pull_request_template.md).
- All changes go through pull requests with a teammate review; lint, test, or build failures block the merge.
- The Definition of Done is in the [plan overview](docs/plans/00-overview.md#41-definition-of-done-assignment-1-section-10).
