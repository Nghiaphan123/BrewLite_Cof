# ADR 013: Keep a short-lived JWT in the browser and send it as a bearer token

**Status:** Proposed  
**Date:** 2026-10-19  
**Decision log:** New (see architecture.md, sections 9.1 and 11)  
**Related tasks:** C-05, C-17, T-04

## Context

The web app and the API run on different origins and the API is protected by JWT. The token must be stored somewhere the web app can use for every request, and the cart already uses browser storage.

## Options considered

- Bearer token kept in browser storage
- HttpOnly cookie with credentialed CORS and CSRF protection
- Short-lived access token plus refresh token

## Decision

Issue a **short-lived access token** (about one hour) at login. The web app stores it in browser storage and sends it in the `Authorization: Bearer` header. There is no refresh token; the customer signs in again after expiry, and the cart is kept (ADR 003). Logout clears the token.

## Consequences

**Benefits**

- Simple to build and to test, and works across origins with plain CORS.
- No cookie or CSRF handling.

**Costs and risks**

- Script injected into the page (XSS) could read the token; an HttpOnly cookie is safer.
- No server-side revoke before expiry.

**Follow-up**

- Mitigate: keep the lifetime short, never render untrusted HTML, and set a content security policy where practical.
- Check that a bad or expired token returns 401 and the UI sends the customer to sign in with the cart kept.
- Hash passwords with bcrypt cost 10 (NFR-02).

## Revisit if

The team has time to implement HttpOnly cookies, or security review requires it.

---
Back to the [ADR index](README.md). Architecture overview: [architecture.md](../architecture.md).
