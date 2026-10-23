/**
 * Loyalty points calculation — pure function for testability.
 *
 * Why it exists:
 * - ADR 0004 D7: loyalty points = floor(total / 1000) VND.
 * - Extracted so the rule can be unit-tested in isolation and reused.
 *
 * Contract:
 * - Input: orderTotal (whole VND, non-negative integer).
 * - Output: number of points (non-negative integer).
 * - Rule: floor(orderTotal / 1000).
 */
export function loyaltyPointsFor(orderTotal: number): number {
  if (orderTotal < 0) return 0;
  return Math.floor(orderTotal / 1000);
}