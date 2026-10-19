# BrewLite - Architecture Decision Records

**Version:** 1.0  
**Status:** Draft for team review (task D-11)  
**Related:** [Decision log](../../plans/decision-log.md), [Architecture description](../architecture.md), [Plans overview](../../plans/00-overview.md)

An ADR is a short record of one important decision: the situation, the options, what was chosen and why, and what follows. Assignment 2 (Task 3.1) asks for one ADR per important decision in this folder. The ADRs write up the decisions in the decision log; if the two disagree, fix the disagreement in a pull request.

## 1. Index

| ADR                                   | Decision                                                   | Status                             | Decision log            |
| ------------------------------------- | ---------------------------------------------------------- | ---------------------------------- | ----------------------- |
| [001](001-monorepo.md)                | Single repository with independent apps                    | Accepted (fixed by the assignment) | Assignment 2, section 9 |
| [002](002-orm-prisma.md)              | Prisma as the ORM                                          | Accepted                           | Decision 1              |
| [003](003-cart-state-zustand.md)      | Cart in Zustand with persistence                           | Accepted                           | Decision 2              |
| [004](004-hosting-platform.md)        | Render, with a VPS fallback                                | Proposed (verify)                  | Decision 3              |
| [005](005-payment-mock-provider.md)   | Mock payment provider behind an interface                  | Accepted                           | Decision 4              |
| [006](006-money-and-pricing.md)       | Whole-VND integers and fixed surcharges                    | Accepted                           | Decisions 5 and 6       |
| [007](007-stock-unit.md)              | Stock as finished drinks per product                       | Accepted                           | Decision 7              |
| [008](008-cancellation-and-expiry.md) | Owner cancel, simulated refund, 15-minute expiry           | Accepted                           | Decision 8              |
| [009](009-promotion-loyalty.md)       | Percent and fixed promotions, earn-only points             | Accepted                           | Decision 9              |
| [010](010-diagram-format.md)          | PlantUML with exported SVG                                 | Accepted (confirm with instructor) | Decision 10             |
| [011](011-test-tooling.md)            | Test tools, performance method, browser baseline           | Accepted (browser list to verify)  | Decisions 11 to 13      |
| [012](012-architecture-style.md)      | Modular monolith                                           | Proposed                           | New                     |
| [013](013-auth-token-handling.md)     | Short-lived bearer JWT in the browser                      | Proposed                           | New                     |
| [014](014-logging-and-config.md)      | Structured logs, validated config, build-time web settings | Proposed                           | New                     |

## 2. Status values

| Status     | Meaning                                              |
| ---------- | ---------------------------------------------------- |
| Proposed   | Recommended, not yet agreed by the team              |
| Accepted   | Agreed by the team                                   |
| Superseded | Replaced by a later ADR; the entry names the new one |

Statuses here reflect the decision log as of this draft. Update them when the meeting record in the decision log is filled in.

## 3. Rules

- Do not edit an accepted ADR silently. To change a decision, write a new ADR that supersedes it, mark the old one **Superseded**, and make the change in a pull request that states the reason (Assignment 2, Task 4.2).
- Keep each ADR short: context, options, decision, consequences.
- Number ADRs in order and never reuse a number.
- Items marked **verify** rely on facts that can go stale, such as hosting plan limits or browser support; check them against current documentation.

## 4. Template

```markdown
# ADR NNN: Short title in the form of a decision

**Status:** Proposed | Accepted | Superseded by ADR NNN  
**Date:** YYYY-MM-DD  
**Decision log:** link or "New"  
**Related tasks:** task IDs

## Context
The situation and forces at play.

## Options considered
- Option A
- Option B

## Decision
What we chose, in one or two sentences.

## Consequences
**Benefits** / **Costs and risks** / **Follow-up**

## Revisit if
The condition that would reopen this decision.
```

## 5. Open points found while writing the ADRs

1. **Loyalty uniqueness** (ADR 009): the decision log says a unique `orderId`; the model needs a unique pair (`orderId`, `type`) because of the reversal row. Update the log.
2. **Expiry timing** (ADR 008): does the 15 minutes restart on a retry?
3. **Promotion usage count** (ADR 009): when it increases, and whether cancel gives it back.
4. **Hosting limits** (ADR 004): check Render's current plan limits before accepting.
5. **Diagram format** (ADR 010): confirm with the instructor; the use-case overview and sequence diagram still need converting to PlantUML.
6. **Browser list** (ADR 011): check it against the Next.js version's support list.
7. **Prisma check constraints** (ADR 002): check how the chosen Prisma version handles hand-added checks in migrations.
8. **Web build argument** (ADR 014): confirm the CD build step passes the API URL.