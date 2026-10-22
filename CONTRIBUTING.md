# Contributing to BrewLite

This guide defines the team's branch, commit, and pull request workflow. Follow it for each task so changes can be traced, reviewed, and merged consistently.

## 1. Branching strategy

`main` is the stable branch used for CI/CD and deployment. Do not code or push directly to `main`, except for the initial repository setup commit. All later changes go through a pull request.

Create one branch per task using:

```text
<type>/<short-feature-name>
```

Use lowercase kebab-case. Include the task ID in the commit and PR description/title, not in the branch name.

| Prefix | Use | BrewLite examples |
|---|---|---|
| `feat/` | New frontend or backend behavior | `feat/fe-menu`, `feat/auth-jwt`, `feat/orders-api` |
| `docs/` | Requirements, use cases, plans, diagrams | `docs/task1-context`, `docs/task2-sequence-checkout` |
| `test/` | Unit, integration, or end-to-end tests | `test/task10-concurrency`, `test/e2e-checkout` |
| `ci/` | GitHub Actions and CI pipeline | `ci/github-actions` |
| `chore/` | Docker, repository structure, maintenance | `chore/monorepo-restructure` |
| `fix/` | Bug fixes and failed CI issues | `fix/prisma-seed-duplicate`, `fix/fe-suspense-build` |

Do not include a person's name, date, or temporary status in the branch name. Delete the branch after its PR has merged when it is no longer needed.

## 2. Six-step task workflow

Run steps 1-2 once when starting a new task, then steps 3-6 to finish and merge it. Do not create a new branch every day for work that is still in progress. These steps reduce conflicts but cannot guarantee that conflicts never occur; coordinate ownership of shared files and keep pull requests focused.

### Step 1: Start from the latest `main`

Make sure the working tree is clean before switching branches. If you have uncommitted work, commit it on its task branch or safely stash it first.

```powershell
git checkout main
git pull --ff-only origin main
```

### Step 2: Create a task branch

Example: start work on the cart screen.

```powershell
git checkout -b feat/fe-cart
```

If you resume the same task on a later day, keep using its existing feature branch; do not create another branch. To bring that branch up to date with newly merged work, run the following while on your feature branch and resolve any conflicts before continuing:

```powershell
git fetch origin
git merge origin/main
``` 

### Step 3: Review and stage only your task files

After coding, drawing, or writing documentation:

```powershell
git status --short
git diff
```

Stage only files related to the task; prefer explicit file paths. For example:

```powershell
git add apps/web/src/features/cart/
# or, for a documentation-only task
git add docs/requirements/context-and-scope.md docs/diagrams/

git diff --cached
```

Never stage `.env`, credentials, real payment data, generated output, or another person's unfinished work. If a directory contains unrelated changes, stage individual files instead of the whole directory.

### Step 4: Commit with Conventional Commits

Use:

```text
<type>(<scope>): <short description> (Task <assignment.task>)
```

The task suffix identifies the source assignment and task number. Keep the message specific and explain the reason in the body when the summary is not enough.

```powershell
git commit -m "feat(fe-cart): implement cart state and total calculation (Task 5)"
```

More examples:

```text
feat(fe-menu): render product grid with loading and empty states (Task 3)
feat(fe-cart): implement Zustand cart store and total calculation (Task 5)
docs(requirements): add stakeholder table and scope to context-and-scope.md (Task 1.1)
docs(diagrams): add checkout sequence diagram source and export (Task 2.2)
feat(payments): implement idempotent payment with Idempotency-Key (Task 10.2)
```

Use commit types `feat`, `fix`, `docs`, `test`, `ci`, or `chore`. Use a scope that identifies the affected feature or area, such as `fe-menu`, `payments`, or `diagrams`.

### Step 5: Push your branch

```powershell
git push -u origin feat/fe-cart
```

For later updates to the same branch, use `git push`.

### Step 6: Open, review, and merge a pull request

1. Open the repository on GitHub and create a PR with base branch `main`.
2. Use a clear title, for example: `[Sprint 2] Task 5: Implement Cart State & UI`.
3. Fill in the PR description: what changed, linked requirement/user story, tests/checks run, and any migration or follow-up.
4. Assign one teammate who did not author the change as reviewer.
5. The reviewer checks **Files changed**, leaves actionable comments, and approves only when satisfied.
6. Merge after required CI checks pass and review comments are resolved. Prefer squash merge.

## 3. Pull request review checklist

### Author

- [ ] PR targets `main` and identifies the task and assignment requirement.
- [ ] Description explains the change and why it is needed.
- [ ] Tests/checks run and their results are recorded; skipped checks are explained.
- [ ] UI changes include screenshots where useful; API changes include examples where useful.
- [ ] Requirements, diagrams, traceability, migrations, environment, or deployment notes are updated when affected.
- [ ] Only task-related files are included; no secrets or generated build output are present.

### Reviewer

- [ ] Scope matches the task's acceptance criteria, including failure paths.
- [ ] API DTO validation, authentication, and resource ownership are correct where applicable.
- [ ] Backend remains authoritative for price, payment outcome, and order state.
- [ ] Database changes include a migration and preserve data/constraints.
- [ ] Tests cover changed behavior; relevant lint, test, and build checks pass.
- [ ] UI handles loading, empty, and error states where applicable.
- [ ] Documentation and traceability links match the implementation.
- [ ] No unresolved comments or merge conflicts remain.
- [ ] At least one teammate approval is recorded before merge.

## 4. Pull request template

GitHub uses [`.github/pull_request_template.md`](.github/pull_request_template.md) to prefill the PR description. Complete every applicable section before requesting review.
