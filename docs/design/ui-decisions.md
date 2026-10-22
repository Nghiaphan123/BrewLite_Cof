# BrewLite - UI Decisions

**Status:** Phase 1 deliverable  
**Owner:** Nghĩa (Task 5.0)  
**Related:** [Wireframes](wireframes.md), [Product Backlog](../requirements/product-backlog.md), [Scenarios](../requirements/scenarios.md), [Configuration](../config.md), [Project Structure](../project-structure.md), assignment PDF §6, §7

This document records the UI decisions that shape every screen in the BrewLite MVP. It is not a design system and not a component library — it is the set of choices that must be consistent across the five MVP screens and that a reviewer can cite when a PR violates one.

> **Scope:** the five MVP screens (Menu, Product Detail, Cart, Checkout, Confirmation) plus the auth screens added in Task 7. Anything not listed here is free until a screen needs it — then it gets a decision and a row in this doc, in the same PR.

## 1. Stack and framework

| Decision        | Value                                                                                    | Rationale                                                                                          | ADR?                                 |
| --------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------ |
| Framework       | Next.js App Router (already scaffolded)                                                  | Assignment PDF §6 mandates Next.js; App Router is what the scaffold uses.                          | —                                    |
| Language        | TypeScript, strict                                                                       | Matches scaffold `tsconfig.json`; no `any` in feature code without a `// why:` comment.            | —                                    |
| Styling         | TailwindCSS                                                                              | Assignment PDF §6; already in the scaffold.                                                        | —                                    |
| Component model | React Server Components by default; `"use client"` only where state or events require it | Keeps bundle small; cart and auth are the client-heavy areas.                                      | —                                    |
| State (cart)    | Zustand                                                                                  | PDF §6 suggests Zustand; smaller than Redux, no provider tree.                                     | ADR 0006 (to be created with Task 5) |
| Data fetching   | Native `fetch` from Server Components for reads; client `fetch` for mutations            | Next 16 supports both; no React Query dependency in Phase 1. Revisit if caching becomes a problem. | —                                    |
| Forms           | Native HTML validation + server-side `class-validator`                                   | Avoids a form library dependency in Phase 1; revisit if forms grow.                                | —                                    |
| Icons           | Inline SVG or `lucide-react` if the team agrees                                          | Not a Phase 1 blocker; pick when the first icon is needed.                                         | —                                    |

**Rule:** adding a UI dependency (component library, animation library, form library) requires a one-line note here and a `package.json` change in the same PR. "I needed it" is not a rationale; "what breaks without it" is.

## 2. Routes

The App Router folder structure under `apps/web/src/app/` is the URL map. It must match `wireframes.md` and the e2e journeys in `scenarios.md`.

| Screen         | Route                       | Rendering                                | Auth                            | Notes                                                                     |
| -------------- | --------------------------- | ---------------------------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| Menu           | `/`                         | Server Component                         | Public                          | Loads `GET /products`; badge from client cart store.                      |
| Product detail | `/products/[id]`            | Server Component shell + client selector | Public                          | Size/topping selection is client-side.                                    |
| Cart           | `/cart`                     | Client Component                         | Public (checkout requires auth) | Reads Zustand store only.                                                 |
| Login          | `/auth/login`               | Client Component                         | Public                          | Redirects to `/checkout` on success if a return path is stored.           |
| Register       | `/auth/register`            | Client Component                         | Public                          | Same redirect rule.                                                       |
| Checkout       | `/checkout`                 | Client Component                         | **Authenticated**               | Redirects to `/auth/login?next=/checkout` when no token.                  |
| Confirmation   | `/orders/[id]/confirmation` | Server Component                         | **Authenticated**               | Renders `GET /orders/:id` (owner-scoped); safe "not found" on cross-user. |
| History        | `/orders`                   | Server Component                         | **Authenticated**               | Renders `GET /orders/me`.                                                 |

**Route naming rules:**
- Lowercase, hyphenated segments; no `_underscore` (Next reserves `_` for private folders).
- Dynamic segments are `[id]`; no `[orderId]` unless the param is an order id specifically (then `[orderId]` is allowed).
- Route groups `(group)` are allowed for layout organization but do not appear in the URL; do not use them to hide routes from the URL structure in a way that confuses `wireframes.md`.

**Open decision (D3 from `scenarios.md`):** whether the confirmation route is keyed by the DB `id` or a human-readable order code. The route shape above uses `[id]`; if the team chooses the code, the segment becomes `[code]` and this table is updated in the same PR. **Owner:** Nghĩa. **Closes when:** `api-contract.md` §`POST /orders` is final.

## 3. Design tokens

Phase 1 keeps tokens minimal: enough to keep screens consistent, not enough to be a design system. Tokens live as Tailwind theme extensions in `apps/web/tailwind.config.ts` (or `globals.css` `@theme` block for Tailwind v4 — pick one and record it).

### 3.1 Color

| Token               | Value                    | Use                                | Contrast note                                                         |
| ------------------- | ------------------------ | ---------------------------------- | --------------------------------------------------------------------- |
| `--color-brand`     | `#6F4E37` (coffee brown) | Primary buttons, active nav        | AA on white for text ≥ 18px; use `--color-brand-ink` for smaller text |
| `--color-brand-ink` | `#3B2A1E`                | Body text on brand-tinted surfaces | AA on `--color-brand` at 14px+                                        |
| `--color-bg`        | `#FAF7F2`                | App background                     |                                                                       |
| `--color-surface`   | `#FFFFFF`                | Cards, dialogs                     |                                                                       |
| `--color-border`    | `#E5DED4`                | Dividers, input borders            |                                                                       |
| `--color-muted`     | `#6B6B6B`                | Secondary text, placeholders       | AA on `--color-bg`                                                    |
| `--color-success`   | `#1F7A4D`                | `PAID` badge, success toast        |                                                                       |
| `--color-warn`      | `#B36B00`                | `PENDING`, `PAYMENT_FAILED` badge  |                                                                       |
| `--color-danger`    | `#B3261E`                | Form errors, destructive actions   |                                                                       |

**Rule:** no raw hex values in components. Every color comes from a token. If a color is needed and no token exists, add a token in the same PR and document it in this table.

### 3.2 Typography

| Token           | Value                                                      | Use                  |
| --------------- | ---------------------------------------------------------- | -------------------- |
| `font-sans`     | `ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif` | All UI text          |
| `text-xs`       | `0.75rem / 1rem`                                           | Badges, metadata     |
| `text-sm`       | `0.875rem / 1.25rem`                                       | Secondary text       |
| `text-base`     | `1rem / 1.5rem`                                            | Body                 |
| `text-lg`       | `1.125rem / 1.75rem`                                       | Card titles          |
| `text-xl`       | `1.25rem / 1.75rem`                                        | Section headers      |
| `text-2xl`      | `1.5rem / 2rem`                                            | Page title           |
| `font-semibold` | `600`                                                      | Buttons, card titles |
| `font-bold`     | `700`                                                      | Page title, totals   |

**Vietnamese diacritics:** the chosen font stack must render Vietnamese correctly. `system-ui` on Windows/macOS/Linux does; if the team later adds a webfont, verify `ễ`, `ữ`, `đ` before merging. This is a real risk with some display fonts.

### 3.3 Spacing and layout

- Base unit `0.25rem` (Tailwind default scale). Use only Tailwind spacing utilities; no arbitrary `style={{ padding: 13 }}`.
- Page container: `max-w-5xl mx-auto px-4` (web), with a narrower `max-w-3xl` for checkout/confirmation.
- Breakpoints: Tailwind defaults. The menu grid is `grid-cols-2` at base and `grid-cols-3 md:grid-cols-4` at `md`+.

### 3.4 Shape and elevation

- Border radius: `rounded-lg` (0.5rem) for cards and inputs, `rounded-md` for buttons, `rounded-full` for the cart badge.
- Shadow: `shadow-sm` for cards; no `shadow-lg` or larger in Phase 1 (keeps the UI flat and legible).

## 4. Pricing and money formatting

This is the most important decision in the doc, because a mismatch here is the #1 integration defect (`scenarios.md` S-ORD-1, `product-backlog.md` Task 4 and Task 6).

### 4.1 Money representation

- **All money is an integer in VND.** No floats, no decimals, no minor units. `35,000` VND is `35000` in code and JSON.
- Rationale: the assignment PDF shows prices like `35k`, `45.000đ`; Vietnamese đồng has no practical sub-unit. Using `Int` in Prisma and `number` (integer) in JSON avoids float drift entirely.
- This rule is mirrored in `config.md` §3 ("Currency: VND, integer minor-unit-free"). Both docs must agree.

### 4.2 Price computation — one rule, two implementations, one fixture

The frontend computes a display price; the backend recomputes the authoritative price. They **must** agree for every valid (product, size, toppings) combination. The mechanism that guarantees agreement is a **shared price fixture**:

- **File:** `apps/web/src/lib/pricing.ts` exports `computeLineTotal(selection: CartSelection): number`; it contains the size and topping tables.
- **Backend mirror:** `apps/api/src/modules/orders/pricing.ts` exports the same function with the same tables.
- **Fixture:** `tests/fixtures/pricing-cases.json` lists at least 20 cases (each valid size, each topping, combinations, quantity > 1). Both apps have a test that reads the fixture and asserts their `computeLineTotal` matches the expected value.
- **Rule:** if the fixture's expected value changes, both implementations and the fixture change in the same PR. A PR that changes one without the other fails review.

### 4.3 Display formatting

- Formatter lives in `apps/web/src/lib/format.ts`: `formatVnd(n: number): string` returns e.g. `45.000đ`.
- Rules: Vietnamese thousands separator (`.`), no decimals, suffix `đ` with no space (`45.000đ`, not `45.000 đ`).
- Do not use `Intl.NumberFormat` with a currency style — it inserts a non-breaking space and can render `₫` inconsistently across platforms. Use a small custom formatter and test it.
- **Never** re-parse a formatted string back to a number. Formatting is one-way; the source of truth is always the integer.

## 5. State management

### 5.1 Cart store (Zustand)

- **File:** `apps/web/src/store/cart-store.ts`.
- **Shape:**
  ```ts
  type CartSelection = { productId: string; size: "S" | "M" | "L"; toppingIds: string[] };
  type CartItem = CartSelection & { name: string; qty: number; lineTotal: number };
  type CartState = {
    items: CartItem[];
    add: (s: CartSelection, name: string) => void;
    increment: (index: number) => void;
    decrement: (index: number) => void;
    remove: (index: number) => void;
    clear: () => void;
    totalQty: () => number;
    totalPrice: () => number;
  };
  ```
- **Identity rule:** two lines are "the same" iff `productId`, `size`, and the *set* of `toppingIds` all match. Topping order does not create a new line; the set is sorted before comparison.
- **Persistence:** in-memory only in Phase 1 (survives navigation, not reload). Recorded as a known limitation in `scenarios.md` S-CART-2.
- **No async in the store.** The store never calls `fetch`. Mutations that hit the API (`POST /orders`) live in the feature, not the store.

### 5.2 Auth state

- Token stored in `localStorage` under `brewlite.token`; user identity is decoded from the JWT payload (`email`, `sub`) without trusting the signature on the client.
- A `useAuth()` hook reads the token and exposes `{ isAuthenticated, email, logout }`.
- **No auth store** in Phase 1; the hook is enough. If refresh tokens are added later, revisit.
- **Security note:** `localStorage` is vulnerable to XSS; the alternative (`httpOnly` cookie) requires CSRF handling. Phase 1 accepts the risk because the assignment scopes the mock gateway and there is no sensitive data beyond the user's own orders. Record this in ADR 0006 alongside the cart decision.

## 6. UI state conventions

Every data-bound screen must handle four states explicitly. This is an acceptance criterion in Tasks 3, 5, 7, and 9, and it is the most common review comment.

| State   | What the user sees                                              | Component pattern                        |
| ------- | --------------------------------------------------------------- | ---------------------------------------- |
| Loading | Skeleton for grids and lists; spinner for actions               | `<MenuSkeleton />`, `<Button loading />` |
| Empty   | Illustration or icon + short message + primary action           | `<EmptyState title action />`            |
| Error   | Message + retry button; specific message if the API returns one | `<ErrorState onRetry message />`         |
| Success | The data                                                        | —                                        |

**Rules:**
- No screen may render a blank area during loading. If data takes > 200 ms, show a skeleton (grid) or a spinner (single item).
- Error messages are user-facing: no stack traces, no raw `TypeError: fetch failed`. Map known API errors to friendly text; log the raw error to the console in dev.
- Retry must actually retry (re-issue the request), not just reload the page.
- Toast (if used) is for mutations, not for initial loads; initial loads use inline states.

## 7. Accessibility baseline

Phase 1 targets WCAG AA for the five MVP screens. Minimum rules:

- Every interactive element is a real `<button>`, `<a>`, `<input>`, or `<select>` — not a `<div onClick>`.
- Every form input has an associated `<label>`; errors are linked with `aria-describedby`.
- Focus is visible: `focus-visible:outline-2 focus-visible:outline-brand`. Do not remove outlines.
- The cart badge and the order status badge are not color-only: include text (`PAID`, `PENDING`) next to the color.
- Images have `alt`; product images use the product name as alt.
- Keyboard: full flow (menu → detail → cart → checkout → confirm) is completable with keyboard only. The demo script includes a keyboard pass.

**Not in Phase 1:** screen-reader-verified flows, reduced-motion, high-contrast theme. These are Phase 2 backlog candidates, not Phase 1 failures.

## 8. Naming conventions for UI code

| Thing                        | Rule                                  | Example                                    |
| ---------------------------- | ------------------------------------- | ------------------------------------------ |
| Components (files)           | `kebab-case.tsx`                      | `product-card.tsx`                         |
| Components (export)          | `PascalCase`                          | `export function ProductCard()`            |
| Shared components            | `apps/web/src/components/`            | `apps/web/src/components/empty-state.tsx`  |
| Feature components           | `apps/web/src/features/<feature>/`    | `apps/web/src/features/cart/cart-line.tsx` |
| Hooks                        | `use-<verb>-<noun>.ts`, export `useX` | `use-auth.ts` → `useAuth`                  |
| Store files                  | `<domain>-store.ts`                   | `cart-store.ts`                            |
| Utilities                    | `apps/web/src/lib/<topic>.ts`         | `format.ts`, `pricing.ts`                  |
| Types shared across features | `apps/web/src/types/<domain>.ts`      | `types/order.ts`                           |

**Rule:** a component used by exactly one feature lives in that feature's folder, not in `components/`. Promote to `components/` only when a second feature uses it (this mirrors `project-structure.md`).

## 9. Screen-by-screen decisions (summary)

The full wireframes are in `wireframes.md`; this table records the decisions that are not obvious from the wireframe.

| Screen         | Decision                                                                            | Notes                                                                     |
| -------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Menu           | Grid of cards; each card is a link to detail; the card body is not a button         | Accessibility §7                                                          |
| Menu           | Price on the card is the **base** price, not a range                                | Size-specific price is only on the detail screen                          |
| Menu           | Cart badge is in the header, always visible                                         | 0 hides the badge rather than showing "0"                                 |
| Product Detail | Size selector defaults to **M**                                                     | Users can change before adding; the add button reflects the current total |
| Product Detail | Toppings are checkboxes, not a dropdown                                             | Multi-select, matches a coffee-shop mental model                          |
| Product Detail | Price updates live on every selection                                               | No "calculate" button                                                     |
| Cart           | Quantity control is `− qty +` with `−` disabled at 1, and a separate "remove" link  | Two distinct actions; removing does not require clicking `−` repeatedly   |
| Cart           | Empty cart shows `<EmptyState>` with a "Browse menu" action                         | `scenarios.md` S-CART-1                                                   |
| Checkout       | Method selector is two large radio cards (Wallet / Card), not a `<select>`          | The PDF wireframe shows two option cards; radios keep it accessible       |
| Checkout       | "Confirm" is disabled while the request is in flight                                | Prevents S-PAY-4 double-submit pre-Task 10b                               |
| Confirmation   | Shows order code, status badge, and a "Back to menu" primary action                 | Order code format is D3 in `scenarios.md`                                 |
| Confirmation   | On error (not found / not yours), shows a safe message with a "Back to menu" action | No information leakage; `scenarios.md` S-ORD-4                            |
| History        | Each row shows code, date, total, status badge; click opens confirmation/detail     | Newest first                                                              |
| Auth           | Login form has a "return to checkout" hint when redirected from checkout            | Uses `?next=` query param, validated as a same-origin path                |

## 10. What is *not* decided here

Deferred, with the task that will decide them:

- **Exact component implementations** (skeletons, toasts) — Task 3 and later, per screen.
- **Animations / transitions** — Phase 2; not a Phase 1 requirement.
- **Icon set** — pick when the first icon is needed; see §1.
- **Dark mode** — out of scope for MVP.
- **Internationalization** — Vietnamese-only in MVP; no i18n framework.
- **Design system extraction** — if the team grows beyond 5 screens, extract tokens into a Storybook; not before.

## 11. Open items

| Item                                                          | Owner | Closes when                         |
| ------------------------------------------------------------- | ----- | ----------------------------------- |
| Create ADR 0006 (UI state + auth token storage)               | Nghĩa | Task 5.0 `● Xong`                   |
| Create `tests/fixtures/pricing-cases.json`                    | H.Tài | Task 4.0 or Task 6.0 `● Xong`       |
| Choose `tailwind.config.ts` vs `@theme` in `globals.css`      | Nghĩa | First component PR                  |
| Resolve D3 (confirmation route key: id vs code)               | Nghĩa | `api-contract.md` final             |
| Add auth screen wireframes                                    | Nghĩa | `wireframes.md` update in Task 7.0  |
| Verify Vietnamese diacritic rendering with any future webfont | Nghĩa | First webfont PR (may never happen) |

---

## Notes on choices I made (so you can accept or override)

1. **The pricing section (§4) is the longest part of the doc, and that's intentional.** `scenarios.md` S-ORD-1 and `product-backlog.md` Task 4/6 both call out that the frontend and backend must compute the same total. That doesn't happen by writing "they should match" — it happens by putting the price tables in two mirrored files and forcing a shared fixture (§4.2). This is the single decision in the doc that prevents a real bug; everything else is consistency.

2. **§3.2's Vietnamese diacritics note is not filler.** The assignment is in Vietnamese, the UI has Vietnamese text, and `system-ui` renders `ễ`/`ữ`/`đ` correctly while many trendy display fonts do not. Flagging it now means a webfont PR has a checklist item instead of a production bug.

3. **§1's "adding a dependency requires a one-line rationale here" rule is the governance mechanism.** Without it, the first person who wants `react-hook-form` or `framer-motion` adds it and no one notices. With it, the rationale is in Git and a reviewer can say "what breaks without it?" — which is the only question that matters.

4. **I added an ADR 0006 forward reference** (UI state + auth token storage) because §5.2's `localStorage` choice is a security decision, not just a preference. It deserves an ADR that names the XSS trade-off, and the open-items table has the row. If you'd rather not create a 6th ADR, fold it into ADR 0002 (monorepo) or ADR 0005 (API conventions) — but don't leave it undocumented, because "why is the token in localStorage?" will be asked in review.

5. **§9's screen-by-screen table is the bridge to `wireframes.md`.** The next doc will embed the five wireframe images and specify the routes and acceptance criteria each serves; this table records the *choices* within those screens that the image can't show (default size M, checkboxes not dropdown, `−` disabled at 1). Splitting decisions from pictures keeps the wireframe doc from becoming a wall of text and keeps this doc from being just pictures.

6. **§6 (UI states) is written as a four-row table with a rule that "no screen may render a blank area during loading."** That's the strongest phrasing I could use while staying true to the PDF's "loading/empty state" acceptance criteria. It's also the most common review comment on student projects — making it a numbered convention means a reviewer can cite "§6" instead of explaining it again.

7. **One inconsistency to check:** §2's route table lists `/orders/[id]/confirmation` while `scenarios.md` S-MAIN-1 step 10 and `product-backlog.md` Task 9 both say `/orders/[id]/confirmation` — good, they agree. But D3 in `scenarios.md` §13 says the route might be keyed by code instead of id. If D3 resolves to "code," update §2 here, `scenarios.md` §12, and `product-backlog.md` §12 in the same PR. That's three docs — which is exactly why D3 is an open item rather than a silent default.
