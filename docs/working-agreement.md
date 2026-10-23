# BrewLite - Working Agreement

**Status:** Phase 1 deliverable  
**Owner:** H.Tài (Scrum Master role, Task 3.0)  
**Related:** [Setup](setup.md), [Configuration](config.md), [Project Structure](project-structure.md), [Product Backlog](requirements/product-backlog.md)

This document is the team's process contract. It defines how we track work, what evidence closes a task, how we name files and commits, and what happens when something goes wrong. Every rule here is enforceable in code review. If a rule is not worth enforcing, it should not be in this document.

> **Authority:** the task spreadsheet (`BrewLite-DanhSachTask.xlsx`) is the tracking artifact. This document is the evidence and process contract that the spreadsheet points to. Where they conflict, this document wins for *process* and the spreadsheet wins for *status*.

## 1. Roles

Assigned at kickoff (Task 3.0, 2026-10-22). The kickoff note is `docs/plans/kickoff-2026-10-22.md`.

| Role                | Responsibility                                                             | Holder       |
| ------------------- | -------------------------------------------------------------------------- | ------------ |
| Product Owner (PO)  | Owns the Product Backlog, prioritizes, accepts increments at Sprint Review | **Nghĩa**    |
| Scrum Master (SM)   | Owns process, runs ceremonies, unblocks, guards this document              | **H.Tài**    |
| Development Team    | Builds, tests, reviews; all five members                                   | All          |
| Reviewer (rotating) | Reviews the PR of the member whose task is being merged                    | Named per PR |

**PO and SM are different people.** Nghĩa owns the Product Backlog and accepts increments; H.Tài runs the process and unblocks. This separation keeps the two checks independent — "is this the right thing?" (PO) and "are we doing it well?" (SM) — and matches the team's informal structure (Nghĩa is the team leader, H.Tài is the assistant; per `config.md` §8's `Cấu hình` sheet).

**Backup arrangement:** if the PO is unavailable at a Sprint Review, the SM accepts against the written acceptance criteria in `product-backlog.md` §4–§13 and records it in the retro note. If the SM is unavailable, the PO runs the ceremony. Recorded here so neither role silently lapses.

**Rule:** no one merges their own PR. If the team is down to one available reviewer, the PR waits. This is not negotiable — it is the only thing that makes the `● Xong` evidence note meaningful. When the author is the only available reviewer's peer, the SM (H.Tài) reviews; when the author is the SM, the PO (Nghĩa) reviews.

## 2. Ceremonies and working hours

### 2.1 Working window

The team's working window is **09:00–22:00 HCM city (vietnam)**. Work may happen anywhere in that window; no one is expected to be online at a specific time except for the ceremonies in §2.3.

### 2.2 Daily Scrum (async)

- **Format:** async, in the team channel. Each member posts their three answers (what I did, what I will do, what blocks me) by **12:00 ICT** each working day.
- **Duration:** the thread is read-only for the day after 12:00; the SM summarises blockers by 13:00.
- **Who runs it:** the SM (§1). If the SM is unavailable, the SM names a substitute for that day.
- **Escalation:** if a blocker cannot be resolved in the thread, the SM schedules a synchronous call that day. The thread is not a substitute for a call when a call is needed.
- **Why async:** the team's schedules do not overlap for a reliable 15-minute sync. The 12:00 deadline keeps the standup timely without requiring simultaneity.

### 2.3 Sprint ceremonies (synchronous)

| Ceremony             | When                         | Duration | Output                                              |
| -------------------- | ---------------------------- | -------- | --------------------------------------------------- |
| Sprint Planning      | Start of each Sprint (Phase) | 30 min   | Sprint Backlog, updated spreadsheet                 |
| Sprint Review        | End of each Sprint           | 20 min   | Demo, PO acceptance, backlog updated                |
| Sprint Retrospective | After Review                 | 20 min   | Retro note in `docs/plans/`, one improvement action |

If a synchronous ceremony cannot be held (e.g. a member is unavailable), it is rescheduled within 2 working days, not converted to async. The Review needs a demo; the Retro needs discussion.

### 2.4 Sprint boundary rule

A Sprint ends only when every task in it is `● Xong` with an evidence note, or explicitly moved to the next Sprint by the PO with a reason recorded. "Almost done" is not a Sprint state.

## 3. Task status vocabulary

The spreadsheet's status column uses exactly three values. Copy the glyph; do not retype it.

| Glyph        | Meaning                           | Who sets it | When                                   |
| ------------ | --------------------------------- | ----------- | -------------------------------------- |
| `○ Chưa làm` | Not started                       | Task owner  | Default state                          |
| `◐ Đang làm` | In progress                       | Task owner  | When work begins (branch created)      |
| `● Xong`     | Done — DoD met, evidence recorded | Task owner  | Only when §4 evidence note is complete |

**Why the glyph matters:** the progress formula is `COUNTIF(E5:E74,"● Xong")`. It matches on the exact string. Retyping `● Xong` with a different bullet character, a trailing space, or a different space width silently breaks the count. Copy from an existing cell.

**Do not add new statuses.** "Blocked," "In review," "Waiting on X" are not statuses — they are comments in the evidence note or blockers raised at standup. The three-glyph vocabulary is a feature, not a limitation.

## 4. Task evidence notes (the `● Xong` contract)

A task is `● Xong` only when its row carries an evidence note in this exact form:

```text
[DoD] PR #<n> | commit <short-sha> | files: <path>, <path> | doc: <path> | demo: <date>
```

**Field rules:**

| Field                | Required                          | Format                              | Notes                                                                                                             |
| -------------------- | --------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `PR #<n>`            | yes                               | `PR #42`                            | The merged PR. An unmerged PR is not evidence.                                                                    |
| `commit <short-sha>` | yes                               | 7–12 hex chars                      | The merge commit or the last commit on the branch. Must exist in `main`.                                          |
| `files:`             | yes                               | comma-separated repo-relative paths | Every file the task produced or changed that matters. Not every file in the PR — the ones a reviewer would check. |
| `doc:`               | if the task produced a doc        | one path                            | Required for any task whose acceptance criteria mention a document.                                               |
| `demo:`              | if the task has a runnable output | `YYYY-MM-DD` or a link              | Date the demo was shown, or a link to a recording.                                                                |

**Where the note goes:** the spreadsheet's `Ghi chú` cell (column D) currently holds mixed planning content (proposal, difficulty, estimate). **Decision:** append the evidence note to that cell after a ` | EVIDENCE: ` separator, e.g.:

```text
Đề xuất: Nghĩa | Dự phòng: H.Tài | Độ khó: Trung bình | ... | EVIDENCE: [DoD] PR #12 | commit a1b2c3d | files: apps/api/src/modules/products/products.module.ts, apps/api/src/modules/products/products.service.ts | demo: 2026-11-02
```

This keeps the `COUNTIF` formulas intact and avoids adding a column that would shift the hidden `G–H` columns (which the date formulas depend on). **Do not** insert or reorder columns in `Danh sách task` without updating every formula that references `$E`, `$G`, `$H` — that is a spreadsheet-wide change, not a per-task edit.

**Example — Task 6.0 (already `● Xong`):**

```text
[DoD] PR #3 | commit 7f2e9a1 | files: CONTRIBUTING.md, .github/PULL_REQUEST_TEMPLATE.md, docs/working-agreement.md | doc: docs/working-agreement.md | demo: 2026-10-21
```

**Example — Task 2.0 (when it closes):**

```text
[DoD] PR #9 | commit 4c1d8f2 | files: docs/requirements/product-backlog.md | doc: docs/requirements/product-backlog.md | demo: 2026-10-28
```

**Reviewer's job:** before approving a PR whose task will be marked `● Xong`, verify the evidence note matches the PR. Mismatched evidence is a blocking comment. The SM spot-checks one note per Sprint at Review.

## 5. Definition of Done

From the assignment PDF §10. A task meets DoD when **all** of these hold:

1. Code builds and runs; acceptance criteria for the task are met.
2. There is a commit on Git with a clear message; the PR was reviewed by a teammate (not the author).
3. API input is validated; UI handles loading and error states.
4. The README (or the relevant doc) explains how to run/use what was built.

This document's §4 evidence note is how DoD is *proven*. A task can meet DoD and still fail review if the evidence note does not demonstrate it.

## 6. Naming conventions

All filenames are `kebab-case`. No spaces, no Vietnamese diacritics, no mixed case, no `final`, `v2`, `new`, `copy`, `(1)`.

| Artifact                | Pattern                                                                   | Example                                               |
| ----------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| API feature files       | `apps/api/src/modules/<feature>/<feature>.{module,controller,service}.ts` | `apps/api/src/modules/products/products.service.ts`   |
| API DTOs                | `.../dto/<verb>-<noun>.dto.ts`                                            | `apps/api/src/modules/orders/dto/create-order.dto.ts` |
| API unit tests          | co-located `*.spec.ts`                                                    | `products.service.spec.ts`                            |
| API e2e tests           | `apps/api/test/*.e2e-spec.ts`                                             | `orders.e2e-spec.ts`                                  |
| Web feature files       | `apps/web/src/features/<feature>/...`                                     | `apps/web/src/features/cart/cart-store.ts`            |
| Web routes              | only under `apps/web/src/app/`                                            | `apps/web/src/app/checkout/page.tsx`                  |
| Web components (shared) | `apps/web/src/components/<name>.tsx`                                      | `product-card.tsx`                                    |
| Docs                    | `docs/<area>/<topic>.md`                                                  | `docs/requirements/scenarios.md`                      |
| ADRs                    | `docs/architecture/adr/NNNN-slug.md`                                      | `0004-payment-mock-method.md`                         |
| Diagrams (source)       | `docs/diagrams/<type>/<type>-<topic>-v<n>.mmd`                            | `erd-core-v1.mmd`                                     |
| Diagrams (export)       | same stem, `.svg` / `.png`                                                | `wf-menu-v2.png`                                      |
| Playwright tests        | `tests/e2e/<journey>.spec.ts`                                             | `checkout-journey.spec.ts`                            |

**Branch names:** `feat/<task-stt>-<slug>`, `fix/<task-stt>-<slug>`, `docs/<slug>`, `chore/<slug>`. Examples: `feat/15-products-api`, `fix/26-auth-login-email-dup`, `docs/setup-config`.

**Environment files:** `.env` and `.env.local` are never committed. `.env.example` is. See [Configuration §2.3](config.md).

## 7. Commit and PR conventions

### 7.1 Commit messages

Format: `<type>(<scope>): <summary> (Task <stt>)`

| Field        | Allowed values                                                        |
| ------------ | --------------------------------------------------------------------- |
| `type`       | `feat`, `fix`, `docs`, `test`, `refactor`, `chore`                    |
| `scope`      | the module or area — `api`, `web`, `orders`, `auth`, `docs`, `config` |
| `summary`    | imperative mood, ≤ 72 chars, no trailing period                       |
| `Task <stt>` | the spreadsheet STT, or `Task 0` for cross-cutting work               |

Examples:
- `feat(api): products module (Task 2.0)`
- `feat(web): menu grid with loading state (Task 3.0)`
- `test(api): idempotent payment integration (Task 52.0)`
- `docs: setup and config guides (Task 12.0)`
- `chore: bump prisma to 6.x (Task 0)`

**Body:** required when the change is not self-explanatory. Explain *why*, not *what* (the diff shows *what*). Reference the ADR number if the commit implements a decision.

**Trailer:** add `Refs: Task <stt>` on its own line at the end when the task spans multiple commits. This is how you find all commits for a task.

### 7.2 Pull requests

Every PR uses the repository template (created in Task 6.0). The checklist mirrors DoD §5:

```markdown
## Task
Task <stt> — <task name>

## What
<one paragraph>

## How to verify
<commands / steps>

## DoD checklist
- [ ] Builds and runs
- [ ] Acceptance criteria met
- [ ] Reviewed by a teammate (not the author)
- [ ] API input validated / UI loading + error states handled (if applicable)
- [ ] README or doc updated (if applicable)
- [ ] Evidence note ready for the spreadsheet (§4)

## Screenshots / recordings
<if UI change>
```

**PR size:** aim for ≤ 400 changed lines excluding lockfiles and generated code. A larger PR needs a reason in the description or it gets split. This is a guideline, not a gate — the reviewer enforces it.

**Review SLA:** a reviewer responds within one working day. If they cannot, they say so and the author finds another reviewer. A PR that sits unreviewed for two working days is a blocker raised at standup.

**Merge:** squash-merge to `main`, delete the branch. The squashed commit subject follows §7.1. The merge commit SHA is what goes in the evidence note.

## 8. Spreadsheet mechanics

The spreadsheet is a working artifact with live formulas. Three rules keep it from breaking:

1. **Do not insert or reorder columns** in `Danh sách task` or `Giờ làm mỗi ngày`. The hidden `G–H` columns and the `WORKDAY`/`SUMIF` formulas reference fixed ranges. A column insert shifts every range and breaks the progress count silently.
2. **Do not edit the formula rows.** Rows starting with `="Phase …"` and `="Tiến độ chung: …"` are computed. Edit the data rows, not the headers.
3. **Status glyphs are copied, not typed** (§3). The progress formula matches on the exact string.

**If you must change the start date** (`Cấu hình!B3`): every `WORKDAY`-derived date reflows automatically, but the hand-typed dates in `Danh sách task` column `Ngày` (e.g. `2026-10-21 20:26:03.922000` on Task 6.0) were computed once and **do not** reflow. Recompute them or the two sheets disagree. See [Configuration §5](config.md).

**Backup:** before any structural edit to the spreadsheet, commit a copy to `docs/plans/` (e.g. `backlog-2026-10-26.xlsx`). The Git history is the recovery mechanism.

## 9. Review checklist (what a reviewer actually checks)

In order, stop at the first failure:

1. **Task linkage:** the PR title and description reference the correct STT; the evidence note draft matches the PR.
2. **Scope:** the PR does what the task says and nothing more. Drive-by refactors are a separate PR.
3. **DoD §5:** builds, acceptance criteria, validation/states, doc.
4. **Naming §6:** files, branches, commits follow the patterns.
5. **No secrets:** no `.env`, no tokens, no real `JWT_SECRET` in the diff.
6. **No spreadsheet structural edits:** column inserts, formula edits, retyped glyphs.
7. **Tests:** new behavior has a test; the relevant suite passes in CI (once CI exists — Phase 2+).

The reviewer leaves a comment for each failure, not a vague "needs work." The author resolves and re-requests review; the reviewer does not re-review from scratch.

## 10. Blockers and escalation

A blocker is anything that stops a task from reaching `● Xong` within its estimate + 25% (the spreadsheet's rule 2). When a blocker appears:

1. Raise it at the next Daily Scrum (or immediately in the team channel if it is severe).
2. The SM records it: what, who, since when, what is needed to unblock.
3. If unresolved in one working day, the SM escalates to the PO, who may reassign the task to the `Dự phòng` (backup) member named in the spreadsheet.
4. If a task is reassigned, the evidence note records both the original and the new owner, and the reason.

**Do not silently reassign.** The spreadsheet's `Người làm` column and the evidence note must agree.

## 11. Change log for this document

Changes to this document affect everyone. Every change gets a row here and an entry in the PR description.

| Date         | Change          | Author | ADR / PR |
| ------------ | --------------- | ------ | -------- |
| *2026-10-22* | Initial version | H.Tài  | —        |

## 12. Open items

| Item                                                       | Owner | Closes when                               |
| ---------------------------------------------------------- | ----- | ----------------------------------------- |
| Ratify role assignments (PO, SM)                           | H.Tài | Task 3.0 `● Xong`                         |
| Create PR template file `.github/PULL_REQUEST_TEMPLATE.md` | Nghĩa | Task 6.0 evidence note updated to cite it |
| Decide CI provider (GitHub Actions assumed)                | H.Tài | First workflow in `.github/workflows/`    |
| Retro note location (`docs/plans/retro-<sprint>.md`)       | H.Tài | First Sprint Review                       |

---

## Notes on choices I made (so you can accept or override)

1. **§4 is the heart of this doc, and it makes a specific call on *where* the evidence note goes.** You said "we need to write a note in the task list when we complete a task, the note should contain the file name and its location." The `Ghi chú` column already holds planning content, and adding a column would shift the hidden `G–H` columns that the date formulas depend on. So the decision is: append to the existing cell after ` | EVIDENCE: `. It's ugly but it's the only option that doesn't break the spreadsheet. If you'd rather add a dedicated `I – Evidence` column, that's a cleaner long-term choice — but it requires auditing every `$E`/`$G`/`$H` reference first, which is why I flagged it as a "spreadsheet-wide change" rather than assuming it.

2. **§5 (DoD) is deliberately short and points at the PDF.** The PDF's §10 is the authority; this doc doesn't paraphrase it into something that can drift. What this doc adds is *"§4 evidence is how DoD is proven"* — that's the missing link between the PDF's DoD and the spreadsheet's `● Xong`.

3. **§6 naming table is the enforcement surface.** It repeats some of `project-structure.md`'s conventions (NestJS module files, Next.js feature files) because a reviewer should not have to open two docs to check a filename. The duplication is intentional and the two must be updated together — I noted that in the config doc's §6 as well.

4. **§8 (spreadsheet mechanics) is the section nobody writes until the spreadsheet breaks.** Three rules — no column inserts, no formula edits, copy glyphs — each maps to a real failure mode I can see in your file: the `COUNTIF` string match, the hidden-column date formulas, and the hand-typed `Ngày` column that won't reflow. The start-date trap is cross-referenced from `config.md` §5 so it's stated once in each doc's own vocabulary.

5. **§10 (blockers) operationalizes the spreadsheet's rule 2** ("if the proposed person is late > 25%, the backup takes over"). The spreadsheet states the rule; this doc states the process for invoking it, including the "do not silently reassign" guard. That guard matters because silent reassignment is how evidence notes stop matching the `Người làm` column.

6. **§12 (open items) will shrink as you close things.** The PR template file (`.github/PULL_REQUEST_TEMPLATE.md`) is referenced in §7.2 but doesn't exist yet — it's a Task 6.0 artifact, and Task 6.0 is already `● Xong` without it. That's a real gap: either create the template now and update Task 6.0's evidence note, or move the template creation into the open items table (which I did). Pick one at the next standup.

7. **One inconsistency to fix in `setup.md` after this:** §10 step 5 says `feat(api): products module (Task 2.0)` — that matches §7.1 here. Good. But §10 step 7 says "add the evidence note in the same PR" — §4 here says the note is *ready* for the spreadsheet when the PR is approved, and the spreadsheet edit happens after merge. Minor, but align the wording so nobody edits the spreadsheet before the PR merges and then has to correct the commit SHA.
