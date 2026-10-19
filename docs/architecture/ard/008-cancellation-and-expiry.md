# ADR 008: Allow owner cancellation with simulated refund and a 15-minute expiry

**Status:** Accepted  
**Date:** 2026-10-19  
**Decision log:** [Decision 8](../../plans/decision-log.md)  
**Related tasks:** C-09, C-11, D-06, FR-15, FR-16

## Context

The assignment diagram allows `CANCELLED` only from `PENDING`, `PAYMENT_FAILED`, and `PAID`. It does not say who cancels, what happens to a paid order, or how long an unpaid order may hold stock.

## Options considered

- Owner cancels in the allowed states, simulated refund, expiry job
- No customer cancel; only expiry
- Cancel allowed after preparation starts (needs extra state-machine edges)

## Decision

- The **order owner** may cancel in `PENDING`, `PAYMENT_FAILED`, and `PAID`. Once a paid order is `PREPARING` or later, the state machine rejects the cancel.
- Cancelling a `PAID` order records a **simulated refund** on the payment (`REFUNDED`) and adds a negative `REVERSAL` `LoyaltyTransaction`.
- `PENDING` and `PAYMENT_FAILED` orders **expire after 15 minutes** through a scheduled job that uses the normal `CANCELLED` transition.
- Stock is released **exactly once**, in the same transaction as the move to `CANCELLED`.

## Consequences

**Benefits**

- No new edges are added to the assignment's state diagram.
- Abandoned orders do not hold stock forever.
- Cancel and release are safe to repeat, so the expiry job can run twice without harm.

**Costs and risks**

- A scheduled job inside the API runs on every instance; this is safe only because cancel is repeatable.
- The refund is only a record; nothing is returned because no real money moves.

**Follow-up**

- `C-09` implements the state machine, the release logic, and the expiry job. The customer cancel screen (UC-08) stays Could.
- UC-01 alternate flow A6 and the SRS (FR-15, FR-16) follow this decision.
- **Open:** does the 15 minutes start at order creation, or restart on a payment retry? The `Order.expiresAt` field supports either; decide before `C-09`.

## Revisit if

Staff need to cancel orders, or the shop wants a different expiry.

---
Back to the [ADR index](README.md). Architecture overview: [architecture.md](../architecture.md).
