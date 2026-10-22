# BrewLite - Wireframes

**Status:** Phase 1 deliverable  
**Owner:** Nghĩa (Task 5.0)  
**Related:** [UI Decisions](ui-decisions.md), [Product Backlog](../requirements/product-backlog.md), [Scenarios](../requirements/scenarios.md), [API Contract](../architecture/api-contract.md), assignment PDF §7

This document is the index of BrewLite's wireframes. For each screen it records the route, the wireframe image, the UI states that must be handled, the acceptance criteria it serves, and the manual or e2e test that proves it. The images live in `docs/diagrams/wireframes/`; this page is the authoritative map from "screen" to "file" to "route" to "test".

> **Source of the drawings:** the five MVP wireframes are adapted from assignment PDF §7. The exported images in `docs/diagrams/wireframes/` are the drawings of record. The editable source (Figma/Excalidraw) link is recorded per screen in §7. If an image and this text disagree, **this text wins** for route/state/acceptance; the image wins for layout.

## 1. Screen inventory

| #   | Screen         | Route                       | Auth          | Image (of record)          | Editable source | Acceptance criteria |
| --- | -------------- | --------------------------- | ------------- | -------------------------- | --------------- | ------------------- |
| 1   | Menu           | `/`                         | Public        | `wf-menu-v1.png`           | §7              | Task 3              |
| 2   | Product detail | `/products/[id]`            | Public        | `wf-product-detail-v1.png` | §7              | Task 4              |
| 3   | Cart           | `/cart`                     | Public        | `wf-cart-v1.png`           | §7              | Task 5              |
| 4   | Checkout       | `/checkout`                 | Authenticated | `wf-checkout-v1.png`       | §7              | Task 8              |
| 5   | Confirmation   | `/orders/[id]/confirmation` | Authenticated | `wf-confirmation-v1.png`   | §7              | Task 9              |
| 6   | Login          | `/auth/login`               | Public        | `wf-login-v1.png`          | §7              | Task 7              |
| 7   | Register       | `/auth/register`            | Public        | `wf-register-v1.png`       | §7              | Task 7              |
| 8   | Order history  | `/orders`                   | Authenticated | `wf-history-v1.png`        | §7              | Task 9              |

Rows 1–5 are the five MVP wireframes from PDF §7. Rows 6–8 are the screens the backlog requires (Task 7, Task 9) that the PDF does not draw; they are added here so no screen ships without a wireframe. Header/footer, empty/error states, and the promo/points affordance (Task 10d) are cross-cutting and described in §4–§6, not drawn per screen.

## 2. Export rules

- **Format:** PNG, 2× scale, white background, no device frame. One image per screen, not a combined board.
- **Filename:** `wf-<screen>-v<n>.png` in `docs/diagrams/wireframes/`. Bumping the design creates `v2`; the old file stays until every doc that links it is updated (see `project-structure.md` § "Diagram rules").
- **Source:** Figma or Excalidraw; the editable link is recorded in §7. Do not commit `.fig` or `.excalidraw` binaries.
- **Annotations:** state annotations (loading, empty, error) are drawn as separate frames inside the same image with a caption, or listed in the screen's "States" block below — not left implicit.
- **Language:** user-facing labels are Vietnamese (matching the assignment and the UI text); structural labels (`Header`, `Primary`, `Card`) are English.

## 3. Cross-cutting layout

Every screen shares a header and page container.

- **Header:** BrewLite wordmark (links to `/`), cart badge (hidden at 0), auth entry (login/register or user email + logout). Sticky on scroll.
- **Page container:** `max-w-5xl mx-auto px-4` for menu/cart/history; `max-w-3xl` for checkout/confirmation/auth. Centered, vertical rhythm from `ui-decisions.md` §3.3.
- **Footer:** minimal — project name and a link to the repo README. No social links.
- **Responsive:** all screens usable at 360 px and 1280 px. The menu grid is `grid-cols-2` at base, `md:grid-cols-3 md:grid-cols-4` at `md`+.

Wireframe images in §7 show the header/footer on one representative screen (Menu); other screens omit them to reduce noise but must include them in implementation.

## 4. Screen 1 — Menu (`/`)

**Goal:** browse the drinks menu and start an order.  
**Traces to:** `product-backlog.md` Task 3; `scenarios.md` S-MAIN-1 steps 1–2.

**Layout:** header → page title ("Menu") → responsive grid of `ProductCard` → footer.  
**ProductCard contents:** image, name, base price (`formatVnd`), and a subtle "from" hint if the size affects price (size pricing is shown on detail, per `ui-decisions.md` §9). The whole card is a link to `/products/[id]`; the card body is not a `<button>` (accessibility, `ui-decisions.md` §7).

**States:**

| State   | Rendering                                                                                       | Test                                 |
| ------- | ----------------------------------------------------------------------------------------------- | ------------------------------------ |
| Loading | `MenuSkeleton` — 6 card-shaped skeletons in the same grid                                       | —                                    |
| Empty   | `<EmptyState>` "Menu đang cập nhật" with no action (menu is server-managed; user cannot fix it) | —                                    |
| Error   | `<ErrorState>` with retry; retry re-issues `GET /products`                                      | `scenarios.md` S-MAIN-1 (retry path) |
| Success | Grid of cards; badge reflects `totalQty()`                                                      | `scenarios.md` S-MAIN-1 step 1       |

**Notes:**
- The cart badge is hidden at 0, shown at ≥ 1 (`ui-decisions.md` §9).
- Clicking a card navigates to detail; no add-to-cart on the menu (size/toppings are chosen on detail).

## 5. Screen 2 — Product detail (`/products/[id]`)

**Goal:** choose size and toppings, see the live price, add to cart.  
**Traces to:** `product-backlog.md` Task 4; `scenarios.md` S-MAIN-1 steps 2–4.

**Layout:** header → two-column at `md`+ (image left, options right); stacked on mobile. Options: name, base price, size selector (S/M/L, default **M**), topping checkboxes, live total, "Thêm vào giỏ" primary button, "Quay lại menu" link.

**States:**

| State             | Rendering                                                  | Test                           |
| ----------------- | ---------------------------------------------------------- | ------------------------------ |
| Loading           | Skeleton for image + option block                          | —                              |
| Empty / not found | `<EmptyState>` "Không tìm thấy sản phẩm" + "Quay lại menu" | —                              |
| Error             | `<ErrorState>` with retry                                  | —                              |
| Success           | Live total updates on every size/topping change            | `scenarios.md` S-MAIN-1 step 3 |

**Notes:**
- "Thêm vào giỏ" is disabled until a size is selected (default M means it is enabled immediately; the disabled state is only reachable if the product has no default — record if that changes).
- The live total uses `computeLineTotal` from `apps/web/src/lib/pricing.ts` (`ui-decisions.md` §4.2) — **the same fixture as the backend**.
- Toppings are checkboxes, not a `<select>` (multi-select; `ui-decisions.md` §9).

## 6. Screen 3 — Cart (`/cart`)

**Goal:** review lines, adjust quantities, remove lines, proceed to checkout.  
**Traces to:** `product-backlog.md` Task 5; `scenarios.md` S-CART-1, S-CART-2.

**Layout:** header → line list (each: name, size, toppings, `− qty +`, line total, remove link) → summary (subtotal, total) → "Thanh toán" primary button → "Tiếp tục mua" secondary link.

**States:**

| State             | Rendering                                                                                                                   | Test                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Empty             | `<EmptyState>` "Giỏ hàng trống" + "Xem menu" action                                                                         | `scenarios.md` S-CART-1 step 3    |
| Non-empty         | Lines + summary; `−` disabled at qty 1; remove is a separate action                                                         | `scenarios.md` S-CART-1 steps 1–2 |
| Invalid selection | If a stored line references a product no longer in the menu, show a warning row with "Xóa" only (do not silently recompute) | —                                 |

**Notes:**
- "Thanh toán" when anonymous navigates to `/auth/login?next=/checkout` (`ui-decisions.md` §2, route table) rather than failing at the API.
- The total is `totalPrice()` from the store; it is a display value — the backend recomputes on `POST /orders` (`scenarios.md` S-ORD-1).
- Cart does not survive full reload in Phase 1 (`scenarios.md` S-CART-2) — the empty state is what a reload shows.

## 7. Screen 4 — Checkout (`/checkout`)

**Goal:** choose a payment method, see the total, confirm, and reach confirmation.  
**Traces to:** `product-backlog.md` Task 8; `scenarios.md` S-MAIN-1 steps 7–10, S-PAY-1..4.

**Layout:** header → order summary (lines collapsed, total) → method selector: two large radio cards ("Ví điện tử", "Thẻ ngân hàng") → "Xác nhận thanh toán" primary button → "Quay lại giỏ" link.

**States:**

| State                        | Rendering                                                                          | Test                                    |
| ---------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------- |
| Unauthenticated              | Redirect to `/auth/login?next=/checkout`                                           | `scenarios.md` S-AUTH-1 (redirect path) |
| Loading (submit)             | Button shows spinner and is disabled; selector is disabled                         | —                                       |
| Payment failure              | Inline `<ErrorState>` with the failure reason + "Thử lại" (retry) — cart preserved | `scenarios.md` S-PAY-2, S-PAY-3         |
| Success                      | Navigate to confirmation route                                                     | `scenarios.md` S-MAIN-1 step 10         |
| Double-submit (pre-Task 10b) | Button disabled while in flight; documented gap                                    | `scenarios.md` S-PAY-4                  |

**Notes:**
- Method is required before "Xác nhận" is enabled (default: none selected; user must choose). This is a deliberate friction — the assignment's US-05 says "chọn phương thức rồi xác nhận."
- The mock mode is not exposed to the user; `PAYMENT_MOCK_MODE` is server-side (`config.md` §2.1, ADR 0004).
- No promo/points UI here — Task 10d adds a promo field and a points-earned preview; that addition is drawn as `wf-checkout-v2.png` when Task 10d lands, and this table is updated.

## 8. Screen 5 — Confirmation (`/orders/[id]/confirmation`)

**Goal:** confirm the order, show the code and status, and offer a way back.  
**Traces to:** `product-backlog.md` Task 9; `scenarios.md` S-MAIN-1 step 10, S-ORD-4.

**Layout:** header → success/failed banner → order code (large, monospace), status badge (`PAID` / `PENDING` / `PAYMENT_FAILED`), total, timestamp → "Về trang chủ" primary button → "Xem lịch sử đơn" secondary link.

**States:**

| State            | Rendering                                                 | Test                            |
| ---------------- | --------------------------------------------------------- | ------------------------------- |
| Success (`PAID`) | Success banner, green badge, code, total, timestamp       | `scenarios.md` S-MAIN-1 step 10 |
| Not found        | `<EmptyState>` "Không tìm thấy đơn hàng" + "Về trang chủ" | `scenarios.md` S-ORD-4 step 2   |
| Not yours        | Same as not found (no information leakage)                | `scenarios.md` S-ORD-4 step 2   |
| Error            | `<ErrorState>` with retry                                 | —                               |

**Notes:**
- The route key is D3 (`scenarios.md` §13): `[id]` vs `[code]`. This wireframe assumes `[id]`; if D3 resolves to code, update this section, the route table in `ui-decisions.md` §2, and `product-backlog.md` §12 in the same PR.
- The order code is displayed in a monospace font and is copyable (a "copy" icon is optional; if added, it needs an accessible label).
- The status badge is color + text, never color-only (`ui-decisions.md` §7).

## 9. Screen 6 — Login (`/auth/login`)

**Goal:** authenticate so checkout and history are available.  
**Traces to:** `product-backlog.md` Task 7; `scenarios.md` S-AUTH-1, S-AUTH-3.

**Layout:** centered card (`max-w-md`) → title "Đăng nhập" → email input → password input → "Đăng nhập" primary button → "Chưa có tài khoản? Đăng ký" link → back link.

**States:**

| State               | Rendering                                                      | Test                    |
| ------------------- | -------------------------------------------------------------- | ----------------------- |
| Default             | Empty form                                                     | —                       |
| Submitting          | Button spinner + disabled                                      | —                       |
| Invalid credentials | Inline form error, generic message (no user enumeration)       | `scenarios.md` S-AUTH-3 |
| Success             | Redirect to `?next=` if present and same-origin; otherwise `/` | `scenarios.md` S-AUTH-1 |

**Notes:**
- `?next=` must be validated as a same-origin path; open redirect is an error.
- The "Chưa có tài khoản?" link preserves `?next=`.
- Password visibility toggle is optional; if added, needs an accessible label.

## 10. Screen 7 — Register (`/auth/register`)

**Goal:** create an account.  
**Traces to:** `product-backlog.md` Task 7; `scenarios.md` S-AUTH-1, S-AUTH-2.

**Layout:** centered card → title "Đăng ký" → email → password → confirm password → "Đăng ký" primary button → "Đã có tài khoản? Đăng nhập" link.

**States:**

| State             | Rendering                                                                         | Test                    |
| ----------------- | --------------------------------------------------------------------------------- | ----------------------- |
| Default           | Empty form                                                                        | —                       |
| Client validation | Field-level messages (email format, password length, confirm match) before submit | —                       |
| Duplicate email   | Inline error from `409`                                                           | `scenarios.md` S-AUTH-2 |
| Success           | Redirect to login with a success hint, or auto-login then redirect to `?next=`    | `scenarios.md` S-AUTH-1 |

**Notes:**
- Password policy (length, characters) is enforced both client-side and server-side; the client message and `class-validator` message must agree.
- Auto-login on register is allowed but not required; if implemented, it reuses the login flow and must not skip the JWT path.

## 11. Screen 8 — Order history (`/orders`)

**Goal:** see past orders and open one.  
**Traces to:** `product-backlog.md` Task 9; `scenarios.md` S-ORD-4.

**Layout:** header → page title "Đơn hàng của tôi" → list of rows (code, date, total, status badge) → each row links to its confirmation/detail route → "Về trang chủ" link.

**States:**

| State           | Rendering                                      | Test                          |
| --------------- | ---------------------------------------------- | ----------------------------- |
| Unauthenticated | Redirect to `/auth/login?next=/orders`         | `scenarios.md` S-ORD-4 step 3 |
| Loading         | Skeleton rows                                  | —                             |
| Empty           | `<EmptyState>` "Chưa có đơn hàng" + "Xem menu" | —                             |
| Error           | `<ErrorState>` with retry                      | —                             |
| Success         | Rows newest-first                              | `scenarios.md` S-ORD-4 step 1 |

**Notes:**
- Rows are sorted by `createdAt` descending; the sort is server-side, not client-side, so pagination can be added later without reworking the UI.
- Status badges reuse the confirmation badge component so `PAID`/`PENDING`/`PAYMENT_FAILED` styling is identical across screens.

## 12. Image gallery and editable sources

The images below are the drawings of record. Replace each `wf-*-v1.png` when the design changes and bump the version in both the filename and the screen's "Image" cell in §1.

```markdown
<!-- Embed when the PNGs are committed to docs/diagrams/wireframes/ -->

### 1. Menu
![Menu wireframe](../diagrams/wireframes/wf-menu-v1.png)

### 2. Product detail
![Product detail wireframe](../diagrams/wireframes/wf-product-detail-v1.png)

### 3. Cart
![Cart wireframe](../diagrams/wireframes/wf-cart-v1.png)

### 4. Checkout
![Checkout wireframe](../diagrams/wireframes/wf-checkout-v1.png)

### 5. Confirmation
![Confirmation wireframe](../diagrams/wireframes/wf-confirmation-v1.png)

### 6. Login
![Login wireframe](../diagrams/wireframes/wf-login-v1.png)

### 7. Register
![Register wireframe](../diagrams/wireframes/wf-register-v1.png)

### 8. Order history
![Order history wireframe](../diagrams/wireframes/wf-history-v1.png)
```

**Editable sources:**

| Screen         | Tool                  | Link          | Owner |
| -------------- | --------------------- | ------------- | ----- |
| Menu           | Figma (or Excalidraw) | *to be added* | Nghĩa |
| Product detail | Figma                 | *to be added* | Nghĩa |
| Cart           | Figma                 | *to be added* | Nghĩa |
| Checkout       | Figma                 | *to be added* | Nghĩa |
| Confirmation   | Figma                 | *to be added* | Nghĩa |
| Login          | Figma                 | *to be added* | Nghĩa |
| Register       | Figma                 | *to be added* | Nghĩa |
| Order history  | Figma                 | *to be added* | Nghĩa |

If the team chooses to skip a design tool, the wireframes may be Excalidraw sketches embedded as PNGs; in that case, record "Excalidraw — inline only" in the link column and keep the `.excalidraw` file in `docs/diagrams/raw/` (not committed to the main tree, per `project-structure.md` diagram rules).

## 13. Traceability

Every screen maps to a backlog task and to at least one scenario. This table is the checklist for Task 5.0's `● Xong` note.

| Screen         | Backlog task | Scenarios            | Graded test? |
| -------------- | ------------ | -------------------- | ------------ |
| Menu           | Task 3       | S-MAIN-1             | —            |
| Product detail | Task 4       | S-MAIN-1             | —            |
| Cart           | Task 5       | S-CART-1, S-CART-2   | —            |
| Checkout       | Task 8       | S-MAIN-1, S-PAY-1..4 | —            |
| Confirmation   | Task 9       | S-MAIN-1, S-ORD-4    | —            |
| Login          | Task 7       | S-AUTH-1, S-AUTH-3   | —            |
| Register       | Task 7       | S-AUTH-1, S-AUTH-2   | —            |
| Order history  | Task 9       | S-ORD-4              | —            |

The three graded tests (`scenarios.md` §12: S-PAY-5, S-ORD-5, S-ORD-6) are not screen-level flows; they are exercised by Checkout and by the API directly, and are documented in `scenarios.md`, not here.

## 14. What this document does not cover

- **Visual decisions** (tokens, typography, spacing, pricing rules) — that is `ui-decisions.md`.
- **API shapes** — that is `docs/architecture/api-contract.md`.
- **Component implementation** — that is the feature code in `apps/web/src/features/`.
- **Promo/points UI** (Task 10d) — added as a `v2` of Checkout and a `v1` of a "points earned" row on Confirmation when Task 10d lands.
- **Barista/back-office screens** — out of MVP (`product-backlog.md` §16).

## 15. Open items

| Item                                                                 | Owner | Closes when                                                                                  |
| -------------------------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------- |
| Commit the 8 PNGs to `docs/diagrams/wireframes/`                     | Nghĩa | Task 5.0 `● Xong`                                                                            |
| Record Figma/Excalidraw links in §12                                 | Nghĩa | Same                                                                                         |
| Resolve D3 (confirmation route key: id vs code)                      | Nghĩa | `api-contract.md` final; update §1, `ui-decisions.md` §2, `product-backlog.md` §12 in one PR |
| Add promo/points UI as Checkout `v2`                                 | H.Tài | Task 10d lands                                                                               |
| Add empty/error state frames to the exported images if reviewers ask | Nghĩa | First Sprint Review                                                                          |

---

## Notes on choices I made (so you can accept or override)

1. **I expanded the screen inventory from 5 to 8, and I flagged why.** The PDF draws five wireframes (Menu, Detail, Cart, Checkout, Confirmation) but `product-backlog.md` Task 7 requires login/register pages and Task 9 requires order history. If this doc only indexes the PDF's five, three screens ship without a wireframe and Task 7/9's acceptance criteria lose their design reference. Rows 6–8 are drawn as part of Task 5.0, not deferred to Task 7/9, so the design deliverable is complete in Phase 1 and the later tasks implement against it. If you'd rather defer auth/history wireframes to their tasks, move rows 6–8 to a "deferred" table and note the trade-off.

2. **The images are placeholders in §12, and that's honest.** I can't generate PNGs, and the PDF's images are copyrighted assignment material you'd re-draw anyway. The section gives the exact `![...](...)` lines and the editable-source table so the moment you export from Figma, you paste the images and fill three columns — no restructuring needed. The doc is useful *now* (it's the screen-to-route-to-test map) and becomes complete when the PNGs land.

3. **§2 export rules are copied in spirit from `project-structure.md`'s diagram rules, deliberately.** The structure doc says diagrams use Mermaid for ER/flows and exported PNG for wireframes; this doc says PNG/2×/no-device-frame/naming. The duplication is intentional: a designer exporting a wireframe shouldn't have to read the repo-wide diagram rules to know the filename. They must be kept in sync — if you change one, change the other in the same PR (noted in the previous turn's `project-structure.md` review note).

4. **§4–§11 each have a States table with a "Test" column.** That column is what makes this doc more than a picture index: every state names the scenario it serves. When someone asks "does the cart need an invalid-selection state?", the table answers with the scenario, not an opinion. The invalid-selection row on Cart is the one state that isn't in `scenarios.md` — it's the "product removed from menu while in cart" edge case, which I added here rather than silently omitting; it may deserve a scenario ID in a future `scenarios.md` revision.

5. **§7's "method required before confirm" is a deliberate friction call.** The PDF's US-05 says "chọn phương thức rồi xác nhận" — choose, then confirm. Defaulting to Wallet would be smoother but wouldn't match the acceptance criterion. Recording it as a note means a reviewer who wants a default can see the trade-off and override it explicitly.

6. **The D3 forward reference appears three times** (§1, §8, §15) because the route key (id vs code) touches the screen inventory, the confirmation layout, and the open-items table. That's a lot of repetition for one decision — but it's the decision most likely to silently drift across `wireframes.md`, `ui-decisions.md`, and `product-backlog.md`. Repeating it in each affected doc is cheaper than discovering the drift at Task 9.

7. **One thing to fix in `ui-decisions.md` after this:** its §2 route table lists `/orders/[id]/confirmation` and this doc agrees, so no conflict — good. But `ui-decisions.md` §9 says "the confirmation route key is D3... the route shape above uses `[id]`" while this doc's §8 repeats the same. When D3 resolves, update both. I kept the duplication because a reader of either doc should see the open decision, not have to cross-reference to find it.

Next in Phase 1 order: **`docs/diagrams/README.md`** (diagram format rules, which `project-structure.md` and this doc both depend on) or jump to **`docs/architecture/adr/0001`** through **`0003`** (the early ADRs that `config.md` and `product-backlog.md` forward-reference). The ADRs are the higher-leverage next step because `config.md` §7 and `scenarios.md` §13 both have open items that close on ADR 0003/0004/0005. Want ADR 0001–0003 next?