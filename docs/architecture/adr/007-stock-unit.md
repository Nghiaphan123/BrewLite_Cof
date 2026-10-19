# ADR 007: Count stock as finished drinks per product

**Status:** Accepted  
**Date:** 2026-10-19  
**Decision log:** [Decision 7](../../plans/decision-log.md)  
**Related tasks:** C-11, D-09, T-07

## Context

Task 10 says to avoid selling more than the remaining ingredients or products. The minimum data model has `Product.stock`. Tracking ingredients would need recipes and extra tables.

## Options considered

- Finished drinks per product (`Product.stock`)
- Ingredient stock with a recipe table

## Decision

Stock is **finished drinks per product**. All sizes and toppings of a product draw from the same `Product.stock`. An order item with quantity `n` holds `n` units.

## Consequences

**Benefits**

- Matches the minimum data model and keeps the concurrency logic simple.
- No recipe or ingredient tables to build and test.

**Costs and risks**

- Toppings do not have their own stock, so a topping can never run out.
- It is a simplification; a real shop would track ingredients.

**Follow-up**

- The stock is held when the order is created and released exactly once on `CANCELLED`, using the `stockHeld` flag on the order.
- The `Product.version` column supports optimistic locking (ADR 002).

## Revisit if

The shop needs ingredient-level control.

---
Back to the [ADR index](README.md). Architecture overview: [architecture.md](../architecture.md).
