/**
 * Unit tests for the order state machine — the unit-level proof of graded test (a).
 *
 * Why it exists:
 * - The e2e test (test/order-state-machine.e2e-spec.ts) proves the API returns
 *   409 INVALID_STATE_TRANSITION. This file proves the rule itself is correct,
 *   exhaustively and fast, without a database.
 *
 * Coverage:
 * - Every legal edge in ADR 0004 D1/D5/D6 must not throw.
 * - A representative set of illegal edges must throw, including the graded
 *   case COMPLETED -> PAID.
 * - Also covers PAYMENT_FAILED retry edges (legal: -> PAID, -> CANCELLED;
 *   illegal: -> PREPARING, -> READY).
 *
 * Convention:
 * - Co-located with the file it tests (working-agreement.md §6: *.spec.ts next
 *   to the source). Run with `npm test` in apps/api.
 */

import { describe, it, expect } from 'vitest';
import {
  assertTransition,
  isTransitionLegal,
  InvalidStateTransitionError,
} from './order-state-machine.js';

describe('assertTransition', () => {
  // Legal edges — must not throw
  it.each([
    ['PENDING', 'PAID'],
    ['PENDING', 'PAYMENT_FAILED'],
    ['PENDING', 'CANCELLED'],
    ['PAYMENT_FAILED', 'PAID'],
    ['PAYMENT_FAILED', 'CANCELLED'],
    ['PAID', 'PREPARING'],
    ['PREPARING', 'READY'],
    ['READY', 'COMPLETED'],
  ])('allows %s -> %s', (from, to) => {
    expect(() => assertTransition(from as any, to as any)).not.toThrow();
  });

  // Illegal edges — must throw
  it.each([
    ['COMPLETED', 'PAID'],
    ['CANCELLED', 'PAID'],
    ['PAID', 'PENDING'],
    ['READY', 'PENDING'],
    ['COMPLETED', 'CANCELLED'],
    ['PAYMENT_FAILED', 'PREPARING'],
    ['PAYMENT_FAILED', 'READY'],
    ['PAYMENT_FAILED', 'PAYMENT_FAILED'],
  ])('rejects %s -> %s', (from, to) => {
    expect(() => assertTransition(from as any, to as any)).toThrow(InvalidStateTransitionError);
  });
});

describe('isTransitionLegal', () => {
  it('returns true for legal edges', () => {
    expect(isTransitionLegal('PENDING', 'PAID')).toBe(true);
    expect(isTransitionLegal('PAYMENT_FAILED', 'CANCELLED')).toBe(true);
  });
  it('returns false for illegal edges', () => {
    expect(isTransitionLegal('COMPLETED', 'PAID')).toBe(false);
    expect(isTransitionLegal('PAYMENT_FAILED', 'PREPARING')).toBe(false);
  });
});
