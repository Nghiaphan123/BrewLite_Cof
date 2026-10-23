/**
 * payment-hash — deterministic request fingerprint for idempotent payments.
 *
 * Why it exists:
 * - ADR 0004 D4 requires POST /payments to distinguish "same request replayed"
 *   (return the stored response) from "same key, different request" (409
 *   IDEMPOTENCY_CONFLICT). The comparison is on a hash, not the raw body,
 *   so the stored value is fixed-size and does not leak payload contents.
 *
 * What it hashes:
 * - { orderId, method }. The amount is server-computed from the order, so it
 *   does not need to be in the hash; including it would make a legitimate
 *   retry after a price recalculation look like a conflict.
 *
 * Caveat:
 * - JSON.stringify is order-sensitive. Callers must build the object as
 *   { orderId, method } consistently (as payments.service.ts does). If a
 *   caller ever passes a parsed request body directly, use a canonical
 *   serializer (sorted keys) instead.
 *
 * Boundary:
 * - Lives in modules/payments/ because only payments use it. The test fixture
 *   test/setup/fixtures.ts reimplements the same function; the two must stay
 *   in sync (see the comment in fixtures.ts).
 */

import { createHash } from 'node:crypto';

export function hashPaymentRequest(input: { orderId: string; method: string }): string {
  const canonical = JSON.stringify({ orderId: input.orderId, method: input.method });
  return createHash('sha256').update(canonical).digest('hex');
}
