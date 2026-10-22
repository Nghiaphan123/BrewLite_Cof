# BrewLite - Diagram Rules

**Status:** Phase 1 deliverable  
**Owner:** Luân (Task 3.0 / Task 4.0), reviewed by Nghĩa (Task 5.0)  
**Related:** [Project Structure](../project-structure.md) §"Documentation conventions", [Wireframes](../design/wireframes.md) §2, [Scenarios](../requirements/scenarios.md), [API Contract](../architecture/api-contract.md), [ADR 0001](../architecture/adr/0001-record-architecture-decisions.md)

This directory holds BrewLite's diagrams. This README is the rule sheet: what belongs here, what format each diagram type uses, how files are named, and what "done" means for a diagram. Follow it before drawing; the rules exist so the folder doesn't become an unindexed pile of exports.

> **Source of truth:** for ER diagrams and business flows, the **Mermaid source** (`.mmd`) is the source of truth; the rendered `.svg` is a convenience export. For wireframes, the **exported `.png`** is the drawing of record; the editable source (Figma/Excalidraw link) is recorded in `docs/design/wireframes.md` §12. If a rendered image and its source disagree, the source wins for ER/flows and the `wireframes.md` text wins for wireframes.

## 1. What belongs here

| Folder        | Contents                                                                | Source format                                              | Owner doc                                                          |
| ------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------ |
| `erd/`        | Entity-relationship diagrams for the Prisma schema                      | Mermaid `erDiagram` (`.mmd`) + `.svg`                      | `docs/architecture/adr/0003-database-postgres-prisma.md`, Task 1.0 |
| `flows/`      | Business flow diagrams: main path, error/cancel branches, state machine | Mermaid `flowchart` or `stateDiagram-v2` (`.mmd`) + `.svg` | `docs/requirements/scenarios.md`, Task 4.0                         |
| `wireframes/` | Exported screen wireframes                                              | `.png` (2× scale, white background)                        | `docs/design/wireframes.md`, Task 5.0                              |
| `raw/`        | Whiteboard photos, sketches, scratch exports                            | Anything, but **not referenced** from deliverables         | —                                                                  |

**What does not belong here:**
- Screenshots of the running app (those go in PR descriptions, not the repo).
- Architecture diagrams drawn in a tool that exports only raster (draw them in Mermaid, or put them in `raw/` and link from the owning doc).
- Any diagram with no owning doc. Every file in `erd/`, `flows/`, or `wireframes/` must be linked from a doc in §1's "Owner doc" column. An orphan diagram is deleted.

## 2. Format rules by type

### 2.1 ER diagrams (`erd/`)

- **Format:** Mermaid `erDiagram`. One file per diagram scope (e.g. `erd-core-v1.mmd` covers the five MVP entities; a future `erd-promotions-v1.mmd` covers Task 10d's additions).
- **Source of truth:** the `.mmd` file. The `.svg` is regenerated from it and committed alongside.
- **Content rules:**
  - Entity and field names in English, matching `prisma/schema.prisma` exactly (`Product`, `price Int`, `createdAt DateTime`).
  - Every relation has a label (`has many`, `belongs to`) and cardinality (`||--o{`).
  - Enum types are listed as a `note` block, not as entities.
  - The `version` field used for optimistic locking (ADR 0003, ADR 0004 D1) is shown; it's load-bearing.
- **Forbidden:** hand-drawn ER diagrams, screenshots of Prisma Studio as an ERD substitute.

### 2.2 Business flows (`flows/`)

- **Format:** Mermaid `flowchart TD` (or `LR`) for process flows; `stateDiagram-v2` for the order state machine (ADR 0004, PDF §9.1).
- **Source of truth:** the `.mmd` file.
- **Content rules:**
  - Flow nodes are verbs ("Chọn sản phẩm", "Thanh toán"), not nouns.
  - Error/cancel branches are drawn, not left implicit. The assignment's §5 flowchart has a "Hủy / thanh toán lỗi" branch; `flows/main-v1.mmd` must include it, not just the happy path.
  - The state machine diagram (`flows/order-state-v1.mmd`) must match ADR 0004's D1/D5 edges exactly, including `PAYMENT_FAILED → PAID` (retry) and the terminal states.
  - Each flow's owning scenario ID (`scenarios.md` S-MAIN-1, S-PAY-2, etc.) appears in a `%%` comment at the top of the file.
- **Forbidden:** flows that show only the happy path and call it "the flow."

### 2.3 Wireframes (`wireframes/`)

- **Format:** PNG, 2× scale, white background, no device frame, one screen per image.
- **Source of truth:** the exported PNG. The editable source (Figma or Excalidraw) is linked in `wireframes.md` §12, not committed here.
- **Content rules:**
  - Filename matches `wireframes.md` §1's "Image" column exactly (`wf-menu-v1.png`).
  - User-facing labels are Vietnamese; structural labels (`Header`, `Primary`) are English.
  - State annotations (loading, empty, error) are drawn as separate frames in the same image, or explicitly listed in `wireframes.md`'s "States" table for that screen.
  - The header/footer appear on at least the Menu wireframe; other screens may omit them per `wireframes.md` §3.
- **Forbidden:** committing `.fig`, `.excalidraw`, or `.sketch` binaries (they go in `raw/` if kept at all); screenshots of a running prototype presented as a wireframe.

### 2.4 Raw (`raw/`)

- Whiteboard photos, Excalidraw scratch, exploratory sketches.
- **Not referenced from any deliverable.** If a sketch becomes a real diagram, it is redrawn in the proper format and the raw file stays as history.
- No format rules; this folder is the only one where "anything goes" applies. It is excluded from the "every file is linked" rule in §1.

## 3. Naming

All filenames are `kebab-case`. No spaces, no Vietnamese diacritics, no mixed case, no `final`/`v2`/`copy`/`(1)`.

| Type          | Pattern                     | Example                                   |
| ------------- | --------------------------- | ----------------------------------------- |
| ERD source    | `erd-<scope>-v<n>.mmd`      | `erd-core-v1.mmd`                         |
| ERD export    | same stem, `.svg`           | `erd-core-v1.svg`                         |
| Flow source   | `flow-<topic>-v<n>.mmd`     | `flow-main-v1.mmd`, `flow-payment-v1.mmd` |
| Flow export   | same stem, `.svg`           | `flow-main-v1.svg`                        |
| State machine | `flow-order-state-v<n>.mmd` | `flow-order-state-v1.mmd`                 |
| Wireframe     | `wf-<screen>-v<n>.png`      | `wf-menu-v1.png`                          |
| Raw           | free-form, prefixed `raw-`  | `raw-whiteboard-2026-10-22.jpg`           |

**Versioning:** bumping `v<n>` creates a new file. The old file stays until every doc that links it is updated in the same PR. Do not overwrite a committed diagram in place — a reviewer must be able to see "before" and "after."

## 4. Embedding and linking

- Every diagram is embedded in the doc that owns it via a relative link from `docs/`:
  - From `docs/requirements/scenarios.md`: `![Main flow](diagrams/flows/flow-main-v1.svg)` — wait, no: `docs/requirements/` to `docs/diagrams/` is `../diagrams/flows/...`. Use the path that resolves from the embedding doc.
  - From `docs/architecture/adr/0003-...md`: `![Core ERD](../../diagrams/erd/erd-core-v1.svg)`.
- **Do not paste duplicate copies** of a diagram into multiple docs. Link it. If two docs need the same diagram, the one that owns it embeds it and the other links to that doc's section.
- The `.mmd` source is not embedded; only the rendered `.svg` or `.png` is. The `.mmd` is linked from the owning doc's "References" section so a reader can find and edit it.

## 5. Rendering Mermaid

Mermaid renders in GitHub, VS Code (with the Markdown Preview Mermaid Support extension), and most CI doc viewers. For the committed `.svg`:

- Use the Mermaid CLI (`npx @mermaid-js/mermaid-cli -i erd-core-v1.mmd -o erd-core-v1.svg`) or a VS Code "Export diagram" action.
- Commit both the `.mmd` and the `.svg`. The `.svg` is what docs embed; the `.mmd` is what gets edited.
- Do not commit `.png` exports of Mermaid diagrams — SVG is smaller and scales.

## 6. Definition of done for a diagram

A diagram is done when:

- [ ] The source file (`.mmd` or the exported PNG) is in the correct folder per §1.
- [ ] The filename follows §3.
- [ ] It is embedded or linked from its owning doc (§1 "Owner doc" column).
- [ ] Its owning doc references the source file for editing (§4).
- [ ] For flows: error/cancel branches are drawn, not just the happy path (§2.2).
- [ ] For the state machine: it matches ADR 0004's edges exactly (§2.2).
- [ ] For wireframes: the filename matches `wireframes.md` §1 and the screen's route and states are recorded in `wireframes.md`.
- [ ] No orphan: every file in `erd/`, `flows/`, `wireframes/` is linked from a doc.

A diagram that isn't linked is invisible; a diagram that's linked but has no source file can't be edited. Both fail the definition.

## 7. Current inventory (Phase 1)

What exists or is expected by Phase 1 close:

| File                                     | Status                              | Owner doc                             | Task       |
| ---------------------------------------- | ----------------------------------- | ------------------------------------- | ---------- |
| `erd/erd-core-v1.mmd` + `.svg`           | ⬜ expected by Task 1.0 close        | ADR 0003, `product-backlog.md` Task 1 | 1.0        |
| `flows/flow-main-v1.mmd` + `.svg`        | ⬜ expected by Task 4.0 close        | `scenarios.md` §3                     | 4.0        |
| `flows/flow-payment-v1.mmd` + `.svg`     | ⬜ expected by Task 4.0 close        | `scenarios.md` §7                     | 4.0        |
| `flows/flow-order-state-v1.mmd` + `.svg` | ⬜ expected by Task 4.0 / 44.0 close | ADR 0004, `scenarios.md` §9           | 4.0 / 44.0 |
| `wireframes/wf-menu-v1.png`              | ⬜ expected by Task 5.0 close        | `wireframes.md` §4                    | 5.0        |
| `wireframes/wf-product-detail-v1.png`    | ⬜                                   | `wireframes.md` §5                    | 5.0        |
| `wireframes/wf-cart-v1.png`              | ⬜                                   | `wireframes.md` §6                    | 5.0        |
| `wireframes/wf-checkout-v1.png`          | ⬜                                   | `wireframes.md` §7                    | 5.0        |
| `wireframes/wf-confirmation-v1.png`      | ⬜                                   | `wireframes.md` §8                    | 5.0        |
| `wireframes/wf-login-v1.png`             | ⬜                                   | `wireframes.md` §9                    | 5.0        |
| `wireframes/wf-register-v1.png`          | ⬜                                   | `wireframes.md` §10                   | 5.0        |
| `wireframes/wf-history-v1.png`           | ⬜                                   | `wireframes.md` §11                   | 5.0        |

When a diagram is committed, flip its status to ✅ and, if the filename changed from this table, update the table in the same PR.

## 8. Open items

| Item                                                                                      | Owner | Closes when              |
| ----------------------------------------------------------------------------------------- | ----- | ------------------------ |
| Commit `erd-core-v1` (Task 1.0)                                                           | H.Tài | Task 1.0 `● Xong`        |
| Commit `flow-main-v1`, `flow-payment-v1`, `flow-order-state-v1` (Task 4.0)                | H.Tài | Task 4.0 `● Xong`        |
| Commit the 8 wireframe PNGs (Task 5.0)                                                    | Nghĩa | Task 5.0 `● Xong`        |
| Record Figma/Excalidraw links in `wireframes.md` §12                                      | Nghĩa | Same as above            |
| Decide whether the state machine diagram lives here or is embedded only in ADR 0004       | H.Tài | Task 4.0 Sprint Planning |
| Add a `rendered-by` note (Mermaid CLI version) to committed `.svg` files if reviewers ask | Luân  | First diagram PR         |

## 9. References

- [Project Structure](../project-structure.md) §"Documentation conventions" — the repo-wide diagram naming rule this README expands.
- [Wireframes](../design/wireframes.md) §2 — the wireframe export rules (a specialization of this README).
- [Scenarios](../requirements/scenarios.md) — the flows the `flows/` diagrams must match.
- [ADR 0003](../architecture/adr/0003-database-postgres-prisma.md) — the schema the ERD must match.
- [ADR 0004](../architecture/adr/0004-payment-mock-and-order-lifecycle.md) — the state machine edges the state diagram must match.
- [Working Agreement](../working-agreement.md) §6 (naming), §4 (evidence notes cite diagram paths).
- Mermaid docs: https://mermaid.js.org/ (syntax reference for `erDiagram`, `flowchart`, `stateDiagram-v2`).

---

## Notes on choices I made (so you can accept or override)

1. **The doc is a rule sheet first and an inventory second.** §1–§6 are the rules; §7 is the Phase 1 inventory with every file marked ⬜ and its owning task. That split matters: the rules are stable, the inventory churns. A reader looking for "where do I put this diagram?" reads §1–§3; a reader checking "what's left?" reads §7. Mixing them (rules interleaved with file status) would make both harder to scan.

2. **The "source of truth" is different per type, and the README says so in the first paragraph.** For ER/flows, the `.mmd` wins; for wireframes, the PNG wins and the text in `wireframes.md` wins for route/state. This is not pedantry — it's the rule that resolves the "the image and the doc disagree" argument. Without it, a reviewer and a designer could each be right about different files.

3. **§2.2's "error/cancel branches are drawn, not left implicit" is the rule that catches the most common diagram failure.** The assignment's §5 flowchart has a "Hủy / thanh toán lỗi" branch; a student team's first flow diagram usually draws only the happy path. Making the branch a definition-of-done item (§6) means a flow that omits it is *not done*, not "good enough." Same for the state machine: `PAYMENT_FAILED → PAID` (retry) is the edge that's easy to forget and the one the graded test exercises.

4. **§7's inventory is the Phase 1 checklist, and it's deliberately exhaustive** (12 rows). Each row is a file the team will produce in Phase 1 and link from a doc. If the table is filled by Phase 1 close, the "every diagram is linked" rule (§1) is satisfied by construction. If a row is still ⬜ at Phase 1 close, that's a Phase 1 gap, not a Phase 2 task.

5. **The "orphan diagram is deleted" rule in §1 is the one enforcement mechanism.** Without it, `erd/` accumulates `erd-old-v0.mmd`, `erd-draft.mmd`, and a screenshot someone committed once. The rule is: if no doc links it, it goes. That's harsh but it's the only way to keep the folder readable, and it's consistent with `working-agreement.md` §6's no-`final`/`copy` rule for filenames.

6. **I kept the Mermaid CLI command in §5.** It's a small thing, but it's the difference between "commit the `.svg`" (which people skip) and "run this one command, commit both files" (which they can do). The VS Code export option is there for people who won't install the CLI. Either path is fine; the rule is "both files committed."

7. **One forward reference to honor:** §8's "Decide whether the state machine diagram lives here or is embedded only in ADR 0004" is a real fork. If the state diagram is embedded *only* in ADR 0004, then `flows/flow-order-state-v1.mmd` doesn't exist and §7's row is wrong. My recommendation is to keep it in `flows/` (it's a business flow, and ADR 0004 should link to it, not own it) — but if the team prefers ADR-embedded, remove that row from §7 and update ADR 0004 to embed the Mermaid directly. Pick at Task 4.0 Sprint Planning.

8. **The `raw/` folder is explicitly exempt from the "every file linked" rule.** That's the one place where scratch files are allowed, and it's why the rule can be strict everywhere else. Without the exemption, the strict rule would drive people to put sketches in `flows/` (linked to nothing) instead of `raw/` (explicitly unlinked).
