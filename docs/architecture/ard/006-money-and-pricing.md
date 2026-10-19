# ADR 006: Store money as whole VND integers and price options with fixed surcharges

**Status:** Accepted  
**Date:** 2026-10-19  
**Decision log:** [Decisions 5 and 6](../../plans/decision-log.md)  
**Related tasks:** C-06, C-15, D-04, D-09

## Context

Prices appear in the wireframes in VND (for example 45.000đ). Floating-point money causes rounding errors, and the server must recompute prices because the client is not trusted. The assignment does not define size and topping prices.

## Options considered

- Whole VND as integers
- Decimal columns or floating point
- Different surcharges per product

## Decision

Prices and totals are **whole VND integers**, with no decimals and no floating-point math. `Product.price` is the price for size S.

| Option | Surcharge (VND) |
|---|---:|
| Size S | 0 |
| Size M | +5,000 |
| Size L | +10,000 |
| Each topping | +5,000 |

- `unitPrice = basePrice + sizeSurcharge + sum of topping prices`
- `lineTotal = unitPrice x qty`
- Percent discount: `floor(subtotal x percent / 100)`. A fixed discount never exceeds the subtotal. `total = subtotal - discountAmount`, never below zero.

## Consequences

**Benefits**

- No rounding errors; simple, testable formulas.
- Easy to recompute on the server and to display with thousands separators.

**Costs and risks**

- A percent discount is rounded down, so a customer may get up to 1 VND less than the exact value; this is an accepted rule.
- Surcharges are global, so a drink that should cost more for size L needs a different rule later.

**Follow-up**

- Apply the surcharges in the table above through configuration or seed data, not hard-coded in the UI.
- Store the computed `unitPrice` and `lineTotal` on `OrderItem`, and a price snapshot on `OrderItemTopping`.
- The wireframe total (123.000đ) is illustrative only; `D-04` acceptance criteria use these amounts.

## Revisit if

The shop needs per-product surcharges or non-VND currency.

---
Back to the [ADR index](README.md). Architecture overview: [architecture.md](../architecture.md).
