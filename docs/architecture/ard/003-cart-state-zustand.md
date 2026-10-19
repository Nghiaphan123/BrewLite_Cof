# ADR 003: Keep the cart in Zustand with persistence

**Status:** Accepted  
**Date:** 2026-10-19  
**Decision log:** [Decision 2](../../plans/decision-log.md)  
**Related tasks:** C-16, C-18

## Context

The checkout flow sends a signed-out customer to sign in and must keep the cart (alternate flow A1). A failed payment must also leave the cart available for retry (FR-06). React Context alone loses its state on a page reload.

## Options considered

- Zustand with the `persist` middleware (localStorage)
- React Context only
- Cart stored on the server for signed-in users

## Decision

Use **Zustand with `persist`**. The persisted state holds only the cart items and options, never prices as authority.

## Consequences

**Benefits**

- The cart survives reloads and the sign-in redirect with little code.
- Assignment 1 already lists Zustand in the stack.
- No server cart endpoints are needed.

**Costs and risks**

- The cart lives in browser storage, so it is per browser and can be edited by the user; the server therefore recalculates every price and total.
- With server-side rendering, reading persisted state during the first render can cause a hydration mismatch.

**Follow-up**

- Use a fixed storage key and a version field so the stored shape can change later.
- Render the cart badge and totals after the component mounts, or use the middleware's hydration options, to avoid mismatches.
- Clear the persisted cart after a `PAID` result and keep it after `PAYMENT_FAILED`.

## Revisit if

Carts must follow a customer across devices.

---
Back to the [ADR index](README.md). Architecture overview: [architecture.md](../architecture.md).
