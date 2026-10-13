# BrewLite - Diagrams

Diagrams are maintained in Mermaid for review in GitHub and Mermaid-compatible Markdown viewers.

## 1. Use case / system context

```mermaid
flowchart LR
    Customer[Customer] -->|browse, customize, order, pay, view history| BrewLite[BrewLite web application]
    Manager[Store manager / Product Owner] -->|prioritize and accept increments| BrewLite
    Instructor[Instructor] -->|evaluate and accept demo| BrewLite
    BrewLite -->|simulated payment request| Gateway[Mock wallet/card gateway]
    Barista[Barista - future scope] -.->|prepare and update order| BrewLite
```

## 2. Container architecture

```mermaid
flowchart LR
    Browser[Customer browser] --> Web[Next.js frontend]
    Web -->|REST / JSON| API[NestJS backend]
    API -->|Prisma or TypeORM| DB[(PostgreSQL)]
    API --> Pay[Mock payment service]
```

## 3. Order and payment sequence

```mermaid
sequenceDiagram
    actor C as Customer
    participant W as Next.js
    participant A as NestJS API
    participant D as PostgreSQL
    participant P as Mock payment
    C->>W: Configure products and cart
    W->>A: POST /orders (JWT)
    A->>D: Validate stock; create order/items transactionally
    D-->>A: PENDING order + identifier
    A-->>W: Order summary
    W->>A: POST /payments + Idempotency-Key
    A->>D: Look up idempotency key
    alt Key already processed
        D-->>A: Return recorded payment outcome
    else New key
        A->>P: Charge Wallet/Card (mock)
        P-->>A: Success or failure
        A->>D: Record payment and transition order
        opt Payment succeeded
            A->>D: Credit loyalty points once
        end
    end
    A-->>W: Payment outcome + order status
    W-->>C: Confirmation or retry message
```

## 4. Order state machine

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> PAID: payment success
    PENDING --> PAYMENT_FAILED: payment failure
    PAYMENT_FAILED --> PENDING: retry
    PENDING --> CANCELLED: cancel
    PAYMENT_FAILED --> CANCELLED: cancel
    PAID --> PREPARING: accepted for preparation
    PREPARING --> READY: preparation complete
    READY --> COMPLETED: handed to customer
    COMPLETED --> [*]
    CANCELLED --> [*]
```

Any transition not represented here must be rejected. Cancellation policy and post-payment cancellation, if needed, are open product decisions.

## 5. Deployment topology

```mermaid
flowchart TB
    User[Browser on host] -->|localhost:3000| FE[frontend container]
    FE -->|browser API URL: localhost:3001| BE[backend container]
    BE -->|db:5432 on private Compose network| DB[(PostgreSQL container)]
    BE --> Mock[Mock payment module]
    DB --> Volume[(Named persistent volume)]
```
