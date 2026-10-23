/**
 * Unit tests for payment-hash.
 *
 * Why it exists:
 * - The hash is the basis of the idempotency decision. If it is not
 *   deterministic, a legitimate replay looks like a conflict; if it collides,
 *   different requests look like replays. The test pins both properties.
 *
 * What it covers:
 * - Same input -> same 64-char hex hash.
 * - Different orderId or method -> different hash.
 *
 * Not covered:
 * - Property-order sensitivity (JSON.stringify is order-sensitive). The
 *   function is always called with the same object shape, so this is a
 *   documented caveat in payment-hash.ts, not a test.
 */

import { describe, it, expect } from 'vitest';
import { hashPaymentRequest } from './payment-hash.js';

describe('hashPaymentRequest', () => {
  it('generates deterministic sha256 hex string for same input', () => {
    const input = { orderId: 'b75f858f-2878-4efc-86e7-ea1ca2c5f111', method: 'WALLET' };
    const hash1 = hashPaymentRequest(input);
    const hash2 = hashPaymentRequest(input);
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generates different hash when orderId or method changes', () => {
    const hash1 = hashPaymentRequest({ orderId: 'order-1', method: 'WALLET' });
    const hash2 = hashPaymentRequest({ orderId: 'order-2', method: 'WALLET' });
    const hash3 = hashPaymentRequest({ orderId: 'order-1', method: 'CARD' });

    expect(hash1).not.toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });
});
