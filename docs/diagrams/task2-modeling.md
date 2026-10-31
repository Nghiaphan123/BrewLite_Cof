# Task 2 — modeling notes

**Status:** Assignment 2, Task 2  
**Owner:** team  
**Related:** [UC-01](../requirements/use-case-uc01-place-and-pay.md), [SRS](../requirements/srs.md), [ADR 0004](../architecture/adr/0004-payment-mock-and-order-lifecycle.md), [schema](../../apps/api/prisma/schema.prisma)

These notes say how to read the three Task 2 diagrams. The PlantUML file is the source. The SVG beside it is the export. If they disagree, the `.puml` wins.

| Diagram | Source | Export | Task |
| --- | --- | --- | --- |
| Activity, end-to-end order | [activity-order-flow.puml](activity-order-flow.puml) | [activity-order-flow.svg](activity-order-flow.svg) | 2.1 |
| Sequence, UC-01 | [sequence-checkout.puml](sequence-checkout.puml) | [sequence-checkout.svg](sequence-checkout.svg) | 2.2 |
| Domain classes | [class-domain.puml](class-domain.puml) | [class-domain.svg](class-domain.svg) | 2.3 |

## Rules these diagrams follow

- Wallet and Card are the payment methods. A demo QR is not a step.
- A new order is `PENDING` and does not reserve stock. Stock decreases only inside the payment transaction that reaches `PAID` (ADR 0004, UC-01, FR-11).
- The PDF asks for a transaction when the order is created and when stock is updated. Those are two transactions, not one. Combining them would contradict the rule that a failed or abandoned payment must not hold stock.
- Payment failure sets `PAYMENT_FAILED`, keeps the cart, and does not change stock or points.
- Not logged in stops the flow before an order is created, unless the customer signs in and returns.
- Out of stock is checked again at payment time. Stock must not go below zero.
- The same `Idempotency-Key` and the same body return the original payment result. A different body with that key is a conflict.
- Money is an integer number of VND. The server total is the one stored.

## Class diagram and the database

The class diagram includes every class the PDF names: `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, and `LoyaltyTransaction`. It also includes `Topping` and `OrderItemTopping`, because those tables exist and an order line is not complete without them.

`LoyaltyTransaction` matches `loyalty_transactions` in the init migration and `schema.prisma`. A paid order with points above zero writes one `EARN` row in the same transaction as the balance update. `REVERSAL` is reserved and is not used by the MVP.

Enums match `schema.prisma`: `OrderStatus`, `Size`, `PaymentMethod`, `PaymentStatus`, `PromotionType`.
