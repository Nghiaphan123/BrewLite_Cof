/**
 * Unit tests for loyaltyPointsFor.
 *
 * Boundary values from ADR 0004 D7:
 * - 0, 1, 999, 1000, 1001, 1999, 2000, 2500, 9999, 10000 VND
 * - floor-not-round behavior
 * - non-negative guarantee
 */

import { describe, it, expect } from 'vitest';
import { loyaltyPointsFor } from './loyalty.js';

describe('loyaltyPointsFor', () => {
  it('returns 0 for totals below 1000', () => {
    expect(loyaltyPointsFor(0)).toBe(0);
    expect(loyaltyPointsFor(1)).toBe(0);
    expect(loyaltyPointsFor(999)).toBe(0);
  });

  it('returns 1 for 1000..1999', () => {
    expect(loyaltyPointsFor(1000)).toBe(1);
    expect(loyaltyPointsFor(1001)).toBe(1);
    expect(loyaltyPointsFor(1999)).toBe(1);
  });

  it('returns 2 for 2000..2999', () => {
    expect(loyaltyPointsFor(2000)).toBe(2);
    expect(loyaltyPointsFor(2500)).toBe(2);
  });

  it('returns 9 for 9000..9999', () => {
    expect(loyaltyPointsFor(9999)).toBe(9);
  });

  it('returns 10 for 10000', () => {
    expect(loyaltyPointsFor(10000)).toBe(10);
  });

  it('floor behavior, not round', () => {
    expect(loyaltyPointsFor(1499)).toBe(1); // not 1.5 -> 2
    expect(loyaltyPointsFor(1500)).toBe(1); // floor, not round
  });

  it('returns 0 for negative input (defensive)', () => {
    expect(loyaltyPointsFor(-1)).toBe(0);
    expect(loyaltyPointsFor(-1000)).toBe(0);
  });
});