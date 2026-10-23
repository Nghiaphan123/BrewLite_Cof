import { describe, it, expect } from 'vitest';
import { loyaltyPointsFor } from './loyalty.js';

/**
 * Unit tests for the loyalty accrual rule (ADR 0004 D7).
 *
 * Why it exists:
 * - The rule is `floor(order.total / 1000)` points per paid order. It is
 *   embedded in payments.service.ts's transaction, but the arithmetic is
 *   small enough to pin exhaustively here. The e2e tests exercise the happy
 *   path (one order, one accrual); this file pins the boundaries that the
 *   e2e tests do not reach: 0, 999, 1000, 1999, 2000 VND, and a large total.
 *
 * What it proves:
 * - The floor is a floor, not a round.
 * - Points are zero below the first 1,000 VND.
 * - Each 1,000 VND step adds exactly one point.
 *
 * Convention:
 * - Co-located with the rule (working-agreement.md §6). Run with `npm test`.
 */

/** The rule from ADR 0004 D7. Kept as a named function so the test reads as
 *  the contract, and so a future change to the rule has one place to update. */

describe('loyaltyPointsFor (ADR 0004 D7)', () => {
    // Boundaries: just below, at, and just above each step.
    it.each([
        [0, 0],
        [1, 0],
        [999, 0],
        [1000, 1],
        [1001, 1],
        [1999, 1],
        [2000, 2],
        [2500, 2],
        [9999, 9],
        [10000, 10],
    ])('total %i VND -> %i points', (total, expected) => {
        expect(loyaltyPointsFor(total)).toBe(expected);
    });

    it('is a floor, not a round (999 VND does not earn a point)', () => {
        expect(loyaltyPointsFor(999)).toBe(0);
        expect(loyaltyPointsFor(1500)).toBe(1); // round would give 2
    });

    it('scales linearly with the number of thousands', () => {
        for (let k = 0; k <= 50; k++) {
            expect(loyaltyPointsFor(k * 1000)).toBe(k);
        }
    });

    it('never returns a negative value for a non-negative total', () => {
        for (const total of [0, 1, 500, 999, 1000, 1_000_000]) {
            expect(loyaltyPointsFor(total)).toBeGreaterThanOrEqual(0);
        }
    });
});