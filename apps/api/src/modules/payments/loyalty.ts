/**
 * Loyalty accrual rule (ADR 0004 D7).
 *
 * Why a separate file:
 * - The rule is used by the payment transaction (payments.service.ts) and
 *   tested in isolation (loyalty.spec.ts). Keeping it in one place means a
 *   change to the rule (e.g. 1 point per 500 VND) updates both, and the test
 *   fails if the service is not updated with it.
 */
export function loyaltyPointsFor(orderTotal: number): number {
    return Math.floor(orderTotal / 1000);
}