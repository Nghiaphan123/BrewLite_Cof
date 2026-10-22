# ADR 0001 — Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-22
- **Deciders:** H.Tài, Nghĩa, Luân (full team at kickoff)
- **Related:** [Working Agreement](../../working-agreement.md), [Project Structure](../../project-structure.md), [Configuration](../../config.md)

## Context

BrewLite is a 5-person student team building an MVP over one semester. The team will make architectural decisions that are easy to make once and expensive to rediscover:

- Which database and ORM (PostgreSQL + Prisma vs. alternatives).
- How the two apps relate (independent npm apps vs. a workspace).
- How payment is simulated and where idempotency lives.
- How the API shapes requests, responses, and errors.
- Where the auth token is stored and what that trades off.

Without a record, these decisions live in chat history, in a PR description, or in one person's head. New team members (and the grader) cannot see *why* a choice was made, only *what* it is. When a decision is revisited — and several will be, per `config.md` §7 and `scenarios.md` §13 — the team re-argues from scratch, or worse, changes one side of a coupled decision and breaks the other.

The assignment's Definition of Done (PDF §10) requires a README and reviewed commits, but it does not prescribe how decisions are documented. The team needs a lightweight mechanism that is versioned with the code, reviewable in a PR, and does not add ceremony to small choices.

## Decision

BrewLite records architecture decisions as **Architecture Decision Records (ADRs)** in `docs/architecture/adr/`, following these rules:

1. **One decision per file.** An ADR records a single decision and its consequences. If a PR makes two unrelated architectural choices, it produces two ADRs.
2. **Numbered and immutable.** Files are named `NNNN-slug.md` with a zero-padded four-digit number. Numbers are assigned in creation order and never reused or reordered. A superseded ADR stays in place with its status updated to `Superseded by NNNN`; it is not deleted.
3. **Status is explicit.** Each ADR has a status: `Proposed`, `Accepted`, `Rejected`, `Superseded by NNNN`, or `Deprecated`. Only `Accepted` ADRs are binding.
4. **Fixed structure.** Each ADR has: title, status, date, deciders, related links, Context, Decision, Consequences, and (when relevant) Alternatives considered and Open questions. The template is in §"Template" below.
5. **Written in the same PR as the decision.** An ADR is created or updated in the PR that implements the decision, not in a follow-up. A PR that implements an architectural choice without an ADR fails review (`working-agreement.md` §9, checklist item 1).
6. **`Proposed` is allowed for open decisions.** When a decision is not yet made, the ADR is created with status `Proposed` and the open questions listed. `config.md` §7 and `scenarios.md` §13 point at `Proposed` ADRs, not at unwritten ones.

The following decisions are already identified as needing ADRs, and their numbers are reserved:

| ADR  | Topic                                                   | Status                                       |
| ---- | ------------------------------------------------------- | -------------------------------------------- |
| 0002 | Monorepo: two independent npm apps, no root workspace   | Accepted (mirrors current scaffold)          |
| 0003 | Database: PostgreSQL + Prisma                           | Proposed → Accepted when Task 1.0 ERD closes |
| 0004 | Payment mock, order state machine, idempotency          | Proposed → Accepted when Task 8/10 close     |
| 0005 | API contract conventions (envelope, errors, versioning) | Proposed → Accepted when Task 7.0 closes     |
| 0006 | UI state and auth token storage                         | Proposed → Accepted when Task 5.0 closes     |

## Consequences

### Positive

- **Decisions are reviewable.** An ADR is a Markdown file in a PR; the reviewer can object to the *reasoning*, not just the code.
- **Onboarding is faster.** A new teammate reads 0001–0006 in 15 minutes and knows why the repo looks the way it does.
- **Revisiting is cheap.** When a decision is challenged, the team reads the original Context and Consequences instead of re-arguing. If the context changed, a superseding ADR is written; if it didn't, the original stands.
- **The grader can see process.** The assignment values Agile process (PDF §2, §11). ADRs are evidence that architectural choices were deliberate, not accidental.
- **Coupling is explicit.** Decisions that touch multiple docs (e.g. the price rule in `ui-decisions.md` §4.2 and `product-backlog.md` Task 4/6) are named in one ADR, so a change to one side has a single place to check.

### Negative / costs

- **A small amount of ceremony.** Even a one-line decision gets a file. The team accepts this because the alternative (chat history) is worse for a graded deliverable.
- **ADRs can go stale.** If a decision changes and the ADR is not updated, the ADR becomes misleading. Mitigation: rule 5 (same PR) and the `Superseded by` convention; the SM spot-checks one ADR per Sprint at Retrospective.
- **Not every decision needs an ADR.** Naming a component, choosing a font, picking an icon library — these are not ADR-worthy. The boundary is "would a future teammate ask *why*?" If yes, ADR; if no, a note in the relevant doc is enough.

### Neutral

- ADRs do not replace `docs/config.md`, `docs/architecture/api-contract.md`, or the design docs. They *point at* those docs for the details; they record the decision and its reasoning, not the full specification.
- ADRs are not a substitute for tests. A decision like "stock decrements at payment success" still needs the test in `scenarios.md` S-ORD-6 to prove the implementation matches.

## Alternatives considered

| Alternative                                            | Why rejected                                                                                                                                                                                                          |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **No formal record; rely on PR descriptions and chat** | Not versioned with the code, not discoverable, and lost when a member leaves. Fails the "reviewable" requirement.                                                                                                     |
| **A single `docs/architecture.md` with all decisions** | Grows unbounded, every decision edit touches the same file (merge conflicts), and there is no per-decision status. The scaffold already points to `architecture.md` for the overview, but the decisions live in ADRs. |
| **A wiki or Notion page**                              | Outside the repo, not reviewable in a PR, and not part of the graded source handover (PDF §11).                                                                                                                       |
| **RFC-style long-form documents**                      | Too heavy for a 5-person MVP; the team would write zero. ADRs are the minimum that works.                                                                                                                             |
| **Decision log in the spreadsheet**                    | Not reviewable, not linkable, and the spreadsheet is already a working artifact with formula fragility (`config.md` §5, `working-agreement.md` §8).                                                                   |

## Template (used by ADR 0002 onward)

```markdown
# ADR NNNN — Title

- **Status:** Proposed | Accepted | Rejected | Superseded by NNNN | Deprecated
- **Date:** YYYY-MM-DD
- **Deciders:** names
- **Related:** links to docs, PRs, other ADRs

## Context

What is the situation that forces a decision? What constraints (assignment, time, team, tools) apply? What happens if nothing is decided?

## Decision

What was decided, in one or two sentences. Then any rules that follow from it.

## Consequences

### Positive
### Negative / costs
### Neutral

## Alternatives considered

Table: alternative | why rejected.

## Open questions (optional)

List, each with an owner and a closing condition. If any exist, status is `Proposed`.
```

## Open questions

| Question                                                                                  | Owner | Closes when                |
| ----------------------------------------------------------------------------------------- | ----- | -------------------------- |
| Confirm the reserved ADR numbers 0002–0006 match `config.md` §7 and `scenarios.md` §13    | H.Tài | This ADR is `Accepted`     |
| Decide whether `0006` (UI state and auth token storage) is separate or folded into `0005` | Nghĩa | Task 5.0 closes            |
| Agree on the SM spot-check cadence for stale ADRs                                         | H.Tài | First Sprint Retrospective |

## References

- Assignment PDF §10 (Definition of Done), §11 (handover).
- [Working Agreement](../../working-agreement.md) §9 (review checklist), §11 (change log).
- [Configuration](../../config.md) §7 (open items that point at ADRs).
- [Scenarios](../../requirements/scenarios.md) §13 (open decisions D1–D6).
- Michael Nygard, "Documenting Architecture Decisions" (the original ADR pattern this follows).

---

## Notes on choices I made (so you can accept or override)

1. **This ADR is longer than a typical meta-ADR, on purpose.** The usual "we will use ADRs" decision is three sentences. But your team is a student team being graded on process, and the meta-decision has to *justify itself* to a grader who may not know what an ADR is. The Context section names the specific decisions (DB, payment, API, auth token) that would otherwise be lost, and the Alternatives table names the wiki/Notion/RFC options so the choice reads as considered rather than assumed.

2. **I reserved ADR numbers 0002–0006 in a table.** `config.md` §7, `scenarios.md` §13, `product-backlog.md` §17, and `ui-decisions.md` §11 all forward-reference ADRs by number (0003, 0004, 0005, 0006). If this ADR didn't pin those numbers, each of those docs would be pointing at a number that may or may not exist. The reservation table is the contract those forward references depend on — it's why `config.md` can say "ADR 0003" and mean something specific.

3. **The template's "Open questions" section is what makes `Proposed` a usable status.** Rule 6 says open decisions get a `Proposed` ADR with open questions listed. Without a place to put those questions, `Proposed` would be a status with no content, and the team would go back to "we'll write it later." The open-questions table gives each question an owner and a closing condition — the same pattern as `config.md` §7 and `scenarios.md` §13, applied at the ADR level.

4. **"Written in the same PR as the decision" is the enforcement rule, and it's stated twice** (rule 5 and the Negative/costs mitigation). This is the ADR equivalent of `working-agreement.md` §4's "evidence note in the same PR" — a decision that's implemented but not recorded is a review failure, not a follow-up task. Stating it twice is deliberate: once as a rule, once as the answer to "but what if we forget?"

5. **The "not every decision needs an ADR" paragraph is the most important sentence for the team's sanity.** Without it, the rule becomes "everything gets an ADR," which burns out the team by Week 2 and produces 40 ADRs nobody reads. The boundary — "would a future teammate ask *why*?" — is deliberately a judgment call, not a checklist, because the alternative (a list of what does/doesn't qualify) would be wrong in both directions.

6. **One structural choice to confirm:** ADRs use `- **Status:**` bullet metadata (not a YAML front matter block). If your team prefers front matter for tooling (e.g. a static-site generator later), switch now — changing 6 ADRs' format later is annoying. I chose bullets because they render in plain Markdown viewers, GitHub, and VS Code preview without a parser, which matters for a repo that will be handed to a grader.

7. **Forward reference to watch:** this ADR's open-questions table says "decide whether 0006 is separate or folded into 0005." That's a real fork. If you fold it, `ui-decisions.md` §11's "Create ADR 0006" row and `config.md` §7's open items need updating in the same PR. If you keep it separate (my recommendation — auth token storage is a security decision, API conventions is a compatibility decision; different audiences), leave the reservation as-is.
