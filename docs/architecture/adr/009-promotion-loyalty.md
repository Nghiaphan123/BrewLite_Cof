# ADR 009: Support percent and fixed promotion codes and earn-only loyalty points

**Status:** Accepted  
**Date:** 2026-10-19  
**Decision log:** [Decision 9](../../plans/decision-log.md)  
**Related tasks:** C-12, T-08, D-04, D-09

## Context

Task 10 requires applying a valid promotion and crediting loyalty points once after payment, but it gives no rules. A paid order can later be cancelled (ADR 008), so points may also need to be reversed.

## Options considered

- `PERCENT` and `FIXED` codes with earn-only points
- Only percent codes
- Points that can also be redeemed

## Decision

- A promotion has a code (uppercase letters and digits), a type (`PERCENT` or `FIXED`), a value, a minimum order total, a validity period, an active flag, and an optional usage limit.
- Seed codes: `BREW10` (10 percent) and `WELCOME20K` (20,000 VND off).
- One code per order; the discount never exceeds the subtotal.
- Points are `floor(paidTotal / 1000)`, credited once per order after `PAID`.
- Redeeming points is **Won't** in this delivery.

## Consequences

**Benefits**

- Covers both common discount types with a small model.
- Points are earn-only, which is all the assignment requires.

**Costs and risks**

- Reversal after a paid cancel adds a second `LoyaltyTransaction` row for the same order.
- A customer's balance could in theory go negative if points were spent, but redeeming is out of scope.

**Follow-up**

- **Correction to the decision log:** the log says a unique `orderId` on `LoyaltyTransaction` enforces one credit. That would also block the reversal row. Use a unique pair (`orderId`, `type`) so each order has at most one `EARN` and one `REVERSAL`. Decision 9 in the log was updated to match (decision log version 0.2).
- **Open:** when `usedCount` goes up (at order creation or at `PAID`) and whether it is given back on cancel; decide before `C-12`.
- `T-08` uses the seeded codes.

## Revisit if

The shop wants point redemption or per-customer limits.

---
Back to the [ADR index](README.md). Architecture overview: [architecture.md](../architecture.md).
