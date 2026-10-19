# ADR 012: Build the backend as a modular monolith

**Status:** Proposed  
**Date:** 2026-10-19  
**Decision log:** New (see architecture.md, section 2)  
**Related tasks:** D-10, C-01, C-03

## Context

Order creation, stock changes, and payment recording must commit together, and the team has five people and limited time. The assignment requires a single NestJS backend.

## Options considered

- Modular monolith (one NestJS app, domain modules)
- Microservices
- Serverless functions
- Unstructured single layer

## Decision

Build **one NestJS application** divided into modules: auth, products, orders, payments, and promotion and loyalty, with the layering rules in the architecture description (controllers, services, one Prisma data-access service).

## Consequences

**Benefits**

- One transaction scope for the operations that must be atomic.
- Clear module boundaries let the team work in parallel.
- One deployable and one database are cheap to run.

**Costs and risks**

- One failure domain.
- Modules can become coupled unless the rules are followed in code review.

**Follow-up**

- Follow the layering rules: controllers hold no logic; only the Orders module changes order status; modules call each other's services only.
- Describe the code structure inside each module in the later codebase-architecture document.

## Revisit if

A module needs to scale or deploy independently.

---
Back to the [ADR index](README.md). Architecture overview: [architecture.md](../architecture.md).
