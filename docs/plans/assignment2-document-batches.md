# Assignment 2 — document batches

**Status:** Batches 1–3 written on `docs/assignment2-requirements`. Batch 4 not started.  
**Rule:** documents only. No application code in these batches.  
**Related:** Assignment 2 PDF (Requirements to Deployment), [context and scope](../requirements/context-and-scope.md)

Assignment 2 accepts a later task only after the earlier task's required files are in the repository with a visible history. These batches follow that order. Handover documents that need a live URL are last.

## Batch 1 — Task 1 requirements (written)

| File | Required by |
| --- | --- |
| `docs/requirements/context-and-scope.md` | Task 1.1 |
| `docs/requirements/srs.md` | Task 1.2 |
| `docs/requirements/use-case-uc01-place-and-pay.md` | Task 1.3 |
| `docs/diagrams/use-case-system.puml` and `.svg` | Task 1.2 |
| `docs/diagrams/use-case-checkout.puml` and `.svg` | Task 1.3 |

## Batch 2 — Task 2 modeling (written)

| File | Required by |
| --- | --- |
| `docs/diagrams/activity-order-flow.puml` and `.svg` | Task 2.1 |
| `docs/diagrams/sequence-checkout.puml` and `.svg` | Task 2.2. These filenames are the ones named in the PDF. |
| `docs/diagrams/class-domain.puml` and `.svg` | Task 2.3 |

The class diagram must include `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, and `LoyaltyTransaction`. It must not contradict the SRS or the database model.

## Batch 3 — Task 3 architecture documents (written)

| File | Required by |
| --- | --- |
| `docs/architecture/overview.md` | Task 3.1 |
| `docs/architecture/adr/0007-hosting-platform.md` | Task 3.1 |
| `docs/diagrams/deployment-production.puml` and `.svg` | Task 3.2 |

The host is Render, confirmed by the team. ADR number 0006 was already reserved for auth-token storage, so hosting is 0007. The diagram is the intended Render layout. It is not a claim that the services or the production URL exist.

## Batch 4 — handover documents (after deploy, not started)

These are documents, but they are false if written before the pipeline and the production URL exist.

| File | Required by |
| --- | --- |
| `docs/traceability-matrix.md` (rewrite to Assignment 2 columns) | Task 8 |
| `docs/deployment.md` (production, secrets, rollback) | Task 5.4 |
| `README.md` (test, build, deploy, rollback, URLs) | Task 5.4 |
| `docs/delivery/release-notes.md` | Task 5.4 |
| `docs/delivery/sprint-review.md` | Task 5.4 |
| `docs/delivery/sprint-retrospective.md` | Task 5.4 |
| CI evidence (green run and a run that caught a failure) | Task 4.4 |

The demo video is a handover artifact, not a repository file.
