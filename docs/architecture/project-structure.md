# BrewLite - Project Structure

**Status:** Current scaffold and target structure for implementation  
**Related:** [Architecture](architecture.md), [Implementation Plan](../plans/03-implementation-plan.md), [Testing Plan](../plans/04-testing-plan.md)

BrewLite is a Node.js monorepo with two independent npm applications: `apps/api` (NestJS) and `apps/web` (Next.js). Each app has its own `package.json` and `package-lock.json`; install packages from that app's directory. The root currently has no npm workspace package.

## Current generated structure

The following is the structure currently present in the repository. NestJS CLI uses `src` as its `sourceRoot`; Next.js was bootstrapped with the App Router under `src/app`.

```text
BrewLite/
├── apps/
│   ├── api/                          # NestJS 12 application
│   │   ├── src/
│   │   │   ├── app.controller.spec.ts
│   │   │   ├── app.controller.ts
│   │   │   ├── app.module.ts
│   │   │   ├── app.service.ts
│   │   │   └── main.ts
│   │   ├── test/
│   │   │   └── app.e2e-spec.ts
│   │   ├── prisma/
│   │   │   ├── migrations/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   ├── vitest.config.ts
│   │   ├── vitest.config.e2e.ts
│   │   ├── prisma.config.ts
│   │   └── Dockerfile
│   └── web/                          # Next.js 16 App Router application
│       ├── src/app/
│       │   ├── favicon.ico
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── public/
│       ├── package.json
│       ├── package-lock.json
│       ├── next.config.ts
│       ├── tsconfig.json
│       └── Dockerfile
├── docs/
├── .github/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
└── README.md
```

Other generated configuration and documentation files remain in each app directory, including `apps/api/README.md`, `apps/api/oxlint.json`, `apps/web/README.md`, and `apps/web/eslint.config.mjs`.

## Target structure

Grow the generated scaffold by adding feature folders under each app's existing `src/` directory. This keeps NestJS and Next.js file placement consistent with their current configuration and avoids introducing a second top-level `frontend/` or `backend/` directory.

```text
BrewLite/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── common/               # Shared guards, filters, interceptors, pipes
│   │   │   ├── config/               # Environment parsing and validation
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── products/
│   │   │   │   ├── orders/
│   │   │   │   ├── payments/
│   │   │   │   ├── promotions/
│   │   │   │   ├── loyalty/
│   │   │   │   └── health/
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── test/                     # Nest API/e2e integration tests
│   │   ├── prisma/                   # Prisma schema, migrations, and seed
│   │   ├── package.json              # API dependencies and scripts
│   │   └── package-lock.json
│   └── web/
│       ├── src/
│       │   ├── app/                  # URL routes, layouts, loading/error UI
│       │   ├── components/           # UI reused across features
│       │   ├── features/
│       │   │   ├── menu/
│       │   │   ├── product/
│       │   │   ├── cart/
│       │   │   ├── auth/
│       │   │   ├── checkout/
│       │   │   └── orders/
│       │   ├── lib/                  # API client and general utilities
│       │   ├── store/                # Zustand stores, when added
│       │   └── types/                # Types shared across features
│       ├── public/
│       ├── package.json              # Web dependencies and scripts
│       └── package-lock.json
├── tests/
│   ├── e2e/                          # Playwright journeys spanning both apps
│   └── nfr/                          # Performance and NFR checks
├── docs/
│   ├── requirements/
│   ├── diagrams/
│   ├── architecture/
│   │   └── adr/
│   ├── plans/
│   ├── testing/
│   ├── traceability-matrix.md
│   └── deployment.md
├── .github/
│   └── workflows/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
└── README.md
```

The current scaffold has the two apps, API's starter controller/service/module, API tests, Prisma files, Dockerfiles, and now the planned API and web feature directories. Empty directories contain `.gitkeep` so Git tracks the skeleton. Add implementation files when their tasks begin. Root-level cross-app tests and CI workflows remain future additions.

## Node.js packages and commands

Packages are managed per app with npm. Run commands from the directory that owns the package:

```powershell
cd apps/api
npm install package-name
```

For the frontend, use `apps/web` instead. Keep API dependencies in `apps/api/package.json` and web dependencies in `apps/web/package.json`. Commit the matching `package-lock.json` whenever dependencies change. Do not add a root `package.json` or npm workspaces unless the team later chooses to manage both apps from the repository root.

## NestJS feature module convention

Keep each capability's module, controller, service, and request/response DTOs together. With the current Nest CLI configuration (`sourceRoot: "src"`), generate a feature from `apps/api`:

```powershell
cd apps/api
npx nest g module modules/products
npx nest g controller modules/products
npx nest g service modules/products
```

This creates files under `apps/api/src/modules/products/`. Put DTO classes in `apps/api/src/modules/products/dto/`. For example:

```text
apps/api/src/modules/orders/
├── orders.module.ts
├── orders.controller.ts
├── orders.service.ts
└── dto/
    ├── create-order.dto.ts
    └── order-response.dto.ts
```

- A module registers the feature's controllers and providers.
- A controller maps HTTP routes and delegates work to services.
- A service implements use cases and business rules.
- DTOs live with the feature that owns the request/response contract.
- Put cross-cutting behavior in `src/common/`; do not create global `BrewLite.DTO` or `BrewLite.Controller` folders.
- Keep Prisma schema, migrations, seed data, and Prisma configuration under `apps/api/`.

## Next.js feature convention

- `src/app/` defines URL routes, layouts, and route-level loading/error UI.
- `src/features/<name>/` holds feature-specific UI and logic.
- `src/components/` holds UI shared by multiple features.
- `src/lib/` holds the API client and general utilities; feature-only helpers stay in their feature.
- Add `src/store/` for shared Zustand state when needed.
- Put types reused across features in `src/types/`; keep feature-only types with their feature.

## Test placement

- Put unit tests next to the code they exercise or in the owning app's test setup, consistent with its configured runner.
- Use `apps/api/test/` for Nest API integration/e2e tests; the existing API test runner is Vitest.
- Use root `tests/e2e/` for Playwright flows across the running web and API apps when that suite is introduced.
- Use root `tests/nfr/` for performance scripts and NFR evidence.
- Avoid adding a separate test directory to every feature unless the test plan needs one.
