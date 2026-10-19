# ADR 005: Use a mock payment provider behind a PaymentProvider interface

**Status:** Accepted  
**Date:** 2026-10-19  
**Decision log:** [Decision 4](../../plans/decision-log.md)  
**Related tasks:** C-07, C-21, C-22, T-12, D-08

## Context

The project simulates payment; no real money moves. A bank QR screenshot alone cannot tell the system that a transfer happened, so it cannot support testing of success, failure, retry, and idempotency. The state machine, idempotency, and stock rules must behave the same whichever provider is used. Details are in the [payment plan](../../plans/05-payment-plan.md).

## Options considered

- Mock provider in the backend
- Static bank QR image
- Dynamic bank QR with a simulated confirmation
- Real sandbox gateway (VNPay, MoMo, or Stripe test mode)

## Decision

Implement a **`PaymentProvider` interface** with a **`MockProvider`** as the default (`C-07`). The QR demo (`C-21`) and a sandbox adapter (`C-22`) remain optional (Could).

## Consequences

**Benefits**

- Meets the assignment and is fully testable without external accounts.
- One interface keeps the order state machine, idempotency, and loyalty rules identical for every provider.
- The sequence diagram keeps a single "Payment Service (mock)" lifeline.

**Costs and risks**

- The mock does not exercise real provider behavior such as callbacks and signatures.
- A demo control that forces failures must not be reachable in production.

**Follow-up**

- The mock outcome control (for example `PAYMENT_MOCK_CONTROL`) is off by default in production and turned on only for the live demo.
- If a QR demo is added, the bank ID and account number live in environment variables, never in the repository.
- `T-12` tests that the provider interface behaves the same for every provider.

## Revisit if

The team wants to show a real sandbox payment in the final demo.

---
Back to the [ADR index](README.md). Architecture overview: [architecture.md](../architecture.md).
