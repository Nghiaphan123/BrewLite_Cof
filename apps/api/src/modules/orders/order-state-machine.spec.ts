/**
 * Unit tests for the order state machine — the unit-level proof of graded test (a).
 *
 * Why it exists:
 * - The e2e test (test/order-state-machine.e2e-spec.ts) proves the API returns
 *   409 INVALID_STATE_TRANSITION. This file proves the rule itself is correct,
 *   exhaustively and fast, without a database.
 *
 * Coverage:
 * - Every arrow of the PDF §9.1 diagram is legal; every other pair of states is
 *   illegal (checked exhaustively, including the graded case COMPLETED -> PAID).
 * - Manual (admin/barista) transitions cannot enter PENDING, PAID or
 *   PAYMENT_FAILED; those belong to the payment flow.
 *
 * Convention:
 * - Co-located with the file it tests (working-agreement.md §6: *.spec.ts next
 *   to the source). Run with `npm test` in apps/api.
 */

import { describe, it, expect } from 'vitest';
import {
  assertManualTransition,
  assertTransition,
  isManualTransitionLegal,
  isTransitionLegal,
  InvalidStateTransitionError,
  nextManualStatuses,
} from './order-state-machine.js';
import type { OrderStatus } from '../../generated/prisma/enums.js';

const ALL: OrderStatus[] = ['PENDING', 'PAID', 'PAYMENT_FAILED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

/** The arrows of the PDF §9.1 diagram. */
const DIAGRAM: Array<[OrderStatus, OrderStatus]> = [
  ['PENDING', 'PAID'], // thanh toán OK
  ['PENDING', 'PAYMENT_FAILED'], // thanh toán lỗi
  ['PAYMENT_FAILED', 'PENDING'], // thử lại
  ['PENDING', 'CANCELLED'], // hủy
  ['PAYMENT_FAILED', 'CANCELLED'], // hủy
  ['PAID', 'CANCELLED'], // hủy
  ['PAID', 'PREPARING'], // barista nhận
  ['PREPARING', 'READY'], // pha xong
  ['READY', 'COMPLETED'], // giao khách
];

const isArrow = (from: OrderStatus, to: OrderStatus) =>
  DIAGRAM.some(([f, t]) => f === from && t === to);

describe('assertTransition', () => {
  it.each(DIAGRAM)('allows %s -> %s', (from, to) => {
    expect(() => assertTransition(from, to)).not.toThrow();
  });

  const illegal = ALL.flatMap((from) => ALL.map((to) => [from, to] as [OrderStatus, OrderStatus])).filter(
    ([from, to]) => !isArrow(from, to),
  );

  it.each(illegal)('rejects %s -> %s', (from, to) => {
    expect(() => assertTransition(from, to)).toThrow(InvalidStateTransitionError);
  });

  it('rejects the graded case COMPLETED -> PAID', () => {
    expect(() => assertTransition('COMPLETED', 'PAID')).toThrow(InvalidStateTransitionError);
  });

  it('a failed payment is retried through PENDING, not straight to PAID', () => {
    expect(isTransitionLegal('PAYMENT_FAILED', 'PENDING')).toBe(true);
    expect(isTransitionLegal('PAYMENT_FAILED', 'PAID')).toBe(false);
  });

  it('COMPLETED and CANCELLED are terminal', () => {
    for (const to of ALL) {
      expect(isTransitionLegal('COMPLETED', to)).toBe(false);
      expect(isTransitionLegal('CANCELLED', to)).toBe(false);
    }
  });
});

describe('manual transitions (admin/barista)', () => {
  it.each([
    ['PAID', 'PREPARING'],
    ['PREPARING', 'READY'],
    ['READY', 'COMPLETED'],
    ['PENDING', 'CANCELLED'],
    ['PAYMENT_FAILED', 'CANCELLED'],
    ['PAID', 'CANCELLED'],
  ] as Array<[OrderStatus, OrderStatus]>)('allows %s -> %s', (from, to) => {
    expect(() => assertManualTransition(from, to)).not.toThrow();
  });

  it.each([
    ['PENDING', 'PAID'],
    ['PENDING', 'PAYMENT_FAILED'],
    ['PAYMENT_FAILED', 'PENDING'],
  ] as Array<[OrderStatus, OrderStatus]>)('rejects payment-only edge %s -> %s', (from, to) => {
    expect(isTransitionLegal(from, to)).toBe(true);
    expect(isManualTransitionLegal(from, to)).toBe(false);
    expect(() => assertManualTransition(from, to)).toThrow(InvalidStateTransitionError);
  });

  it('rejects edges that are not in the diagram at all', () => {
    expect(() => assertManualTransition('COMPLETED', 'CANCELLED')).toThrow(InvalidStateTransitionError);
    expect(() => assertManualTransition('READY', 'PREPARING')).toThrow(InvalidStateTransitionError);
  });

  it('lists the next statuses a person may choose', () => {
    expect(nextManualStatuses('PENDING')).toEqual(['CANCELLED']);
    expect(nextManualStatuses('PAYMENT_FAILED')).toEqual(['CANCELLED']);
    expect(nextManualStatuses('PAID')).toEqual(['PREPARING', 'CANCELLED']);
    expect(nextManualStatuses('PREPARING')).toEqual(['READY']);
    expect(nextManualStatuses('READY')).toEqual(['COMPLETED']);
    expect(nextManualStatuses('COMPLETED')).toEqual([]);
    expect(nextManualStatuses('CANCELLED')).toEqual([]);
  });
});
