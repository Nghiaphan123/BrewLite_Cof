# BrewLite - Project Structure

**Status:** Current scaffold and target structure for implementation  
**Related:** [Architecture](architecture.md)

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
│   ├── setup.md                      # Onboarding: install, run, verify
│   ├── config.md                     # Env vars, ports, constants, planning assumptions
│   ├── working-agreement.md          # Task evidence notes, naming, commit/PR rules
│   ├── requirements/
│   │   ├── product-backlog.md        # 10 backlog tasks + acceptance criteria
│   │   └── scenarios.md              # Main and error/cancel business flows
│   ├── architecture/
│   │   ├── adr/
│   │   │   ├── 0001-record-architecture-decisions.md
│   │   │   ├── 0002-monorepo-two-apps.md
│   │   │   ├── 0003-database-postgres-prisma.md
│   │   │   ├── 0004-payment-mock-method.md
│   │   │   └── 0005-api-contract-conventions.md
│   │   ├── architecture.md/project-structure.md
│   │   └── api-contract.md           # Endpoints, request/response JSON, error codes
│   ├── design/
│   │   ├── ui-decisions.md           # Stack, tokens, state management, states
│   │   └── wireframes.md             # Index of the 5 MVP wireframes with routes
│   ├── diagrams/
│   │   ├── README.md                 # Diagram format rules and naming
│   │   ├── erd/                      # Mermaid ER diagrams
│   │   ├── flows/                    # Mermaid business flow diagrams
│   │   ├── wireframes/               # Exported wireframe images
│   │   └── raw/                      # Whiteboard/sketch sources (not referenced)
│   ├── plans/                        # Sprint plans, burndown templates
│   ├── testing/                      # Test plans and NFR evidence (Phase 2+)
│   ├── traceability-matrix.md        # Task ↔ acceptance criteria ↔ evidence (Phase 2+)
│   └── deployment.md                 # Docker, env, run instructions (Phase 2+)
├── .github/
│   └── workflows/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
└── README.md
```

The current scaffold has the two apps, API's starter controller/service/module, API tests, Prisma files, Dockerfiles, and now the planned API and web feature directories. Empty directories contain `.gitkeep` so Git tracks the skeleton. Add implementation files when their tasks begin. Root-level cross-app tests and CI workflows remain future additions.

Directories marked **(Phase 2+)** in the `docs/` tree are placeholders for now: create them with `.gitkeep` but do not populate them until their owning task starts. All other `docs/` entries are Phase 1 deliverables — see "Documentation conventions" below.

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

## Documentation conventions

The `docs/` tree is the single source of truth for decisions, run instructions, and evidence. The following rules apply to every file under `docs/`:

### File naming

- `kebab-case` for all filenames. No spaces, no Vietnamese diacritics, no mixed case.
- Markdown files use `.md`. Diagram sources use `.mmd` (Mermaid). Exported diagram images use `.svg` for flows/ERDs and `.png` for wireframes.
- ADRs follow `NNNN-slug.md` with a zero-padded four-digit number (e.g. `0003-database-postgres-prisma.md`). Numbers are never reused or reordered; a superseded ADR stays in place with its status updated to `Superseded by NNNN`.
- Diagram files follow `<type>-<topic>-v<n>.<ext>` (e.g. `erd-core-v1.mmd`, `wf-menu-v2.png`). Bumping `v<n>` creates a new file; the old one is kept until the doc referencing it is updated.

### Diagram rules

- Mermaid source is the source of truth for ER diagrams and business flows. The `.mmd` file lives in `docs/diagrams/erd/` or `docs/diagrams/flows/`; a rendered `.svg` sits next to it.
- Wireframes are drawn in Figma or Excalidraw; export a `.png` into `docs/diagrams/wireframes/` and keep the editable link in `docs/design/wireframes.md`. Do not commit binary design-tool files.
- Whiteboard photos and sketches are allowed only under `docs/diagrams/raw/` and must never be linked from a deliverable doc.
- Every diagram is embedded in the doc that owns it via relative link. Do not paste duplicate copies into multiple docs.
- Entity and field labels are English; user-facing wireframe text may be Vietnamese.

### Task evidence notes

- The task spreadsheet (`BrewLite-DanhSachTask.xlsx`) is the tracking artifact; `docs/` holds the evidence it points to.
- When a task's status changes to `● Xong`, its row must carry an evidence note in the form:
  `[DoD] PR #<n> | commit <short-sha> | files: <path>, <path> | doc: <path> | demo: <date>`
- Evidence file paths must follow the naming rules above and must point to a file that exists in the repository at the recorded commit.
- Status glyphs are copied verbatim from the spreadsheet (`○ Chưa làm`, `◐ Đang làm`, `● Xong`); the progress formula `COUNTIF(...,"● Xong")` matches on the exact string, so retyping the glyph breaks the count.
- The authoritative evidence format, status vocabulary, and commit/PR message convention are defined in `docs/working-agreement.md`.

### Phase ownership

- **Phase 1** populates `setup.md`, `config.md`, `working-agreement.md`, `requirements/`, `architecture/` (all five ADRs and `api-contract.md`), `design/`, and `diagrams/README.md` plus the `erd/`, `flows/`, and `wireframes/` subfolders.
- **Phase 2+** populates `plans/`, `testing/`, `traceability-matrix.md`, and `deployment.md`.
- When a Phase 1 doc introduces a new top-level `docs/` entry, update this section in the same commit so the tree and the rules never diverge.